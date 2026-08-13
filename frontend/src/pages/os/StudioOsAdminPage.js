import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  ShieldOff,
  KeyRound,
  Ban,
  RotateCcw,
  ScrollText,
  ArrowLeft,
  Building2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

/**
 * Plattform-Adminbereich. Deckt die Supportfälle ab, die vorher nur von Hand
 * in Supabase zu lösen waren: Studio finden, Zwei-Faktor zurücksetzen, Tarif
 * setzen, Konto sperren.
 *
 * Bewusst keine Impersonation ("als Studio anmelden") — praktisch, aber es
 * hebelt die Mandantentrennung aus.
 *
 * Jede eingreifende Aktion verlangt hier eine ausdrückliche Bestätigung, und
 * jede wird serverseitig protokolliert. Das Protokoll steht auf derselben
 * Seite, nicht weggeklickt in einem Unterpunkt: wer Konten sperren kann,
 * soll die eigene Spur im Blick haben.
 */

const PLANS = [
  { value: "kostenlos", label: "Kostenlos" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
];

const ACTION_LABEL = {
  "studio.plan_changed": "Tarif geändert",
  "staff.mfa_reset": "Zwei-Faktor zurückgesetzt",
  "staff.password_link_generated": "Passwort-Link erzeugt",
  "staff.suspended": "Konto gesperrt",
  "staff.unsuspended": "Konto entsperrt",
};

function StatTile({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-5 py-4">
      <div className="font-playfair text-2xl text-zinc-900">{value}</div>
      <div className="text-[11px] font-inter uppercase tracking-wide text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

/**
 * Eingreifende Aktionen laufen alle hier durch. Manche verlangen zusätzlich
 * einen Grund — der landet im Protokoll und ist später der einzige Hinweis
 * darauf, warum jemand gesperrt wurde.
 */
function ConfirmDialog({ title, body, confirmLabel, danger, needsReason, busy, error, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <h3 className="font-playfair text-lg text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm font-inter text-zinc-600 leading-relaxed mb-4">{body}</p>

        {needsReason && (
          <div className="mb-4">
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Grund (wird protokolliert) *</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl h-10" autoFocus />
          </div>
        )}

        {error && <p className="text-xs font-inter text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button
            onClick={() => onConfirm(reason)}
            disabled={busy || (needsReason && !reason.trim())}
            className={`flex-1 h-11 rounded-xl font-inter text-sm text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800"
            } disabled:opacity-40`}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={busy} className="h-11 rounded-xl font-inter text-sm">
            Abbrechen
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StudioOsAdminPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null); // null = wird geprüft
  const [stats, setStats] = useState(null);
  const [studios, setStudios] = useState([]);
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [passwordLink, setPasswordLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (q) => {
    const [s, list, log] = await Promise.all([adminApi.stats(), adminApi.studios(q), adminApi.audit(50)]);
    setStats(s);
    setStudios(list);
    setAudit(log);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Der Server entscheidet, nicht diese Prüfung: sie verhindert nur,
        // dass Nicht-Admins auf eine Seite voller 403-Fehler starren.
        const me = await studioOsAuth.me();
        if (!me.isPlatformAdmin) {
          setAllowed(false);
          return;
        }
        setAllowed(true);
        await load("");
      } catch {
        navigate("/os/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [load, navigate]);

  async function runSearch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      setStudios(await adminApi.studios(search));
    } finally {
      setLoading(false);
    }
  }

  async function perform(fn) {
    setBusy(true);
    setActionError("");
    try {
      const result = await fn();
      setConfirm(null);
      // Nach jedem Eingriff neu laden — sonst zeigt die Liste einen Tarif
      // oder Sperrstatus, den es so nicht mehr gibt, und das Protokoll den
      // gerade erzeugten Eintrag nicht.
      await load(search);
      return result;
    } catch (err) {
      setActionError(err.response?.data?.error || "Aktion fehlgeschlagen.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (allowed === null || (loading && !stats && allowed !== false)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm text-center">
          <ShieldOff size={22} className="text-zinc-300 mx-auto mb-3" />
          <h1 className="font-playfair text-lg text-zinc-900 mb-1">Kein Plattform-Zugang</h1>
          <p className="text-sm font-inter text-zinc-500 mb-5">Dieser Bereich ist Plattform-Admins vorbehalten.</p>
          <Link to="/os/dashboard" className="text-sm font-inter text-zinc-900 underline underline-offset-2">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 bg-zinc-50/85 backdrop-blur border-b border-zinc-200/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <StudioOSWordmark markSize={24} textSize="text-base" />
            <span className="text-[10px] font-inter uppercase tracking-[0.16em] text-white bg-zinc-900 rounded-full px-2 py-1 flex-shrink-0">
              Plattform-Admin
            </span>
          </div>
          <Link
            to="/os/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-inter text-zinc-500 hover:text-zinc-900 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Studios" value={stats.studios} />
            <StatTile label="Aktive Abos" value={stats.activeSubscriptions} />
            <StatTile label="Buchungen (7 Tage)" value={stats.bookingsLastWeek} />
            <StatTile label="Kunden gesamt" value={stats.customers} />
          </div>
        )}

        <section>
          <h2 className="font-playfair text-lg text-zinc-900 mb-1">Studios</h2>
          <p className="text-xs font-inter text-zinc-500 mb-4">Suche nach Name, Link-Kürzel oder Stadt</p>

          <form onSubmit={runSearch} className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Studio suchen…"
              className="rounded-2xl h-10 pl-10 pr-9 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  load("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={14} className="text-zinc-400" />
              </button>
            )}
          </form>

          <div className="space-y-3">
            {studios.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.04] py-12 text-center">
                <Building2 size={24} className="text-zinc-200 mx-auto mb-2" />
                <p className="text-sm font-inter text-zinc-500">Keine Studios gefunden.</p>
              </div>
            ) : (
              studios.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="min-w-0">
                      <div className="font-inter font-medium text-sm text-zinc-900">{s.name}</div>
                      <div className="text-xs font-inter text-zinc-400 font-mono mt-0.5">
                        /t/{s.slug}
                        {s.city && <span className="font-sans"> · {s.city}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={s.subscription_plan || "kostenlos"}
                        onChange={(e) =>
                          setConfirm({
                            title: "Tarif ändern",
                            body: `„${s.name}" wird auf ${
                              PLANS.find((p) => p.value === e.target.value)?.label
                            } gesetzt. Das ändert nur den Tarif in StudioOS — das Stripe-Abo bleibt unberührt.`,
                            confirmLabel: "Tarif setzen",
                            needsReason: true,
                            run: (reason) => adminApi.setPlan(s.id, e.target.value, reason),
                          })
                        }
                        className="h-9 rounded-lg border border-zinc-200 bg-white text-xs font-inter px-2 text-zinc-700"
                      >
                        {PLANS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {s.subscription_status && s.subscription_status !== "active" && (
                        <span className="text-[10px] font-inter px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          {s.subscription_status}
                        </span>
                      )}
                    </div>
                  </div>

                  {s.staff?.length > 0 && (
                    <div className="border-t border-zinc-100 pt-3 space-y-2">
                      {s.staff.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <span className="text-xs font-inter text-zinc-800">{p.name}</span>
                            <span className="text-[11px] font-inter text-zinc-400 ml-2">{p.email}</span>
                            <span className="text-[10px] font-inter uppercase tracking-wide text-zinc-300 ml-2">{p.role}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  title: "Zwei-Faktor zurücksetzen",
                                  body: `Entfernt den zweiten Faktor von ${p.email}. Beim nächsten Login muss er neu eingerichtet werden — der Zugang bleibt also nicht offen.`,
                                  confirmLabel: "Zurücksetzen",
                                  run: () => adminApi.resetMfa(p.id),
                                })
                              }
                              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-600 hover:border-zinc-400 inline-flex items-center gap-1"
                            >
                              <ShieldOff size={11} /> 2FA
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  title: "Passwort-Link erzeugen",
                                  body: `Erzeugt einen einmaligen Wiederherstellungs-Link für ${p.email}. Der Link ist so gut wie das Passwort — gib ihn nur über einen Kanal weiter, bei dem du sicher bist, wer am anderen Ende ist.`,
                                  confirmLabel: "Link erzeugen",
                                  run: async () => {
                                    const res = await adminApi.passwordLink(p.id);
                                    setPasswordLink(res);
                                    return res;
                                  },
                                })
                              }
                              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-600 hover:border-zinc-400 inline-flex items-center gap-1"
                            >
                              <KeyRound size={11} /> Passwort
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  title: "Konto sperren",
                                  body: `${p.email} kann sich danach nicht mehr anmelden. Die Daten bleiben erhalten, die Sperre lässt sich jederzeit aufheben.`,
                                  confirmLabel: "Sperren",
                                  danger: true,
                                  needsReason: true,
                                  run: (reason) => adminApi.suspend(p.id, reason),
                                })
                              }
                              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-500 hover:border-red-300 hover:text-red-600 inline-flex items-center gap-1"
                            >
                              <Ban size={11} /> Sperren
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  title: "Sperre aufheben",
                                  body: `${p.email} kann sich danach wieder anmelden.`,
                                  confirmLabel: "Entsperren",
                                  run: () => adminApi.unsuspend(p.id),
                                })
                              }
                              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-500 hover:border-zinc-400 inline-flex items-center gap-1"
                            >
                              <RotateCcw size={11} /> Entsperren
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText size={15} className="text-zinc-400" />
            <h2 className="font-playfair text-lg text-zinc-900">Protokoll</h2>
          </div>
          <p className="text-xs font-inter text-zinc-500 mb-4">
            Jeder Eingriff über diese Seite, unveränderbar mitgeschrieben
          </p>

          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
            {audit.length === 0 ? (
              <p className="text-sm font-inter text-zinc-400 text-center py-10">Noch keine Einträge.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {audit.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 p-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-xs font-inter text-zinc-900">
                        {ACTION_LABEL[a.action] || a.action}
                        {a.target_label && <span className="text-zinc-500"> · {a.target_label}</span>}
                      </div>
                      <div className="text-[11px] font-inter text-zinc-400 mt-0.5">
                        {a.actor_email} · {new Date(a.created_at).toLocaleString("de-DE")}
                        {a.detail?.reason && <span className="italic"> · „{a.detail.reason}"</span>}
                        {a.detail?.from && (
                          <span>
                            {" "}
                            · {a.detail.from} → {a.detail.to}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            {...confirm}
            busy={busy}
            error={actionError}
            onConfirm={(reason) => perform(() => confirm.run(reason))}
            onClose={() => {
              setConfirm(null);
              setActionError("");
            }}
          />
        )}

        {passwordLink && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <h3 className="font-playfair text-lg text-zinc-900 mb-1">Wiederherstellungs-Link</h3>
              <p className="text-sm font-inter text-zinc-600 mb-4">Für {passwordLink.email}</p>
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 mb-4">
                <p className="text-[11px] font-mono text-zinc-700 break-all">{passwordLink.link || "—"}</p>
              </div>
              <p className="text-[11px] font-inter text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                Der Link wird bewusst nirgends gespeichert — auch nicht im Protokoll. Schliesst du dieses Fenster, ist
                er weg und muss neu erzeugt werden.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(passwordLink.link || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-sm inline-flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Kopiert" : "Link kopieren"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPasswordLink(null)}
                  className="h-11 rounded-xl font-inter text-sm"
                >
                  Schliessen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
