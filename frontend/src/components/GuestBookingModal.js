import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, CheckCircle, Send, User, Mail, FileText } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZES = ["Klein (bis 5 cm)", "Mittel (5–15 cm)", "Groß (15–25 cm)", "XL (25 cm+)", "Ganzkörper"];
const BODY_PARTS = ["Arm", "Unterarm", "Oberarm", "Rücken", "Brust", "Bein", "Oberschenkel", "Wade", "Schulter", "Hals", "Hand", "Fuß", "Rippen", "Bauch", "Anderes"];

function ProgressSteps({ active }) {
  const steps = [
    { n: 1, label: "Anfrage senden" },
    { n: 2, label: "Preis erhalten" },
    { n: 3, label: "Bestätigen & zahlen" },
  ];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-inter font-bold transition-colors ${s.n <= active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"}`}>
              {s.n < active ? <CheckCircle size={11} strokeWidth={2.5} /> : s.n}
            </div>
            <span className={`text-[11px] font-inter whitespace-nowrap transition-colors ${s.n <= active ? "text-zinc-700 font-medium" : "text-zinc-400"}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-zinc-200 min-w-[6px]" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function GuestBookingModal({ studio, onClose }) {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", tattoo_description: "", size: "", body_part: "" });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.tattoo_description.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus."); return;
    }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/inquiries`, {
        studio_id: studio.studio_id,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        tattoo_description: form.tattoo_description.trim(),
        size: form.size || null,
        body_part: form.body_part || null,
      });
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Senden. Bitte versuche es erneut.");
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[94vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
          data-testid="guest-booking-modal"
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-zinc-200 rounded-full" />
          </div>

          {step === "form" ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-playfair font-semibold text-xl text-zinc-900">Termin anfragen</h2>
                  <p className="text-xs text-zinc-500 font-inter mt-0.5">{studio.name} · Kein Account nötig</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <ProgressSteps active={1} />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Dein Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="text" value={form.name} onChange={e => update("name", e.target.value)}
                      placeholder="Max Mustermann" required className="input-base w-full pl-9"
                      data-testid="guest-name-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">E-Mail *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="email" value={form.email} onChange={e => update("email", e.target.value)}
                      placeholder="deine@email.de" required className="input-base w-full pl-9"
                      data-testid="guest-email-input"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-inter mt-1">Wir senden dir Updates per E-Mail — kein Spam.</p>
                </div>

                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Tattoo-Beschreibung *</label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                    <textarea
                      value={form.tattoo_description} onChange={e => update("tattoo_description", e.target.value)}
                      placeholder="Beschreibe dein Wunsch-Tattoo: Motiv, Stil, Farben, besondere Details..."
                      rows={4} required className="input-base w-full pl-9 resize-none"
                      data-testid="guest-description-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Größe</label>
                    <select value={form.size} onChange={e => update("size", e.target.value)} className="input-base w-full">
                      <option value="">Bitte wählen</option>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Körperstelle</label>
                    <select value={form.body_part} onChange={e => update("body_part", e.target.value)} className="input-base w-full">
                      <option value="">Bitte wählen</option>
                      {BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-inter px-3 py-2.5 rounded-xl">{error}</div>
                )}

                <motion.button
                  type="submit" disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary w-full justify-center gap-2 disabled:opacity-50"
                  data-testid="guest-submit-btn"
                >
                  <Send size={14} strokeWidth={1.5} />
                  {loading ? "Wird gesendet…" : "Anfrage absenden"}
                </motion.button>

                <p className="text-center text-xs text-zinc-400 font-inter">
                  Bereits ein Konto?{" "}
                  <a href="/login" className="text-zinc-700 underline underline-offset-2 hover:text-zinc-900 transition-colors">Jetzt anmelden</a>
                </p>
              </form>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <h2 className="font-playfair font-semibold text-xl text-zinc-900 mb-2">Anfrage gesendet!</h2>
              <p className="text-sm text-zinc-500 font-inter leading-relaxed mb-6">
                Deine Anfrage wurde an <strong className="text-zinc-800">{studio.name}</strong> gesendet.
                Das Studio meldet sich in Kürze per E-Mail bei dir.
              </p>

              <div className="bg-zinc-50 rounded-2xl p-4 mb-5 text-left space-y-3">
                {[
                  { done: true,  n: 1, label: "Anfrage gesendet ✅",      sub: "Das Studio wurde benachrichtigt" },
                  { done: false, n: 2, label: "Preis erhalten 💬",         sub: "Das Studio sendet dir ein Angebot" },
                  { done: false, n: 3, label: "Bestätigen & zahlen 💳",    sub: "Termin buchen & Anzahlung leisten" },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${s.done ? "bg-emerald-500" : "bg-zinc-200"}`}>
                      {s.done
                        ? <CheckCircle size={13} className="text-white" strokeWidth={2.5} />
                        : <span className="text-[10px] font-bold text-zinc-400">{s.n}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-inter font-semibold ${s.done ? "text-zinc-900" : "text-zinc-400"}`}>{s.label}</p>
                      <p className="text-xs text-zinc-400 font-inter">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-400 font-inter mb-5">
                Du erhältst eine E-Mail mit weiteren Updates. Wenn das Studio antwortet, kannst du dein Konto mit einem Passwort aktivieren und direkt chatten.
              </p>

              <motion.button onClick={onClose} whileTap={{ scale: 0.97 }} className="btn-primary w-full justify-center">
                Alles klar
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
