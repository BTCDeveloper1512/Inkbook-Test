import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ── Studios list cache ────────────────────────────────────────────────────────
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
    .catch(() => [])
    .finally(() => { _promise = null; });
  return _promise;
}

// ── Individual studio cache ───────────────────────────────────────────────────
const _studioCache = {}; // { [studioId]: { studio, reviews, artists, shop } }
const _studioPromise = {}; // in-flight prefetch promises

export function getStudioCache(studioId) {
  return _studioCache[studioId] || null;
}

export function setStudioCache(studioId, data) {
  _studioCache[studioId] = data;
}

export function prefetchStudio(studioId) {
  if (!studioId) return;
  if (_studioCache[studioId] || _studioPromise[studioId]) return;
  _studioPromise[studioId] = axios.get(`${API}/studios/${studioId}`).then(async (studioRes) => {
    const resolvedId = studioRes.data.studio_id;
    const [reviewsRes, artistsRes, shopRes] = await Promise.all([
      axios.get(`${API}/studios/${resolvedId}/reviews`),
      axios.get(`${API}/studios/${resolvedId}/artists`),
      axios.get(`${API}/studios/${resolvedId}/shop`).catch(() => ({ data: [] })),
    ]);
      _studioCache[studioId] = {
        studio: studioRes.data,
        reviews: reviewsRes.data,
        artists: artistsRes.data,
        shop: shopRes.data || [],
      };
    })
    .catch(() => {})
    .finally(() => { delete _studioPromise[studioId]; });
}

export function fetchStudio(studioId) {
  if (_studioCache[studioId]) return Promise.resolve(_studioCache[studioId]);
  if (_studioPromise[studioId]) return _studioPromise[studioId].then(() => _studioCache[studioId]);
  return axios.get(`${API}/studios/${studioId}`).then(async (studioRes) => {
    const resolvedId = studioRes.data.studio_id;
    const [reviewsRes, artistsRes, shopRes] = await Promise.all([
      axios.get(`${API}/studios/${resolvedId}/reviews`),
      axios.get(`${API}/studios/${resolvedId}/artists`),
      axios.get(`${API}/studios/${resolvedId}/shop`).catch(() => ({ data: [] })),
    ]);
    const cached = {
      studio: studioRes.data,
      reviews: reviewsRes.data,
      artists: artistsRes.data,
      shop: shopRes.data || [],
    };
    _studioCache[studioId] = cached;
    return cached;
  });
}
