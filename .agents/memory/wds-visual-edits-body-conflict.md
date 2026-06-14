---
name: WDS v5 POST proxy — visual-edits body parser conflict
description: Why POST requests hang in WDS v5 when using a hand-rolled proxy alongside @emergentbase/visual-edits
---

## The rule
In this project's dev server setup, `@emergentbase/visual-edits` registers a body-parser middleware via `devServer.app.use()` inside its own `setupMiddlewares` callback. This middleware reads the **entire request body** for every POST with `Content-Type: application/json`, sets `req.body`, then calls `next()`. By the time the hand-rolled `/api` proxy middleware runs (added to the middlewares array via `middlewares.unshift()`), the readable stream is already exhausted — `req.on('data')` and `req.on('end')` will never fire.

**Why:** `devServer.app.use()` calls inside a `setupMiddlewares` callback are applied to the Express app *before* the middlewares-array for-loop. visual-edits is `originalSetupMiddlewares`, so its body-parser runs before the proxy from the array.

**How to apply:** In the `/api` proxy middleware, always check `req.body !== undefined` first. If set, convert `req.body` to a Buffer (Buffer/string/object → JSON.stringify) and forward directly. Only fall back to `req.on('data')` streaming when `req.body` is `undefined`. See `frontend/craco.config.js` → `forwardToBackend` + `apiProxyMw`.
