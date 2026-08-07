import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User, CheckCircle2, CalendarClock, Ban, ArrowLeft } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

/**
 * What you get when you click an appointment in the calendar: the details,
 * and the three things a studio actually does to a booked slot afterwards —
 * finish it, move it, or call it off.
 *
 * Finishing is where the final price is captured. It used to be a bare input
 * in the bookings list, which meant typing a number with no idea what was
 * agreed or how long the sitting ran; here it sits next to both.
 */

const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };
const SESSION_STATUS_LABEL = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  no_show: "No-Show",
  storniert: "Storniert",
};

const fmtTime = (d) => d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

function localDateValue(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SessionDialog({ item, artistName, onClose, onChanged }) {
  const start = new Date(item.raw.start_time);
  const end = new Date(start.getTime() + item.duration * 60000);
  const agreed = (item.project.offers || []).find((o) => o.status === "angenommen");

  const [mode, setMode] = useState(null); // null | "finish" | "move" | "cancel"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actualMinutes, setActualMinutes] = useState(String(item.raw.actual_duration_minutes || item.duration));
  const [finalPrice, setFinalPrice] = useState(
    String(item.project.price_final ?? agreed?.price_total ?? item.project.price_estimated ?? "")
  );
  const [moveDate, setMoveDate] = useState(localDateValue(start));
  const [moveTime, setMoveTime] = useState(fmtTime(start));

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  }

  const finish = () =>
    run(async () => {
      const minutes = parseInt(actualMinutes, 10);
      await studioApi.patch(`/studios/me/sessions/${item.id}`, {
        status: "abgeschlossen",
        ...(minutes > 0 ? { actualDurationMinutes: minutes } : {}),
      });
      await studioApi.patch(`/studios/me/bookings/${item.project.id}`, {
        status: "abgeschlossen",
        ...(finalPrice !== "" ? { priceFinal: Number(finalPrice) } : {}),
      });
    });

  const move = () =>
    run(async () => {
      const next = new Date(`${moveDate}T${moveTime}:00`);
      await studioApi.patch(`/studios/me/sessions/${item.id}`, { startTime: next.toISOString() });
    });

  const cancel = () =>
    run(async () => {
      await studioApi.patch(`/studios/me/sessions/${item.id}`, { status: "storniert" });
      await studioApi.patch(`/studios/me/bookings/${item.project.id}`, { status: "abgebrochen" });
    });

  const closed = ["abgeschlossen", "storniert", "no_show"].includes(item.raw.status);

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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-playfair text-xl text-zinc-900 truncate">{item.customerName}</h3>
            <p className="text-xs font-inter text-zinc-500 mt-0.5">
              {TYPE_LABEL[item.project.appointment_type]} · {SESSION_STATUS_LABEL[item.raw.status]}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-zinc-50 px-3 py-2.5 space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs font-inter text-zinc-700">
            <Clock size={12} className="text-zinc-400" />
            {start.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}, {fmtTime(start)}–{fmtTime(end)}
          </div>
          <div className="flex items-center gap-2 text-xs font-inter text-zinc-700">
            <User size={12} className="text-zinc-400" />
            {artistName}
          </div>
          {agreed && (
            <div className="text-xs font-inter text-zinc-500">
              Vereinbart: {Number(agreed.price_total).toFixed(0)} € · {agreed.duration_minutes} Min.
            </div>
          )}
        </div>

        {error && <p className="text-xs font-inter text-red-600 mb-3">{error}</p>}

        <AnimatePresence mode="wait">
          {mode === null && (
            <motion.div key="menu" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-2">
              {closed ? (
                <p className="text-xs font-inter text-zinc-400 text-center py-3">
                  Dieser Termin ist abgeschlossen — hier gibt es nichts mehr zu tun.
                </p>
              ) : (
                [
                  { key: "finish", icon: CheckCircle2, label: "Abschließen", desc: "Dauer und Endpreis festhalten" },
                  { key: "move", icon: CalendarClock, label: "Umbuchen", desc: "Auf einen anderen Termin legen" },
                  { key: "cancel", icon: Ban, label: "Stornieren", desc: "Termin absagen" },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <motion.button
                    key={key}
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setMode(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${
                      key === "cancel" ? "border-zinc-200 hover:border-red-300 hover:bg-red-50/50" : "border-zinc-200 hover:border-zinc-900"
                    }`}
                  >
                    <Icon size={16} className={key === "cancel" ? "text-red-500" : "text-zinc-500"} strokeWidth={1.5} />
                    <div className="min-w-0">
                      <div className="font-inter text-sm text-zinc-900">{label}</div>
                      <div className="font-inter text-[11px] text-zinc-500">{desc}</div>
                    </div>
                  </motion.button>
                ))
              )}
            </motion.div>
          )}

          {mode === "finish" && (
            <motion.div key="finish" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Tatsächliche Dauer (Min.)</label>
                  <Input type="number" min="1" value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Endpreis (€)</label>
                  <Input type="number" min="0" step="5" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} className="rounded-xl h-10" />
                </div>
              </div>
              <p className="text-[11px] font-inter text-zinc-400">
                Geschätzt waren {item.duration} Min. Die Abweichung fließt in künftige Schätzungen ein.
              </p>
              <Button onClick={finish} disabled={busy} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
                {busy ? "…" : "Abschließen"}
              </Button>
            </motion.div>
          )}

          {mode === "move" && (
            <motion.div key="move" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Datum</label>
                  <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Uhrzeit</label>
                  <Input type="time" value={moveTime} onChange={(e) => setMoveTime(e.target.value)} className="rounded-xl h-10" />
                </div>
              </div>
              <p className="text-[11px] font-inter text-zinc-400">Der Kunde sieht den neuen Termin sofort in seinem Konto.</p>
              <Button onClick={move} disabled={busy} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
                {busy ? "…" : "Umbuchen"}
              </Button>
            </motion.div>
          )}

          {mode === "cancel" && (
            <motion.div key="cancel" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-3">
              <p className="text-xs font-inter text-zinc-600">
                Termin am {start.toLocaleDateString("de-DE", { day: "2-digit", month: "long" })} um {fmtTime(start)} absagen? Der Kunde wird
                benachrichtigt.
              </p>
              <Button onClick={cancel} disabled={busy} className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-inter">
                {busy ? "…" : "Ja, stornieren"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {mode !== null && (
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setError("");
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-3"
          >
            <ArrowLeft size={12} /> Zurück
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
