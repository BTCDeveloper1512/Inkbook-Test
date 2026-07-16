import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

let _data = null;
let _promise = null;

export function getStudiosCache() { return _data; }

export function setStudiosCache(data) { _data = data; }

export function prefetchStudios() {
  if (_data || _promise) return;
  _promise = axios
    .get(`${API}/studios`)
    .then(({ data }) => { _data = data; })
    .catch(() => {})
    .finally(() => { _promise = null; });
}

export function fetchStudios() {
  if (_data) return Promise.resolve(_data);
  if (_promise) return _promise.then(() => _data);
  _promise = axios
    .get(`${API}/studios`)
    .then(({ data }) => { _data = data; return data; })
    .catch(() => { return []; })
    .finally(() => { _promise = null; });
  return _promise;
}
