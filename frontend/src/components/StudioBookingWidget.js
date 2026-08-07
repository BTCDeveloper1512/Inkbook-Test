import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Sparkles, Palette, Scissors } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { DAY_SLOTS } from "../lib/daySlots";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Beratungstermin", desc: "Idee besprechen, unverbindlich", icon: Sparkles },
  { value: "project", label: "Projekt", desc: "Größeres Tattoo, mehrere Sessions", icon: Palette },
  { value: "single_session", label: "Normaler Termin", desc: "Ein Tattoo, ein Termin", icon: Scissors },
];

const LEVEL_DOT = { free: "bg-emerald-400", tight: "bg-amber-400", full: "bg-red-400" };

function MonthCalendar({ selectedDate, onSelectDate, slug, artistId, onLoad }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [load, setLoad] = useState({});

  // Loaded whether or not an artist is picked: how full the studio is that day
  // is worth knowing before you've chosen who does the work.
  useEffect(() => {
    let cancelled = false;
    studioApi
      .get(`/t/${slug}/availability`, {
        params: { year: view.year, month: view.month + 1, ...(artistId ? { artistId } : {}) },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setLoad(data);
        onLoad?.(data);
      })
      .catch(() => {
        if (cancelled) return;
        setLoad({});
        onLoad?.({});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, artistId, view.year, view.month]);

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
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const level = load[iso]?.level;
          return (
            <button
              type="button"
              key={i}
              disabled={isPast(day)}
              onClick={() => onSelectDate(new Date(view.year, view.month, day))}
              className={`relative aspect-square rounded-lg text-xs font-inter transition-colors ${
                isSelected(day)
                  ? "bg-zinc-900 text-white font-semibold"
                  : isPast(day)
                  ? "text-zinc-300 cursor-not-allowed"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {day}
              {level && level !== "closed" && !isSelected(day) && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${LEVEL_DOT[level]}`} />
              )}
            </button>
          );
        })}
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
  const [slot, setSlot] = useState(null);
  const [wishTime, setWishTime] = useState("");
  const [dayLoad, setDayLoad] = useState({});
  const [title, setTitle] = useState("");
  const [motif, setMotif] = useState("");
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleReferenceUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const { data } = await studioApi.post("/upload/reference-image", form);
        setReferenceImages((prev) => [...prev, data.url]);
      }
    } catch {
      // A failed reference-image upload shouldn't block the rest of the booking.
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function removeReferenceImage(url) {
    setReferenceImages((prev) => prev.filter((u) => u !== url));
  }

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Local YYYY-MM-DD — toISOString() would shift the date across midnight for
  // anyone east of UTC, which is everyone using this.
  const preferredDateStr = () => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
        preferredDate: preferredDateStr(),
        preferredSlot: slot,
        preferredTime: wishTime || undefined,
        referenceImages,
      });
      setResult(data);
      setStep(4);
    } catch (err) {
      setAuthError(err.message || err.response?.data?.error || "Etwas ist schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDayLoad = date ? dayLoad[preferredDateStr()] : null;

  // Picking a new day can make the chosen band impossible; drop it rather
  // than letting a request go out for a slot that's already gone.
  useEffect(() => {
    if (slot && selectedDayLoad?.slots?.[slot] && !selectedDayLoad.slots[slot].bookable) setSlot(null);
  }, [selectedDayLoad, slot]);

  const canContinueStep2 = date !== null && slot !== null;
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
            <p className="text-sm text-zinc-500 font-inter mb-5">Tag und Tageszeit auswählen.</p>

            <MonthCalendar selectedDate={date} onSelectDate={setDate} slug={slug} artistId={artistId} onLoad={setDayLoad} />
            <div className="flex items-center gap-3 mt-2 text-[10px] font-inter text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> frei</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> eng</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> ausgebucht</span>
            </div>

            <div className="mt-5">
              <Label className="text-xs font-inter text-zinc-500 mb-2 block">Wann am Tag?</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAY_SLOTS.map(({ value, label, hint }) => {
                  // A band with under an hour left isn't worth offering, so it
                  // is shown as taken rather than letting someone ask for it.
                  const info = selectedDayLoad?.slots?.[value];
                  const voll = info ? !info.bookable : false;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      disabled={voll}
                      whileTap={voll ? undefined : { scale: 0.97 }}
                      onClick={() => setSlot(value)}
                      className={`px-3 py-2.5 rounded-2xl border text-left transition-colors ${
                        voll
                          ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed"
                          : slot === value
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <div className="font-inter text-sm font-medium">{label}</div>
                      <div className={`font-inter text-[10px] ${slot === value ? "text-zinc-300" : voll ? "text-zinc-300" : "text-zinc-400"}`}>
                        {voll ? "ausgebucht" : hint}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-[11px] font-inter text-zinc-400 mt-2">
                Die genaue Uhrzeit legt das Studio fest und schickt sie dir als Angebot.
              </p>
            </div>

            <div className="mt-4">
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Wunschzeit (optional)</Label>
              <Input
                value={wishTime}
                onChange={(e) => setWishTime(e.target.value)}
                placeholder="z.B. eher früh, oder erst nach 16 Uhr"
                className="rounded-xl h-10"
              />
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
                <div>
                  <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Referenzbilder (optional)</Label>
                  {referenceImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {referenceImages.map((url) => (
                        <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                          <img src={url} alt="Referenz" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReferenceImage(url)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                          >
                            Entfernen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-zinc-300 text-xs font-inter text-zinc-500 cursor-pointer hover:border-zinc-400 transition-colors">
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : "Bilder hochladen"}
                    <input type="file" accept="image/*" multiple onChange={handleReferenceUpload} className="hidden" disabled={uploadingImage} />
                  </label>
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
            <p className="text-sm text-zinc-500 font-inter mb-4">
              Das Studio meldet sich bei dir, sobald der Termin bestätigt ist.
            </p>
            <a href={`/t/${slug}/konto`} className="text-xs font-inter text-zinc-500 underline hover:text-zinc-800">
              Alle meine Termine ansehen
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
