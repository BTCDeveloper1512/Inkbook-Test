import { studioApi } from "./studioApi";

// Minimal staff-auth helper for the new backend, deliberately separate from
// the old AuthContext (different backend, different response shape). Plain
// functions rather than a context — the new dashboard is one page for now,
// no need for app-wide state yet.
export const studioOsAuth = {
  login: (email, password) => studioApi.post("/auth/login", { email, password }).then((r) => r.data),
  register: (email, password, name, studioName) =>
    studioApi.post("/auth/register", { email, password, name, studioName }).then((r) => r.data),
  me: () => studioApi.get("/auth/me").then((r) => r.data),
  logout: () => studioApi.post("/auth/logout").then((r) => r.data),
  patchMe: (fields) => studioApi.patch("/auth/me", fields).then((r) => r.data),
  changePassword: (password) => studioApi.post("/auth/me/password", { password }).then((r) => r.data),
};
