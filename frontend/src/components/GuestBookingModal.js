import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, CheckCircle, Send, User, Mail, ImagePlus, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZES = ["Klein (bis 5 cm)", "Mittel (5–15 cm)", "Groß (15–25 cm)", "XL (25 cm+)", "Ganzkörper"];
const BODY_PARTS = ["Arm", "Unterarm", "Oberarm", "Rücken", "Brust", "Bein", "Oberschenkel", "Wade", "Schulter", "Hals", "Hand", "Fuß", "Rippen", "Bauch", "Anderes"];
const TIME_PREFS = ["Keine Präferenz", "Früh (08:00–10:00)", "Vormittags (10:00–12:00)", "Mittags (12:00–14:00)", "Nachmittags (14:00–17:00)", "Abends (17:00–20:00)"];
const DAY_CAPACITY = 8;

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

function CapacityCalendar({ studioId, artistId, selectedDate, onSelectDate }) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [capacityData, setCapacityData] = useState({});
  const [calVisibleUntil, setCalVisibleUntil] = useState(null);
  const [loading, setLoading] = useState(false);

  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const getCalDays = () => {
    const { year, month } = calMonth;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  useEffect(() => {
    if (!studioId) return;
    setLoading(true);
    const params = { year: calMonth.year, month: calMonth.month + 1 };
    if (artistId) params.artist_id = artistId;
    axios.get(`${API}/studios/${studioId}/capacity-calendar`, { params })
      .then(({ data }) => {
        setCapacityData(data.dates || {});
        setCalVisibleUntil(data.slots_visible_until || null);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [studioId, artistId, calMonth]);

  const prevMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthLabel = new Date(calMonth.year, calMonth.month, 1)
    .toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const calDays = getCalDays();
  const isPrevDisabled = calMonth.year === today.getFullYear() && calMonth.month === today.getMonth();

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} disabled={isPrevDisabled}
          className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        <span className="text-xs font-inter font-semibold text-zinc-700 capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 transition-colors">
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
          <div key={d} className="text-center text-[10px] font-inter font-semibold text-zinc-400 py-0.5">{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-28">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {calDays.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const iso = toISO(day);
            const isPast = iso < todayISO;
            const isToday = iso === todayISO;
            const isSel = iso === selectedDate;
            const capDay = capacityData[iso];
            const remaining = capDay ? capDay.remaining : (isPast ? 0 : DAY_CAPACITY);
            const isVacation = !isPast && capDay && capDay.status === "vacation";
            const isNotAvailYet = !isPast && calVisibleUntil && iso > calVisibleUntil;
            const canFit = !isPast && !isVacation && !isNotAvailYet && remaining > 0;

            const dotColor = isSel ? "bg-white/70"
              : isVacation ? "bg-violet-400"
              : isNotAvailYet ? "bg-zinc-300"
              : !canFit ? "bg-rose-400"
              : remaining >= 5 ? "bg-teal-400"
              : remaining >= 3 ? "bg-yellow-400"
              : "bg-indigo-400";

            const btnCls = [
              "relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-inter font-medium transition-all",
              isPast || !canFit || isVacation || isNotAvailYet ? "text-zinc-300 cursor-not-allowed" : "hover:bg-zinc-200 text-zinc-700",
              isVacation ? "bg-violet-50" : "",
              isNotAvailYet ? "bg-zinc-100 border border-dashed border-zinc-200" : "",
              isSel ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" : "",
              isToday && !isSel ? "ring-2 ring-zinc-800 ring-offset-1 font-bold text-zinc-900" : "",
            ].filter(Boolean).join(" ");

            return (
              <button key={iso} type="button"
                disabled={isPast || !canFit || isVacation || isNotAvailYet}
                onClick={() => onSelectDate(isSel ? null : iso)}
                className={btnCls}
                title={isVacation ? "Urlaub / geschlossen" : isNotAvailYet ? "Noch nicht buchbar" : capDay?.note || undefined}
              >
                <span>{day.getDate()}</span>
                {!isPast && !isNotAvailYet && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotColor}`} />
                )}
                {!isPast && isNotAvailYet && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-inter text-zinc-400">bald</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap mt-3 pt-2.5 border-t border-zinc-200">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" /><span className="text-[10px] font-inter text-zinc-500">Verfügbar</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" /><span className="text-[10px] font-inter text-zinc-500">Begrenzt</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" /><span className="text-[10px] font-inter text-zinc-500">Fast voll</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" /><span className="text-[10px] font-inter text-zinc-500">Ausgebucht</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" /><span className="text-[10px] font-inter text-zinc-500">Urlaub</span></div>
      </div>
    </div>
  );
}

export default function GuestBookingModal({ studio, onClose }) {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", tattoo_description: "", size: "", body_part: "",
    wished_date_from: "", wished_date_to: "", wished_time: "",
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [refImages, setRefImages] = useState([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [artists, setArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const fileInputRef = useRef(null);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!studio?.studio_id) return;
    axios.get(`${API}/studios/${studio.studio_id}/artists`)
      .then(({ data }) => {
        setArtists(data);
        if (data.length > 1) setSelectedArtistId(data[0].artist_id);
      })
      .catch(() => {});
  }, [studio?.studio_id]);

  const handleSelectDate = (iso) => {
    setSelectedDate(iso);
    update("wished_date_from", iso || "");
    update("wished_date_to", iso || "");
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (refImages.length + files.length > 4) {
      setError("Maximal 4 Referenzbilder erlaubt."); return;
    }
    setUploadingImg(true); setError("");
    try {
      const uploads = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await axios.post(`${API}/inquiries/upload-image`, fd);
        return data.url;
      }));
      setRefImages(prev => [...prev, ...uploads]);
    } catch {
      setError("Bild-Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx) => setRefImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.tattoo_description.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus."); return;
    }
    if (artists.length > 1 && !selectedArtistId) {
      setError("Bitte wähle einen Artist aus."); return;
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
        reference_images: refImages,
        wished_date_from: form.wished_date_from || null,
        wished_date_to: form.wished_date_to || null,
        wished_time: form.wished_time && form.wished_time !== "Keine Präferenz" ? form.wished_time : null,
      });
      if (window.posthog) {
        window.posthog.capture("inquiry_submitted", {
          studio_id: studio.studio_id,
          studio_name: studio.name,
          size: form.size || null,
          body_part: form.body_part || null,
        });
      }
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Senden. Bitte versuche es erneut.");
    } finally { setLoading(false); }
  };

  const multiArtist = artists.length > 1;
  const showCalendar = !multiArtist || !!selectedArtistId;
  const calArtistId = multiArtist ? selectedArtistId : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", zIndex: 9999 }}
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
                {/* Name */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Dein Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                    <input type="text" value={form.name} onChange={e => update("name", e.target.value)}
                      placeholder="Max Mustermann" required className="input-base w-full pl-9"
                      data-testid="guest-name-input" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">E-Mail *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                    <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                      placeholder="deine@email.de" required className="input-base w-full pl-9"
                      data-testid="guest-email-input" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-inter mt-1">Wir senden dir Updates per E-Mail — kein Spam.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Tattoo-Beschreibung *</label>
                  <textarea value={form.tattoo_description} onChange={e => update("tattoo_description", e.target.value)}
                    placeholder="Beschreibe dein Wunsch-Tattoo: Motiv, Stil, Farben, besondere Details..."
                    rows={4} required className="input-base w-full resize-none"
                    data-testid="guest-description-input" />
                </div>

                {/* Size + Body part */}
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

                {/* Artist selector — only when multiple artists */}
                {multiArtist && (
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Artist wählen *</label>
                    <div className="flex flex-col gap-1.5">
                      {artists.map(a => (
                        <button key={a.artist_id} type="button"
                          onClick={() => { setSelectedArtistId(a.artist_id); setSelectedDate(null); handleSelectDate(null); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selectedArtistId === a.artist_id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                        >
                          {a.profile_image ? (
                            <img src={a.profile_image} alt={a.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedArtistId === a.artist_id ? "bg-zinc-700 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                              {(a.name || "?")[0]}
                            </span>
                          )}
                          <div>
                            <p className={`text-xs font-inter font-semibold ${selectedArtistId === a.artist_id ? "text-white" : "text-zinc-800"}`}>{a.name}</p>
                            {a.styles?.length > 0 && (
                              <p className={`text-[10px] font-inter ${selectedArtistId === a.artist_id ? "text-zinc-300" : "text-zinc-400"}`}>{a.styles.slice(0,3).join(" · ")}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacity Calendar */}
                {showCalendar && (
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">
                      Wunschtermin{" "}
                      {multiArtist && selectedArtistId && (
                        <span className="normal-case font-normal tracking-normal text-zinc-400">
                          – {artists.find(a => a.artist_id === selectedArtistId)?.name}
                        </span>
                      )}
                      {" "}<span className="normal-case font-normal">(optional)</span>
                    </label>
                    <CapacityCalendar
                      studioId={studio.studio_id}
                      artistId={calArtistId}
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                    />
                    {selectedDate && (
                      <p className="text-[11px] text-zinc-500 font-inter mt-1.5 text-center">
                        Gewählt: <strong className="text-zinc-800">{new Date(selectedDate + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Time preference */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock size={12} className="text-zinc-400" strokeWidth={1.5} />
                    <label className="text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400">Uhrzeit-Präferenz</label>
                  </div>
                  <select value={form.wished_time} onChange={e => update("wished_time", e.target.value)} className="input-base w-full">
                    {TIME_PREFS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Reference images */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Referenzbilder <span className="normal-case font-normal text-zinc-400">(optional, max. 4)</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={handleImagePick} data-testid="guest-image-input" />
                  {refImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {refImages.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-zinc-200" />
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {refImages.length < 4 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-zinc-300 rounded-xl text-sm font-inter text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 transition-colors disabled:opacity-50 w-full justify-center">
                      <ImagePlus size={14} strokeWidth={1.5} />
                      {uploadingImg ? "Wird hochgeladen…" : "Bild hinzufügen"}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-inter px-3 py-2.5 rounded-xl">{error}</div>
                )}

                <motion.button type="submit" disabled={loading || uploadingImg}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary w-full justify-center gap-2 disabled:opacity-50"
                  data-testid="guest-submit-btn">
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
                  ...(studio.deposit_required
                    ? [{ done: false, n: 3, label: "Bestätigen & zahlen 💳", sub: "Termin buchen & Anzahlung leisten" }]
                    : [{ done: false, n: 3, label: "Termin bestätigen ✓",   sub: "Studio bestätigt deinen Wunschtermin" }]),
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${s.done ? "bg-emerald-500" : "bg-zinc-200"}`}>
                      {s.done ? <CheckCircle size={13} className="text-white" strokeWidth={2.5} /> : <span className="text-[10px] font-bold text-zinc-400">{s.n}</span>}
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
