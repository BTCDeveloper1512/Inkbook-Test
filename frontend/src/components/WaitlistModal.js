import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Calendar, Clock } from "lucide-react";
import { notify } from "./InkNotify";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZES = [
  { id: "mini",   label: "Mini",   desc: "Symbol, Schriftzug",  cost: 1 },
  { id: "small",  label: "Small",  desc: "bis ca. 5 cm",        cost: 2 },
  { id: "medium", label: "Medium", desc: "5–15 cm",             cost: 3 },
  { id: "large",  label: "Large",  desc: "15–25 cm",            cost: 5 },
  { id: "xl",     label: "XL",     desc: "Sleeve, Rücken",      cost: 8 },
];

export default function WaitlistModal({ studio, prefillDate, prefillMonth, onClose, onSuccess }) {
  const [mode, setMode] = useState(prefillDate ? "date" : "month");
  const [sizeCategory, setSizeCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const studioId = studio?.studio_id;
  const studioName = studio?.name || "Studio";

  const today = new Date();
  const defaultMonth = prefillMonth || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return iso; }
  };

  const fmtMonth = (ym) => {
    if (!ym) return "";
    try {
      const [y, m] = ym.split("-");
      return new Date(y, m - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    } catch { return ym; }
  };

  const handleSubmit = async () => {
    if (!sizeCategory) {
      notify("Bitte wähle eine Größe aus.", "error"); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/waitlist`, {
        studio_id: studioId,
        date: mode === "date" ? prefillDate : null,
        month: mode === "month" ? selectedMonth : null,
        size_category: sizeCategory,
        booking_type: "tattoo",
        notes,
      }, { withCredentials: true });
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 2200);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Fehler beim Eintragen.";
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
              <Bell size={15} className="text-violet-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-playfair font-semibold text-zinc-900 text-sm leading-tight">Auf Warteliste setzen</p>
              <p className="text-[10px] text-zinc-400 font-inter">{studioName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
                <Bell size={26} className="text-violet-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-playfair font-semibold text-zinc-900 text-lg">Du stehst auf der Warteliste!</p>
                <p className="text-sm text-zinc-500 font-inter mt-1.5 leading-relaxed">
                  Sobald Kapazität freigegeben wird, bekommst du sofort eine E-Mail-Benachrichtigung.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-5 space-y-5">

              {/* Mode toggle */}
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5 flex items-center gap-1.5">
                  <Calendar size={11} strokeWidth={1.5} /> Wann möchtest du einen Termin?
                </p>
                <div className="flex gap-2">
                  {prefillDate && (
                    <button
                      onClick={() => setMode("date")}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-inter font-medium border transition-all ${mode === "date" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                    >
                      <Calendar size={11} className="inline mr-1.5" strokeWidth={1.5} />
                      {fmtDate(prefillDate)}
                    </button>
                  )}
                  <button
                    onClick={() => setMode("month")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-inter font-medium border transition-all ${mode === "month" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                  >
                    <Clock size={11} className="inline mr-1.5" strokeWidth={1.5} />
                    Flexibel im Monat
                  </button>
                </div>

                {/* Month picker */}
                {mode === "month" && (
                  <div className="mt-3">
                    <input
                      type="month"
                      value={selectedMonth}
                      min={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                    />
                    <p className="text-[10px] text-zinc-400 font-inter mt-1.5">Du wirst benachrichtigt, sobald an irgendeinem Tag im {fmtMonth(selectedMonth)} Kapazität frei wird.</p>
                  </div>
                )}
                {mode === "date" && prefillDate && (
                  <p className="text-[10px] text-zinc-400 font-inter mt-2">Du wirst benachrichtigt, sobald am {fmtDate(prefillDate)} Kapazität deiner Größe frei wird.</p>
                )}
              </div>

              {/* Size selector */}
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Tattoo-Größe</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {SIZES.map(s => (
                    <button key={s.id} onClick={() => setSizeCategory(s.id)}
                      className={`py-2.5 flex flex-col items-center gap-0.5 rounded-xl border text-center transition-all ${sizeCategory === s.id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                    >
                      <span className="text-xs font-inter font-bold">{s.label}</span>
                      <span className={`text-[9px] font-inter leading-tight ${sizeCategory === s.id ? "text-white/60" : "text-zinc-400"}`}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">Anmerkungen (optional)</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Beschreibe kurz dein Tattoo-Vorhaben..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white resize-none transition-all"
                />
              </div>

              {/* Info box */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-xs font-inter text-violet-700 leading-relaxed">
                <strong>Wie funktioniert es?</strong> Wenn eine Buchung storniert wird und Kapazität für deine Größe frei wird, bekommst du sofort eine E-Mail. Du kannst dann direkt buchen.
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading || !sizeCategory}
                className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-inter font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bell size={15} strokeWidth={1.5} />
                {loading ? "Wird eingetragen…" : "Auf Warteliste setzen"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
