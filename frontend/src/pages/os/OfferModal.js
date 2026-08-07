import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Tag } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { DAY_SLOTS, SLOT_LABEL } from "../../lib/daySlots";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

/**
 * What the studio sends back to a request. Deliberately no clock time: the
 * customer agrees to a price, a duration and a rough time of day, and the
 * studio picks the exact slot afterwards by dragging it into the calendar.
 *
 * Visual language (blurred backdrop, spring panel) is lifted from the old
 * dashboard's offer modal so the two halves of the product don't feel like
 * they were built by different people.
 */
export default function OfferModal({ booking, onClose, onSent }) {
  const [form, setForm] = useState(() => ({
    priceTotal: booking.price_estimated ?? "",
    durationHours: "2",
    offerDate: booking.preferred_date || "",
    offerSlot: booking.preferred_slot || "nachmittags",
    notes: "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function send() {
    if (!form.priceTotal || !form.offerDate || !form.durationHours) {
      setError("Preis, Datum und Dauer werden gebraucht.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await studioApi.post(`/studios/me/bookings/${booking.id}/offer`, {
        priceTotal: Number(form.priceTotal),
        durationMinutes: Math.round(Number(form.durationHours) * 60),
        offerDate: form.offerDate,
        offerSlot: form.offerSlot,
        notes: form.notes || undefined,
      });
      onSent(booking.id, data);
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
          <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 mb-4">
            <Tag size={12} className="text-violet-500 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-700 font-inter">
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

          <div>
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Datum *</label>
            <Input type="date" value={form.offerDate} onChange={(e) => set("offerDate", e.target.value)} className="rounded-xl h-10" />
          </div>

          <div>
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1.5 block">Tageszeit *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DAY_SLOTS.map((s) => (
                <motion.button
                  key={s.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => set("offerSlot", s.value)}
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
          Die genaue Uhrzeit legst du später fest, indem du den Termin im Kalender platzierst — das geht, sobald der Kunde zugesagt hat.
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
