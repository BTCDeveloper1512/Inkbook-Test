import { studioApi } from "./studioApi";

/**
 * Der Plattform-Adminbereich. Läuft über dieselbe Axios-Instanz wie alles
 * andere — also mit denselben Session-Cookies und demselben stillen
 * Token-Refresh bei 401.
 *
 * Nichts hier prüft Berechtigungen: das tut ausschliesslich der Server
 * (requirePlatformAdmin). Diese Datei ist nur die Hülle um die Endpoints.
 */
export const adminApi = {
  stats: () => studioApi.get("/admin/stats").then((r) => r.data),

  /** Suche über Name, Slug und Stadt. Ohne Suchbegriff die 50 neuesten Studios. */
  studios: (q) => studioApi.get("/admin/studios", { params: q ? { q } : {} }).then((r) => r.data),

  setPlan: (studioId, plan, reason) =>
    studioApi.post(`/admin/studios/${studioId}/plan`, { plan, reason }).then((r) => r.data),

  resetMfa: (staffId) => studioApi.post(`/admin/staff/${staffId}/reset-mfa`).then((r) => r.data),
  passwordLink: (staffId) => studioApi.post(`/admin/staff/${staffId}/password-link`).then((r) => r.data),
  suspend: (staffId, reason) => studioApi.post(`/admin/staff/${staffId}/suspend`, { reason }).then((r) => r.data),
  unsuspend: (staffId) => studioApi.post(`/admin/staff/${staffId}/unsuspend`).then((r) => r.data),

  audit: (limit = 100) => studioApi.get("/admin/audit", { params: { limit } }).then((r) => r.data),
};
