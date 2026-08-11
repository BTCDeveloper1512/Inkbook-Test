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
  changeEmail: (email) => studioApi.post("/auth/me/email", { email }).then((r) => r.data),
  changePassword: (password) => studioApi.post("/auth/me/password", { password }).then((r) => r.data),

  // Two-factor. Enroll and challenge/verify are separate calls because
  // enrolling only creates the factor — Supabase doesn't consider it real
  // until a challenge for it has actually been answered correctly once,
  // which is also the same round trip a later login's re-verification uses.
  mfaEnroll: () => studioApi.post("/auth/mfa/enroll").then((r) => r.data),
  mfaChallenge: (factorId) => studioApi.post("/auth/mfa/challenge", factorId ? { factorId } : {}).then((r) => r.data),
  mfaVerify: (factorId, challengeId, code) => studioApi.post("/auth/mfa/verify", { factorId, challengeId, code }).then((r) => r.data),
  mfaUnenroll: () => studioApi.post("/auth/mfa/unenroll").then((r) => r.data),
};
