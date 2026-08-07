import { useEffect, useRef } from "react";

/**
 * Subscribes to the backend's SSE stream and calls back when something the
 * viewer cares about changed. EventSource sends cookies on same-site requests
 * and reconnects on its own, so there's no polling and no token handling here.
 *
 * `onEvent` is held in a ref rather than being a dependency: it's almost
 * always an inline arrow, and rebuilding the connection on every render would
 * make the stream reconnect continuously.
 */
export function useLiveUpdates(path, onEvent, enabled = true) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled || !path) return undefined;
    const base = process.env.REACT_APP_STUDIOOS_API;
    const source = new EventSource(`${base}${path}`, { withCredentials: true });

    const forward = (type) => (e) => {
      let data = null;
      try {
        data = JSON.parse(e.data);
      } catch {
        /* a heartbeat or a malformed frame — nothing to hand on */
      }
      handler.current?.(type, data);
    };

    const listeners = ["booking", "notification"].map((type) => {
      const fn = forward(type);
      source.addEventListener(type, fn);
      return [type, fn];
    });

    return () => {
      listeners.forEach(([type, fn]) => source.removeEventListener(type, fn));
      source.close();
    };
  }, [path, enabled]);
}
