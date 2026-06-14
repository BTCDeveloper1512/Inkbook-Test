import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

let _setToasts = null;
let _setConfirm = null;
let _idCounter = 0;

export const notify = {
  success: (msg) => _setToasts?.(ts => [...ts, { id: ++_idCounter, variant: "success", msg }]),
  error:   (msg) => _setToasts?.(ts => [...ts, { id: ++_idCounter, variant: "error",   msg }]),
  info:    (msg) => _setToasts?.(ts => [...ts, { id: ++_idCounter, variant: "info",    msg }]),
  warn:    (msg) => _setToasts?.(ts => [...ts, { id: ++_idCounter, variant: "warn",    msg }]),
  confirm: (msg, subMsg = null) => new Promise(resolve => _setConfirm?.({ msg, subMsg, resolve })),
};

const VARIANTS = {
  success: { icon: <CheckCircle size={15} strokeWidth={2} />, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", iconCls: "text-emerald-600" },
  error:   { icon: <XCircle     size={15} strokeWidth={2} />, bg: "bg-red-50 border-red-200",         text: "text-red-800",     iconCls: "text-red-600"     },
  info:    { icon: <Info        size={15} strokeWidth={2} />, bg: "bg-blue-50 border-blue-200",       text: "text-blue-800",    iconCls: "text-blue-600"    },
  warn:    { icon: <AlertTriangle size={15} strokeWidth={2}/>,bg: "bg-amber-50 border-amber-200",     text: "text-amber-800",   iconCls: "text-amber-600"   },
};

export function InkNotifyMount() {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const timers = useRef({});

  useEffect(() => {
    _setToasts = setToasts;
    _setConfirm = setConfirm;
    return () => { _setToasts = null; _setConfirm = null; };
  }, []);

  useEffect(() => {
    toasts.forEach(t => {
      if (!timers.current[t.id]) {
        timers.current[t.id] = setTimeout(() => {
          setToasts(ts => ts.filter(x => x.id !== t.id));
          delete timers.current[t.id];
        }, 4500);
      }
    });
  }, [toasts]);

  const dismiss = (id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(ts => ts.filter(t => t.id !== id));
  };

  const handleConfirm = (result) => {
    confirm?.resolve(result);
    setConfirm(null);
  };

  return createPortal(
    <>
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, width: 360, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        <AnimatePresence>
          {toasts.map(t => {
            const cfg = VARIANTS[t.variant] || VARIANTS.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 48, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 48, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                style={{ pointerEvents: "all" }}
                className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl font-inter ${cfg.bg}`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${cfg.iconCls}`}>{cfg.icon}</span>
                <p className={`text-sm flex-1 leading-snug ${cfg.text}`}>{t.msg}</p>
                <button onClick={() => dismiss(t.id)} className={`flex-shrink-0 p-0.5 rounded-lg hover:bg-black/10 transition-colors mt-0.5 ${cfg.text}`}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
            onClick={() => handleConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm font-inter"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-5">
                <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-500" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 text-sm leading-snug mb-1">{confirm.msg}</p>
                  {confirm.subMsg && <p className="text-xs text-zinc-500 leading-relaxed">{confirm.subMsg}</p>}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 py-2.5 px-4 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className="flex-1 py-2.5 px-4 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Bestätigen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
