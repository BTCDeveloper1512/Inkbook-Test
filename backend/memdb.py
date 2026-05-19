"""
Persistent in-memory database that mimics the Motor (async MongoDB) API.
Data is saved to data.json after every write and loaded on startup.
"""
import copy
import json
import os
from typing import Any, Dict, List
from bson import ObjectId

_DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")


# ── JSON serialisation helpers ────────────────────────────────────────────────

def _to_str(v):
    return str(v) if isinstance(v, ObjectId) else v


def _json_default(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _save_db(collections: Dict[str, List]):
    """Write all collection data to disk."""
    try:
        tmp = _DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(collections, f, default=_json_default, ensure_ascii=False)
        os.replace(tmp, _DATA_FILE)
    except Exception as e:
        print(f"[memdb] Warning: could not save data.json: {e}")


def _load_db() -> Dict[str, List]:
    """Load collection data from disk, returning empty dict on first run."""
    if not os.path.exists(_DATA_FILE):
        return {}
    try:
        with open(_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[memdb] Warning: could not load data.json ({e}), starting fresh.")
        return {}


# ── Shared storage (loaded once at module import) ─────────────────────────────

_STORE: Dict[str, List] = _load_db()


# ── Query helpers ─────────────────────────────────────────────────────────────

def _match_value(doc_val, condition):
    if not isinstance(condition, dict):
        # Array "contains" check: {"participants": user_id} → list contains value
        if isinstance(doc_val, list):
            return _to_str(condition) in [_to_str(v) for v in doc_val]
        return _to_str(doc_val) == _to_str(condition)
    for op, val in condition.items():
        if op == "$eq":
            if isinstance(doc_val, list):
                if _to_str(val) not in [_to_str(v) for v in doc_val]:
                    return False
            elif _to_str(doc_val) != _to_str(val):
                return False
        elif op == "$ne":
            if _to_str(doc_val) == _to_str(val):
                return False
        elif op == "$gt":
            if doc_val is None or str(doc_val) <= str(val):
                return False
        elif op == "$gte":
            if doc_val is None or str(doc_val) < str(val):
                return False
        elif op == "$lt":
            if doc_val is None or str(doc_val) >= str(val):
                return False
        elif op == "$lte":
            if doc_val is None or str(doc_val) > str(val):
                return False
        elif op == "$in":
            if _to_str(doc_val) not in [_to_str(v) for v in val]:
                return False
        elif op == "$nin":
            if _to_str(doc_val) in [_to_str(v) for v in val]:
                return False
        elif op == "$exists":
            exists = doc_val is not None
            if val and not exists:
                return False
            if not val and exists:
                return False
        elif op == "$regex":
            import re
            flags = 0
            if condition.get("$options", "") and "i" in condition.get("$options", ""):
                flags = re.IGNORECASE
            if doc_val is None or not re.search(str(val), str(doc_val), flags):
                return False
        else:
            return False
    return True


def _get_nested(doc, key):
    parts = key.split(".")
    val = doc
    for part in parts:
        if isinstance(val, dict):
            val = val.get(part)
        else:
            return None
    return val


def _matches_filter(doc, filter_dict):
    if not filter_dict:
        return True
    for key, condition in filter_dict.items():
        if key == "$or":
            if not any(_matches_filter(doc, sub) for sub in condition):
                return False
        elif key == "$and":
            if not all(_matches_filter(doc, sub) for sub in condition):
                return False
        elif key == "$nor":
            if any(_matches_filter(doc, sub) for sub in condition):
                return False
        else:
            doc_val = _get_nested(doc, key)
            if not _match_value(doc_val, condition):
                return False
    return True


def _apply_projection(doc, projection):
    if not projection:
        return doc
    include_mode = any(v == 1 for k, v in projection.items() if k != "_id")
    if include_mode:
        result = {}
        for key, val in projection.items():
            if val == 1 and key in doc:
                result[key] = doc[key]
        if "_id" in doc and projection.get("_id") != 0:
            result["_id"] = doc.get("_id")
    else:
        result = dict(doc)
        for key, val in projection.items():
            if val == 0:
                result.pop(key, None)
    return result


def _set_nested(doc, key, value):
    parts = key.split(".")
    d = doc
    for part in parts[:-1]:
        if part not in d:
            d[part] = {}
        d = d[part]
    d[parts[-1]] = value


def _apply_update(doc, update_dict):
    for op, fields in update_dict.items():
        if op == "$set":
            for k, v in fields.items():
                _set_nested(doc, k, v)
        elif op == "$unset":
            for k in fields:
                doc.pop(k, None)
        elif op == "$push":
            for k, v in fields.items():
                if k not in doc or not isinstance(doc[k], list):
                    doc[k] = []
                doc[k].append(v)
        elif op == "$pull":
            for k, condition in fields.items():
                if k in doc and isinstance(doc[k], list):
                    if isinstance(condition, dict):
                        doc[k] = [item for item in doc[k]
                                   if not _matches_filter(
                                       item if isinstance(item, dict) else {"_v": item},
                                       condition if not any(kk.startswith("$") for kk in condition) else condition)]
                    else:
                        doc[k] = [item for item in doc[k] if item != condition]
        elif op == "$addToSet":
            for k, v in fields.items():
                if k not in doc or not isinstance(doc[k], list):
                    doc[k] = []
                if v not in doc[k]:
                    doc[k].append(v)
        elif op == "$inc":
            for k, v in fields.items():
                current = _get_nested(doc, k)
                _set_nested(doc, k, (current or 0) + v)
    return doc


def _sort_key(doc, key):
    val = doc.get(key)
    if val is None:
        return (1, "")
    return (0, str(val))


# ── Cursor classes ────────────────────────────────────────────────────────────

class UpdateResult:
    def __init__(self, matched, modified):
        self.matched_count = matched
        self.modified_count = modified


class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FindCursor:
    def __init__(self, docs):
        self._docs = docs
        self._skip_n = 0
        self._limit_n = None
        self._sort_keys = []

    def skip(self, n):
        self._skip_n = n
        return self

    def limit(self, n):
        self._limit_n = n
        return self

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            self._sort_keys = key_or_list
        else:
            self._sort_keys = [(key_or_list, direction if direction is not None else 1)]
        return self

    def _get_docs(self):
        docs = list(self._docs)
        if self._sort_keys:
            for key, direction in reversed(self._sort_keys):
                reverse = (direction == -1)
                docs.sort(key=lambda d: _sort_key(d, key), reverse=reverse)
        if self._skip_n:
            docs = docs[self._skip_n:]
        if self._limit_n is not None:
            docs = docs[:self._limit_n]
        return docs

    async def to_list(self, length=None):
        docs = self._get_docs()
        if length is not None:
            docs = docs[:length]
        return docs


class AggregateCursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, length=None):
        if length is not None:
            return self._docs[:length]
        return self._docs


# ── Collection ────────────────────────────────────────────────────────────────

class Collection:
    def __init__(self, name: str):
        self._name = name
        if name not in _STORE:
            _STORE[name] = []

    @property
    def _docs(self) -> List:
        return _STORE[self._name]

    def _save(self):
        _save_db(_STORE)

    async def create_index(self, *args, **kwargs):
        pass

    async def find_one(self, filter_dict=None, projection=None):
        for doc in self._docs:
            if _matches_filter(doc, filter_dict or {}):
                result = copy.deepcopy(doc)
                if projection:
                    result = _apply_projection(result, projection)
                return result
        return None

    def find(self, filter_dict=None, projection=None):
        matched = [
            _apply_projection(copy.deepcopy(d), projection)
            for d in self._docs
            if _matches_filter(d, filter_dict or {})
        ]
        return FindCursor(matched)

    async def insert_one(self, doc):
        new_doc = copy.deepcopy(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(ObjectId())
        else:
            new_doc["_id"] = _to_str(new_doc["_id"])
        self._docs.append(new_doc)
        self._save()
        return InsertOneResult(new_doc["_id"])

    async def update_one(self, filter_dict, update_dict, upsert=False):
        for doc in self._docs:
            if _matches_filter(doc, filter_dict):
                _apply_update(doc, update_dict)
                self._save()
                return UpdateResult(1, 1)
        if upsert:
            new_doc = {}
            for k, v in filter_dict.items():
                if not k.startswith("$"):
                    new_doc[k] = v
            _apply_update(new_doc, update_dict)
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            self._docs.append(new_doc)
            self._save()
            return UpdateResult(0, 1)
        return UpdateResult(0, 0)

    async def update_many(self, filter_dict, update_dict):
        count = 0
        for doc in self._docs:
            if _matches_filter(doc, filter_dict):
                _apply_update(doc, update_dict)
                count += 1
        if count:
            self._save()
        return UpdateResult(count, count)

    async def delete_one(self, filter_dict):
        for i, doc in enumerate(self._docs):
            if _matches_filter(doc, filter_dict):
                self._docs.pop(i)
                self._save()
                return

    async def delete_many(self, filter_dict):
        before = len(self._docs)
        _STORE[self._name] = [d for d in self._docs if not _matches_filter(d, filter_dict)]
        if len(self._docs) != before:
            self._save()

    async def count_documents(self, filter_dict=None):
        return sum(1 for d in self._docs if _matches_filter(d, filter_dict or {}))

    def aggregate(self, pipeline):
        docs = [copy.deepcopy(d) for d in self._docs]
        for stage in pipeline:
            if "$match" in stage:
                docs = [d for d in docs if _matches_filter(d, stage["$match"])]
            elif "$group" in stage:
                group_spec = stage["$group"]
                id_expr = group_spec.get("_id")
                groups: Dict[Any, Dict] = {}
                for doc in docs:
                    if id_expr is None:
                        gk = None
                    elif isinstance(id_expr, str) and id_expr.startswith("$"):
                        gk = doc.get(id_expr[1:])
                    else:
                        gk = id_expr
                    if gk not in groups:
                        groups[gk] = {"_id": gk}
                        for out_key, agg_expr in group_spec.items():
                            if out_key == "_id":
                                continue
                            if isinstance(agg_expr, dict) and "$sum" in agg_expr:
                                groups[gk][out_key] = 0
                    for out_key, agg_expr in group_spec.items():
                        if out_key == "_id":
                            continue
                        if isinstance(agg_expr, dict):
                            if "$sum" in agg_expr:
                                val = agg_expr["$sum"]
                                if isinstance(val, str) and val.startswith("$"):
                                    field_val = doc.get(val[1:]) or 0
                                    groups[gk][out_key] = groups[gk].get(out_key, 0) + (field_val if isinstance(field_val, (int, float)) else 0)
                                elif isinstance(val, (int, float)):
                                    groups[gk][out_key] = groups[gk].get(out_key, 0) + val
                docs = list(groups.values())
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for key, direction in reversed(list(sort_spec.items())):
                    docs.sort(key=lambda d: _sort_key(d, key), reverse=(direction == -1))
            elif "$limit" in stage:
                docs = docs[:stage["$limit"]]
        return AggregateCursor(docs)


# ── Database ──────────────────────────────────────────────────────────────────

class PersistentDatabase:
    """Persistent database — collections backed by data.json."""

    def __init__(self):
        self._collections: Dict[str, Collection] = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = Collection(name)
        return self._collections[name]

    def __getitem__(self, name):
        return getattr(self, name)


db = PersistentDatabase()
print(f"[memdb] Loaded {sum(len(v) for v in _STORE.values())} documents from {_DATA_FILE}")
