import axios from "axios";

// Talks only to the new StudioOS backend (Fastify + Supabase). Kept
// separate from the old `${REACT_APP_BACKEND_URL}/api` axios calls used
// throughout the rest of the app so this page works standalone while the
// rest of the frontend is still being migrated off the old backend.
export const studioApi = axios.create({
  baseURL: process.env.REACT_APP_STUDIOOS_API,
  withCredentials: true,
});

// The access-token cookie is only good for an hour. Without this, staff got
// bounced back to /os/login mid-session the moment it expired — e.g. open
// the public-link preview in a new tab, come back a few minutes later, next
// click 401s. One 401 now gets one silent refresh-and-retry (via the
// refresh-token cookie, which lives for 30 days) before giving up and
// letting the caller's own "not logged in" handling take over.
let refreshInFlight = null;

studioApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const url = config?.url || "";
    // Auth endpoints report their own 401s for real reasons (wrong password,
    // no session to refresh, refresh itself failed) — retrying those would
    // either loop or paper over a login form's actual error message.
    const isAuthRoute = /\/auth\/(login|register|refresh|logout)/.test(url);
    if (response?.status !== 401 || isAuthRoute || config._retriedAfterRefresh) {
      throw error;
    }
    config._retriedAfterRefresh = true;

    // Several requests can 401 at once when the token expires — one shared
    // refresh call for all of them, not one per request.
    refreshInFlight =
      refreshInFlight ||
      studioApi.post("/auth/refresh").finally(() => {
        refreshInFlight = null;
      });

    try {
      await refreshInFlight;
    } catch {
      throw error;
    }
    return studioApi(config);
  }
);
