import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Sparkles, Palette, Scissors } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Beratungstermin", desc: "Idee besprechen, unverbindlich", icon: Sparkles },
  { value: "project", label: "Projekt", desc: "Größeres Tattoo, mehrere Sessions", icon: Palette },
  { value: "single_session", label: "Normaler Termin", desc: "Ein Tattoo, ein Termin", icon: Scissors },
];

function MonthCalendar({ selectedDate, onSelectDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const first = new Date(view.year, view.month, 1);
  const last = new Date(view.year, view.month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const days = [...Array(startDow).fill(null), ...Array.from({ length: last.getDate() }, (_, i) => i + 1)];

  const monthLabel = first.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const isPast = (day) => new Date(view.year, view.month, day) < today;
  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === view.year &&
    selectedDate.getMonth() === view.month &&
    selectedDate.getDate() === day;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setView((v) => ({ year: v.month === 0 ? v.year - 1 : v.year, month: (v.month + 11) % 12 }))}
          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-inter font-medium text-zinc-800 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setView((v) => ({ year: v.month === 11 ? v.year + 1 : v.year, month: (v.month + 1) % 12 }))}
          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div key={d} className="text-center text-[10px] font-inter text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) =>
          day === null ? (
            <div key={i} />
          ) : (
            <button
              type="button"
              key={i}
              disabled={isPast(day)}
              onClick={() => onSelectDate(new Date(view.year, view.month, day))}
              className={`aspect-square rounded-lg text-xs font-inter transition-colors ${
                isSelected(day)
                  ? "bg-zinc-900 text-white font-semibold"
                  : isPast(day)
                  ? "text-zinc-300 cursor-not-allowed"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  );
}

const STEPS = ["Terminart", "Termin", "Kontakt", "Fertig"];

function ProgressSteps({ active }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-inter font-bold transition-colors ${
                  n <= active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {n < active ? <CheckCircle2 size={11} strokeWidth={2.5} /> : n}
              </div>
              <span className={`text-[11px] font-inter whitespace-nowrap ${n <= active ? "text-zinc-700 font-medium" : "text-zinc-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-zinc-200 min-w-[6px]" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Self-contained booking flow for one studio's public page: appointment
 * type -> date/time -> customer login-or-register -> confirmation. Talks
 * only to the new backend (studioApi), independent of the rest of the
 * app's (still old-backend) auth state.
 */
export default function StudioBookingWidget({ slug, artists }) {
  const [step, setStep] = useState(1);
  const [appointmentType, setAppointmentType] = useState(null);
  const [artistId, setArtistId] = useState("");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [motif, setMotif] = useState("");

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const startTimeIso = () => {
    if (!date) return null;
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };

  async function submitBooking() {
    setSubmitting(true);
    setAuthError("");
    try {
      // Establish (or create) the customer identity for this studio first.
      const authPayload = { email, password, ...(authMode === "register" ? { name } : {}) };
      const authEndpoint = authMode === "register" ? "register" : "login";
      try {
        await studioApi.post(`/t/${slug}/auth/${authEndpoint}`, authPayload);
      } catch (err) {
        if (authMode === "login" && err.response?.status === 401) {
          throw new Error("E-Mail oder Passwort ist falsch.");
        }
        if (authMode === "register" && err.response?.status === 400) {
          throw new Error(err.response.data?.error || "Registrierung fehlgeschlagen.");
        }
        throw err;
      }

      const { data } = await studioApi.post(`/t/${slug}/bookings`, {
        appointmentType,
        artistId: artistId || undefined,
        title: title || undefined,
        motifDescription: motif || undefined,
        startTime: startTimeIso(),
      });
      setResult(data);
      setStep(4);
    } catch (err) {
      setAuthError(err.message || err.response?.data?.error || "Etwas ist schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinueStep2 = date !== null;
  const canSubmitStep3 = email && password && (authMode === "login" || name);

  return (
    <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 max-w-lg w-full">
      <ProgressSteps active={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <h3 className="font-playfair text-xl text-zinc-900 mb-1">Wie darf's sein?</h3>
            <p className="text-sm text-zinc-500 font-inter mb-5">Wähl die passende Terminart.</p>
            <div className="space-y-2.5 mb-6">
              {APPOINTMENT_TYPES.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAppointmentType(value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                    appointmentType === value ? "border-zinc-900 bg-zinc-50 shadow-soft" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${appointmentType === value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-inter font-medium text-sm text-zinc-900">{label}</div>
                    <div className="font-inter text-xs text-zinc-500">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {artists?.length > 0 && (
              <div className="mb-6">
                <Label className="text-xs font-inter text-zinc-500 mb-2 block">Artist (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {artists.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setArtistId(artistId === a.id ? "" : a.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-inter border transition-colors ${
                        artistId === a.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              disabled={!appointmentType}
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
            >
              Weiter
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <h3 className="font-playfair text-xl text-zinc-900 mb-1">Wann passt es dir?</h3>
            <p className="text-sm text-zinc-500 font-inter mb-5">Datum und Uhrzeit auswählen.</p>

            <MonthCalendar selectedDate={date} onSelectDate={setDate} />

            <div className="mt-4">
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Uhrzeit</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl h-10" />
            </div>

            {appointmentType !== "consultation" && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Motiv / Titel</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Drachen-Sleeve" className="rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Beschreibung</Label>
                  <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Erzähl uns kurz von deiner Idee..." className="rounded-xl min-h-[80px]" />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="h-11 rounded-xl font-inter">
                Zurück
              </Button>
              <Button
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
                className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
              >
                Weiter
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <h3 className="font-playfair text-xl text-zinc-900 mb-1">Fast geschafft</h3>
            <p className="text-sm text-zinc-500 font-inter mb-5">
              {authMode === "login" ? "Melde dich an, um die Buchung abzuschließen." : "Leg dir ein Konto bei diesem Studio an."}
            </p>

            <div className="flex gap-1 mb-5 bg-zinc-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${authMode === "login" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
              >
                Ich bin schon Kunde
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${authMode === "register" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
              >
                Neu hier
              </button>
            </div>

            <div className="space-y-3">
              {authMode === "register" && (
                <div>
                  <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" />
                </div>
              )}
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" />
              </div>
            </div>

            {authError && <p className="text-xs text-red-600 font-inter mt-3">{authError}</p>}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="h-11 rounded-xl font-inter">
                Zurück
              </Button>
              <Button
                disabled={!canSubmitStep3 || submitting}
                onClick={submitBooking}
                className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Termin anfragen"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && result && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-white" />
            </div>
            <h3 className="font-playfair text-xl text-zinc-900 mb-1">Anfrage gesendet</h3>
            <p className="text-sm text-zinc-500 font-inter">
              Das Studio meldet sich bei dir, sobald der Termin bestätigt ist.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
