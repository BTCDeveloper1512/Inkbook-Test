import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Tag } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { DAY_SLOTS, SLOT_LABEL, slotStartHour } from "../../lib/daySlots";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

/**
 * What the studio sends back to a request: price, duration and the actual
 * appointment time. Accepting it books that time outright, so this form is
 * the last point at which the studio can still choose it freely.
 *
 * Visual language (blurred backdrop, spring panel) is lifted from the old
 * dashboard's offer modal so the two halves of the product don't feel like
 * they were built by different people.
 */

/** Sensible clock time for a band, so the studio nudges rather than types. */
function slotDefaultTime(slot) {
  return `${String(slotStartHour(slot || "nachmittags")).padStart(2, "0")}:00`;
}

export default function OfferModal({ booking, onClose, onSent }) {
  const [form, setForm] = useState(() => ({
    priceTotal: booking.price_estimated ?? "",
    durationHours: "2",
    offerDate: booking.preferred_date || "",
    offerSlot: booking.preferred_slot || "nachmittags",
    offerTime: slotDefaultTime(booking.preferred_slot),
    notes: "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function send() {
    if (!form.priceTotal || !form.offerDate || !form.offerTime || !form.durationHours) {
      setError("Preis, Datum, Uhrzeit und Dauer werden gebraucht.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Composed here so the clock time means what was typed, in this browser's
      // zone, rather than being reassembled server-side from date + time.
      const startsAt = new Date(`${form.offerDate}T${form.offerTime}:00`);
      const { data } = await studioApi.post(`/studios/me/bookings/${booking.id}/offer`, {
        priceTotal: Number(form.priceTotal),
        durationMinutes: Math.round(Number(form.durationHours) * 60),
        offerDate: form.offerDate,
        offerSlot: form.offerSlot,
        offerStartsAt: startsAt.toISOString(),
        notes: form.notes || undefined,
      });
      onSent(booking.id, data, booking._waitlistEntryId);
      if (data.clash) {
        window.alert(
          `Hinweis: Zu dieser Zeit steht bereits ein Termin (${new Date(data.clash.startTime).toLocaleString("de-DE")}). Das Angebot wurde trotzdem gesendet.`
        );
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.formErrors?.[0] || "Angebot konnte nicht gesendet werden.");
    } finally {
      setSaving(false);
    }
  }

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
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-xl text-zinc-900">Angebot erstellen</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-zinc-500 font-inter mb-4">
          Für <span className="font-semibold text-zinc-800">{booking.customers?.name || "—"}</span>
          {booking.title && <> · <span className="italic">"{booking.title}"</span></>}
        </p>

        {(booking.preferred_date || booking.preferred_time) && (
          <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 mb-4">
            <Tag size={12} className="text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-600 font-inter">
              Wunsch des Kunden:{" "}
              {booking.preferred_date && new Date(booking.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long" })}
              {booking.preferred_slot && <>, {SLOT_LABEL[booking.preferred_slot]?.toLowerCase()}</>}
              {booking.preferred_time && <> — "{booking.preferred_time}"</>}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Gesamtpreis (€) *</label>
              <Input
                type="number"
                min="0"
                step="5"
                placeholder="450"
                value={form.priceTotal}
                onChange={(e) => set("priceTotal", e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div>
              <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Dauer (Stunden) *</label>
              <Input
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                placeholder="2"
                value={form.durationHours}
                onChange={(e) => set("durationHours", e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Datum *</label>
              <Input type="date" value={form.offerDate} onChange={(e) => set("offerDate", e.target.value)} className="rounded-xl h-10" />
            </div>
            <div>
              <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Uhrzeit *</label>
              <Input type="time" value={form.offerTime} onChange={(e) => set("offerTime", e.target.value)} className="rounded-xl h-10" />
            </div>
          </div>

          <div>
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1.5 block">Tageszeit *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DAY_SLOTS.map((s) => (
                <motion.button
                  key={s.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  // Picking a band also moves the clock time to it, so the two
                  // can't quietly disagree about when the appointment is.
                  onClick={() => setForm((f) => ({ ...f, offerSlot: s.value, offerTime: slotDefaultTime(s.value) }))}
                  className={`px-2 py-2 rounded-xl border text-[11px] font-inter transition-colors ${
                    form.offerSlot === s.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Notiz (optional)</label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Weitere Informationen für den Kunden..."
              className="rounded-xl min-h-[70px]"
            />
          </div>
        </div>

        {error && <p className="text-xs font-inter text-red-600 mt-3">{error}</p>}

        <p className="text-[11px] font-inter text-zinc-400 mt-3 leading-snug">
          Sagt der Kunde zu, steht der Termin sofort mit dieser Uhrzeit in deinem Kalender. Verschieben kannst du ihn danach jederzeit per Drag.
        </p>

        <Button
          onClick={send}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-4"
        >
          {saving ? "Wird gesendet…" : "Angebot senden"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
