"""Idempotent StudioOS tenant migration for the legacy JSON data store.

Run from backend/: python migrate_tenants.py
Creates a timestamped backup before writing and only adds missing tenant fields.
"""
import json
import re
import shutil
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).with_name("data.json")

def slugify(value):
    value = unicodedata.normalize("NFKD", (value or "").lower())
    value = value.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:60] or "studio"

def main():
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    backup = DATA.with_name(f"data.pre-tenant-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json")
    shutil.copy2(DATA, backup)
    studios = raw.setdefault("studios", [])
    memberships = raw.setdefault("workspace_memberships", [])
    used = {s.get("slug") for s in studios if s.get("slug")}
    changed = 0
    for studio in studios:
        workspace_id = studio.setdefault("workspace_id", f"ws_{uuid.uuid4().hex[:12]}")
        if not studio.get("slug"):
            base = slugify(studio.get("name") or studio.get("studio_id"))
            slug, n = base, 2
            while slug in used:
                slug, n = f"{base[:54]}-{n}", n + 1
            studio["slug"] = slug
            used.add(slug)
        studio.setdefault("published", studio.get("is_active", True))
        owner_id = studio.get("owner_id")
        if owner_id and not any(m.get("workspace_id") == workspace_id and m.get("user_id") == owner_id for m in memberships):
            memberships.append({
                "membership_id": f"member_{uuid.uuid4().hex[:12]}",
                "workspace_id": workspace_id,
                "studio_id": studio.get("studio_id"),
                "user_id": owner_id,
                "role": "owner",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        changed += 1
    workspace_by_studio = {
        studio.get("studio_id"): studio.get("workspace_id")
        for studio in studios
        if studio.get("studio_id") and studio.get("workspace_id")
    }
    tenant_documents = 0
    for collection_name, documents in raw.items():
        if collection_name in {"studios", "workspace_memberships"} or not isinstance(documents, list):
            continue
        for document in documents:
            if not isinstance(document, dict) or document.get("workspace_id"):
                continue
            workspace_id = workspace_by_studio.get(document.get("studio_id"))
            if workspace_id:
                document["workspace_id"] = workspace_id
                tenant_documents += 1
    DATA.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
    print(f"Migrated {changed} studios and {tenant_documents} tenant documents. Backup: {backup.name}")

if __name__ == "__main__":
    main()