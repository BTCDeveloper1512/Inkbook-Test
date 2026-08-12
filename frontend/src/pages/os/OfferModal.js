import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Tag, Plus, Trash2 } from "lucide-react";
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

export default function OfferModal({ booking, studio, onClose, onSent }) {
  const depositRequired = !!studio?.settings?.depositRequired;
  const depositPercent = Number(studio?.settings?.depositPercent || 0);
  // A project already under way is being offered its *next* sitting, not its
  // first — the customer's original preferred_date/slot described when they
  // wanted session 1 and would just be stale, confusing prefill here.
  const isFollowUp = (booking.sessions?.length || 0) > 0;
  // Only a "project" is ever more than one sitting — single_session and
  // consultation stay a single date/time field, same as always.
  const isProject = booking.appointment_type === "project";

  // One row per extra sitting beyond the one the main form above already
  // describes — so a studio that already knows "this sleeve is three
  // sessions" can lay out the whole plan in one offer instead of sending a
  // follow-up offer after each one gets accepted.
  const [extraSessions, setExtraSessions] = useState([]);
  const addExtraSession = () => setExtraSessions((rows) => [...rows, { date: "", time: "12:00", durationHours: "2" }]);
  const updateExtraSession = (i, key, value) =>
    setExtraSessions((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const removeExtraSession = (i) => setExtraSessions((rows) => rows.filter((_, idx) => idx !== i));

  const [form, setForm] = useState(() => {
    const priceTotal = isFollowUp ? "" : booking.price_estimated ?? "";
    return {
      priceTotal,
      // Pre-filled from the studio's deposit setting, but the studio can
      // still adjust or clear it per offer — a rough estimate isn't always
      // the right basis, and not every offer needs a deposit.
      depositAmount: depositRequired && priceTotal ? Math.round((Number(priceTotal) * depositPercent) / 100) : "",
      durationHours: "2",
      offerDate: isFollowUp ? "" : booking.preferred_date || "",
      offerSlot: isFollowUp ? "nachmittags" : booking.preferred_slot || "nachmittags",
      offerTime: slotDefaultTime(isFollowUp ? null : booking.preferred_slot),
      notes: "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function onPriceChange(value) {
    setForm((f) => {
      // Only auto-follow the deposit while it still matches the percentage
      // of the old price — once the studio has touched it by hand, typing a
      // new price shouldn't silently overwrite their edit. With no old price
      // yet (the common case: a fresh request has no price_estimated), there
      // is nothing to diverge from, so the first entry still auto-fills.
      const autoDeposit =
        depositRequired && (!f.priceTotal || Math.round((Number(f.priceTotal) * depositPercent) / 100) === Number(f.depositAmount || 0));
      const depositAmount = autoDeposit && value ? Math.round((Number(value) * depositPercent) / 100) : f.depositAmount;
      return { ...f, priceTotal: value, depositAmount };
    });
  }

  async function send() {
    if (!form.priceTotal || !form.offerDate || !form.offerTime || !form.durationHours) {
      setError("Preis, Datum, Uhrzeit und Dauer werden gebraucht.");
      return;
    }
    if (extraSessions.some((r) => !r.date || !r.time || !r.durationHours)) {
      setError("Jede weitere Session braucht Datum, Uhrzeit und Dauer — oder entfern sie wieder.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Composed here so the clock time means what was typed, in this browser's
      // zone, rather than being reassembled server-side from date + time.
      const startsAt = new Date(`${form.offerDate}T${form.offerTime}:00`);
      const payload = {
        priceTotal: Number(form.priceTotal),
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
        durationMinutes: Math.round(Number(form.durationHours) * 60),
        offerDate: form.offerDate,
        offerSlot: form.offerSlot,
        offerStartsAt: startsAt.toISOString(),
        notes: form.notes || undefined,
        additionalSessions: isProject
          ? extraSessions.map((r) => ({
              startsAt: new Date(`${r.date}T${r.time}:00`).toISOString(),
              durationMinutes: Math.round(Number(r.durationHours) * 60),
            }))
          : undefined,
      };

      // For someone on the waitlist there is no booking yet — it comes into
      // existence together with the offer, so nothing shows up in the bookings
      // list until the studio has actually offered something.
      if (booking._waitlistEntryId) {
        const { data } = await studioApi.post(`/studios/me/waitlist/${booking._waitlistEntryId}/offer`, payload);
        onSent(null, data.offer, booking._waitlistEntryId, data.project);
        onClose();
        return;
      }

      const { data } = await studioApi.post(`/studios/me/bookings/${booking.id}/offer`, payload);
      onSent(booking.id, data);
      const clashTimes = [data.clash, ...(data.additionalClashes || [])].filter(Boolean).map((c) => new Date(c.startTime).toLocaleString("de-DE"));
      if (clashTimes.length) {
        window.alert(
          `Hinweis: Zu diesen Zeiten steht bereits ein Termin: ${clashTimes.join(", ")}. Das Angebot wurde trotzdem gesendet.`
        );
      }
      onClose();
    } catch (err) {
      // Validation failures come back as a Zod-flatten object; the plan-limit
      // check (and most other server errors) return a plain string instead.
      const apiError = err.response?.data?.error;
      setError((typeof apiError === "string" ? apiError : apiError?.formErrors?.[0]) || "Angebot konnte nicht gesendet werden.");
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
          <h3 className="font-playfair text-xl text-zinc-900">{isFollowUp ? "Weitere Session anbieten" : "Angebot erstellen"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-zinc-500 font-inter mb-4">
          Für <span className="font-semibold text-zinc-800">{booking.customers?.name || "—"}</span>
          {booking.title && <> · <span className="italic">"{booking.title}"</span></>}
          {isFollowUp && <> · Session {booking.sessions.length + 1}</>}
        </p>

        {!isFollowUp && (booking.preferred_date || booking.preferred_time) && (
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
                onChange={(e) => onPriceChange(e.target.value)}
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

          {isProject && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-inter font-semibold text-zinc-500 block">Weitere Sessions in diesem Angebot</label>
                <button
                  type="button"
                  onClick={addExtraSession}
                  className="flex items-center gap-1 text-[11px] font-inter text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <Plus size={12} /> Session hinzufügen
                </button>
              </div>
              {extraSessions.length === 0 ? (
                <p className="text-[11px] font-inter text-zinc-400">
                  Optional — wenn du den Ablauf schon kennst (z. B. "drei Sitzungen"), leg sie direkt mit an.
                </p>
              ) : (
                <div className="space-y-2">
                  {extraSessions.map((row, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border border-zinc-200 p-2">
                      <span className="text-[10px] font-inter text-zinc-400 w-12 flex-shrink-0">Session {i + 2}</span>
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateExtraSession(i, "date", e.target.value)}
                        className="rounded-lg h-9 text-xs"
                      />
                      <Input
                        type="time"
                        value={row.time}
                        onChange={(e) => updateExtraSession(i, "time", e.target.value)}
                        className="rounded-lg h-9 text-xs w-24 flex-shrink-0"
                      />
                      <Input
                        type="number"
                        min="0.5"
                        max="16"
                        step="0.5"
                        value={row.durationHours}
                        onChange={(e) => updateExtraSession(i, "durationHours", e.target.value)}
                        className="rounded-lg h-9 text-xs w-16 flex-shrink-0"
                        title="Dauer in Stunden"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraSession(i)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Anzahlung (€)</label>
            <Input
              type="number"
              min="0"
              step="5"
              placeholder="0"
              value={form.depositAmount}
              onChange={(e) => set("depositAmount", e.target.value)}
              className="rounded-xl h-10"
            />
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
          {Number(form.depositAmount) > 0
            ? "Sagt der Kunde zu, muss er erst die Anzahlung bezahlen — der/die Termin(e) stehen in deinem Kalender erst danach fix."
            : extraSessions.length > 0
              ? `Sagt der Kunde zu, stehen alle ${extraSessions.length + 1} Termine sofort in deinem Kalender. Verschieben kannst du sie danach jederzeit per Drag.`
              : "Sagt der Kunde zu, steht der Termin sofort mit dieser Uhrzeit in deinem Kalender. Verschieben kannst du ihn danach jederzeit per Drag."}
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
