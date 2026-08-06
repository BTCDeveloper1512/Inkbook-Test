import axios from "axios";

// Talks only to the new StudioOS backend (Fastify + Supabase). Kept
// separate from the old `${REACT_APP_BACKEND_URL}/api` axios calls used
// throughout the rest of the app so this page works standalone while the
// rest of the frontend is still being migrated off the old backend.
export const studioApi = axios.create({
  baseURL: process.env.REACT_APP_STUDIOOS_API,
  withCredentials: true,
});
