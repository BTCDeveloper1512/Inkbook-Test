import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, X, PenLine, RotateCcw } from "lucide-react";
import { notify } from "../components/InkNotify";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HEALTH_QUESTIONS = [
  { key: "no_blood_disorders",      label: "Ich habe keine Blutgerinnungsstörungen oder nehme keine Blutverdünner." },
  { key: "no_skin_conditions",      label: "Ich habe keine aktiven Hauterkrankungen an der zu tätowierenden Stelle (z. B. Psoriasis, Ekzem)." },
  { key: "no_pregnancy",            label: "Ich bin nicht schwanger und stille nicht." },
  { key: "no_medications",          label: "Ich nehme keine Medikamente ein, die die Wundheilung beeinflussen könnten (falls doch, habe ich dies unten angegeben)." },
  { key: "no_known_allergies",      label: "Ich habe keine bekannten Allergien gegen Tattoo-Tinten, Latex oder Desinfektionsmittel (falls doch, habe ich dies unten angegeben)." },
  { key: "no_infectious_diseases",  label: "Ich leide nicht an übertragbaren Infektionskrankheiten (z. B. Hepatitis, HIV)." },
];

export default function ConsentFormPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [customAnswers, setCustomAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(user?.name || "");
  // null = not yet answered, "ja" = confirmed, "nein" = denied
  const [healthAnswers, setHealthAnswers] = useState(
    Object.fromEntries(HEALTH_QUESTIONS.map(q => [q.key, null]))
  );
  const [allergyNotes, setAllergyNotes] = useState("");
  const [medicationNotes, setMedicationNotes] = useState("");
  const [agreesTerms, setAgreesTerms] = useState(false);
  const [agreesAftercare, setAgreesAftercare] = useState(false);
  const [agreesDsgvo, setAgreesDsgvo] = useState(false);

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef(null);

  // Fetch booking info + check if already submitted
  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          axios.get(`${API}/bookings/${bookingId}`, { withCredentials: true }),
          axios.get(`${API}/bookings/${bookingId}/consent`, { withCredentials: true }),
        ]);
        setBooking(bRes.data);
        if (cRes.data?.status === "submitted") setAlreadySubmitted(true);
        const cqs = cRes.data?.consent_config?.custom_questions || [];
        setCustomQuestions(cqs);
        setCustomAnswers(Object.fromEntries(cqs.map((_, i) => [i, null])));
      } catch (e) {
        setError("Buchung nicht gefunden oder kein Zugriff.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  // Pre-fill name
  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name);
  }, [user]);

  // Canvas setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Bitte gib deinen vollständigen Namen ein."); return; }
    const allHealthAnswered = HEALTH_QUESTIONS.every(q => healthAnswers[q.key] !== null);
    if (!allHealthAnswered) { setError("Bitte beantworte alle Gesundheitsfragen mit Ja oder Nein."); return; }
    const allCustomAnswered = customQuestions.every((_, i) => customAnswers[i] !== null);
    if (!allCustomAnswered) { setError("Bitte beantworte alle Zusatzfragen des Studios."); return; }
    if (!hasSignature) { setError("Bitte unterschreibe das Formular im Unterschriftenfeld."); return; }
    if (!agreesTerms || !agreesAftercare || !agreesDsgvo) { setError("Bitte bestätige alle Pflichtfelder einschließlich der DSGVO-Zustimmung."); return; }

    // Get signature as data URL
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL("image/png");

    // Generate PDF with jsPDF
    let pdfDataUrl = "";
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const now = new Date();
      const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("StudioOS", 15, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Digitale Einverständniserklärung", 15, 20);
      doc.text(dateStr, W - 15, 20, { align: "right" });

      doc.setTextColor(24, 24, 27);
      let y = 40;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Einverständniserklärung", 15, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 113, 122);
      const bookingRef = `Buchung: ${bookingId}` + (booking?.studio_name ? ` · ${booking.studio_name}` : "");
      doc.text(bookingRef, 15, y);
      y += 12;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.text("Persönliche Angaben", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${fullName.trim()}`, 15, y);
      y += 12;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Gesundheitserklärung", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const QUESTION_LABELS = {
        no_blood_disorders: "Keine Blutgerinnungsstörungen / Blutverdünner",
        no_skin_conditions: "Keine aktiven Hauterkrankungen",
        no_pregnancy: "Nicht schwanger / stillend",
        no_medications: "Keine wundheilungshemmenden Medikamente",
        no_known_allergies: "Keine bekannten Allergien gegen Tattoo-Tinten, Latex oder Desinfektionsmittel",
        no_infectious_diseases: "Keine übertragbaren Infektionskrankheiten",
      };
      HEALTH_QUESTIONS.forEach(({ key }) => {
        const ans = healthAnswers[key];
        const jaColor = [22, 163, 74];
        const neinColor = [220, 38, 38];
        const neutral = [113, 113, 122];
        doc.setTextColor(...(ans === "ja" ? jaColor : ans === "nein" ? neinColor : neutral));
        const label = QUESTION_LABELS[key] || key;
        const ansLabel = ans === "ja" ? "Ja" : ans === "nein" ? "Nein" : "–";
        const lines = doc.splitTextToSize(`${ansLabel}: ${label}`, W - 30);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 1;
      });
      y += 2;

      doc.setTextColor(24, 24, 27);
      if (allergyNotes.trim()) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Allergie-Hinweise:", 15, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const allergyLines = doc.splitTextToSize(allergyNotes.trim(), W - 30);
        doc.text(allergyLines, 15, y);
        y += allergyLines.length * 5 + 4;
      }
      if (medicationNotes.trim()) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Medikamenten-Hinweise:", 15, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const medLines = doc.splitTextToSize(medicationNotes.trim(), W - 30);
        doc.text(medLines, 15, y);
        y += medLines.length * 5 + 4;
      }

      doc.setFontSize(9);
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.text("✓ Volljährigkeit / Einwilligung bestätigt", 15, y);
      y += 5;
      doc.text("✓ Pflegehinweise bestätigt", 15, y);
      y += 5;
      doc.text("✓ DSGVO-Zustimmung erteilt", 15, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.text("Unterschrift", 15, y);
      y += 6;
      try {
        doc.addImage(signatureData, "PNG", 15, y, 80, 35);
        y += 40;
      } catch (_) {}

      if (customQuestions.length > 0) {
        y += 4;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(24, 24, 27);
        doc.text("Studio-Zusatzfragen", 15, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        customQuestions.forEach((q, idx) => {
          const val = customAnswers[idx];
          doc.setTextColor(val ? 22 : 220, val ? 163 : 38, val ? 74 : 38);
          const lines = doc.splitTextToSize(`${val ? "✓" : "✗"} ${q}`, W - 30);
          doc.text(lines, 15, y);
          y += lines.length * 5 + 2;
        });
        y += 2;
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 113, 122);
      doc.text(`${fullName.trim()} · ${dateStr}`, 15, y);

      pdfDataUrl = doc.output("datauristring");
    } catch (pdfErr) {
      console.warn("PDF generation failed (non-critical):", pdfErr);
    }

    setSubmitting(true);
    try {
      // Convert "ja"/"nein" answers to booleans for backend (backend fields are named "no_X" so "ja" = true = confirms no condition)
      const healthBooleans = Object.fromEntries(
        HEALTH_QUESTIONS.map(q => [q.key, healthAnswers[q.key] === "ja"])
      );
      // Convert custom answers similarly
      const customBooleans = Object.fromEntries(
        Object.entries(customAnswers).map(([k, v]) => [k, v === "ja"])
      );
      await axios.post(`${API}/bookings/${bookingId}/consent`, {
        full_name: fullName.trim(),
        ...healthBooleans,
        allergy_notes: allergyNotes,
        medication_notes: medicationNotes,
        agrees_to_terms: agreesTerms,
        agrees_to_aftercare: agreesAftercare,
        agrees_to_dsgvo: agreesDsgvo,
        signature_data: signatureData,
        pdf_data: pdfDataUrl,
        custom_answers: customBooleans,
      }, { withCredentials: true });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Einreichen. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
              className="w-2 h-2 rounded-full bg-zinc-400"
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (error && !booking) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-red-500" strokeWidth={1.5} />
        </div>
        <h2 className="font-playfair text-2xl text-zinc-900 mb-2">Kein Zugriff</h2>
        <p className="text-zinc-500 font-inter text-sm mb-6">{error}</p>
        <button onClick={() => navigate("/dashboard")}
          className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-full hover:bg-zinc-800 transition-colors">
          Zum Dashboard
        </button>
      </div>
    </div>
  );

  if (submitted || alreadySubmitted) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-emerald-600" strokeWidth={1.5} />
        </motion.div>
        <h2 className="font-playfair text-2xl text-zinc-900 mb-2">
          {alreadySubmitted && !submitted ? "Bereits eingereicht" : "Einverständniserklärung eingereicht!"}
        </h2>
        <p className="text-zinc-500 font-inter text-sm mb-8">
          {alreadySubmitted && !submitted
            ? "Du hast die Einverständniserklärung für diesen Termin bereits ausgefüllt."
            : "Vielen Dank! Das Studio wurde benachrichtigt. Du erhältst eine Bestätigungs-E-Mail."}
        </p>
        <button onClick={() => navigate("/dashboard")}
          className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-full hover:bg-zinc-800 transition-colors">
          Zurück zum Dashboard
        </button>
      </div>
    </div>
  );

  const dateLabel = booking?.offer_date || booking?.date;
  const studioName = booking?.studio_name;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <PenLine size={15} className="text-white" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-inter font-semibold tracking-[0.18em] uppercase text-zinc-400">Einverständniserklärung</p>
          </div>
          <h1 className="font-playfair font-bold text-3xl text-zinc-900 mb-1">Gesundheitsformular</h1>
          {studioName && (
            <p className="text-zinc-500 font-inter text-sm">
              {studioName}{dateLabel ? ` · Termin am ${new Date(dateLabel + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}` : ""}
            </p>
          )}
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full name */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-4">Persönliche Angaben</h3>
            <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">
              Vollständiger Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Vor- und Nachname"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
            />
          </motion.div>

          {/* Health questions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-1">Gesundheitserklärung</h3>
            <p className="text-xs font-inter text-zinc-400 mb-5">Bitte beantworte jede Frage wahrheitsgemäß mit <strong>Ja</strong> oder <strong>Nein</strong>.</p>
            <div className="space-y-3">
              {HEALTH_QUESTIONS.map((q) => {
                const ans = healthAnswers[q.key];
                return (
                  <div key={q.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      ans === "ja" ? "bg-emerald-50 border-emerald-200"
                      : ans === "nein" ? "bg-red-50 border-red-200"
                      : "bg-zinc-50 border-zinc-200"
                    }`}>
                    <p className={`text-sm font-inter leading-relaxed mb-2.5 ${
                      ans === "ja" ? "text-emerald-800" : ans === "nein" ? "text-red-800" : "text-zinc-700"
                    }`}>{q.label}</p>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setHealthAnswers(prev => ({ ...prev, [q.key]: "ja" }))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-inter font-semibold border transition-all ${
                          ans === "ja"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-zinc-300 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
                        }`}>
                        {ans === "ja" && <CheckCircle size={10} strokeWidth={2.5} />} Ja
                      </button>
                      <button type="button"
                        onClick={() => setHealthAnswers(prev => ({ ...prev, [q.key]: "nein" }))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-inter font-semibold border transition-all ${
                          ans === "nein"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-white border-zinc-300 text-zinc-600 hover:border-red-300 hover:text-red-600"
                        }`}>
                        {ans === "nein" && <X size={10} strokeWidth={2.5} />} Nein
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional notes */}
            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Allergien / Unverträglichkeiten (optional)
                </label>
                <textarea
                  value={allergyNotes}
                  onChange={e => setAllergyNotes(e.target.value)}
                  rows={2}
                  placeholder="Falls du Allergien oder Unverträglichkeiten hast, beschreibe sie hier..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Aktuelle Medikamente (optional)
                </label>
                <textarea
                  value={medicationNotes}
                  onChange={e => setMedicationNotes(e.target.value)}
                  rows={2}
                  placeholder="Falls du Medikamente nimmst, liste sie hier auf..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Studio custom questions */}
          {customQuestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13, duration: 0.35 }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-1">Studio-Zusatzfragen</h3>
              <p className="text-xs font-inter text-zinc-400 mb-5">Diese Fragen wurden vom Studio hinzugefügt. Bitte beantworte jede mit <strong>Ja</strong> oder <strong>Nein</strong>.</p>
              <div className="space-y-3">
                {customQuestions.map((q, idx) => {
                  const ans = customAnswers[idx];
                  return (
                    <div key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        ans === "ja" ? "bg-emerald-50 border-emerald-200"
                        : ans === "nein" ? "bg-red-50 border-red-200"
                        : "bg-zinc-50 border-zinc-200"
                      }`}>
                      <p className={`text-sm font-inter leading-relaxed mb-2.5 ${
                        ans === "ja" ? "text-emerald-800" : ans === "nein" ? "text-red-800" : "text-zinc-700"
                      }`}>{q}</p>
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => setCustomAnswers(prev => ({ ...prev, [idx]: "ja" }))}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-inter font-semibold border transition-all ${
                            ans === "ja"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-zinc-300 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
                          }`}>
                          {ans === "ja" && <CheckCircle size={10} strokeWidth={2.5} />} Ja
                        </button>
                        <button type="button"
                          onClick={() => setCustomAnswers(prev => ({ ...prev, [idx]: "nein" }))}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-inter font-semibold border transition-all ${
                            ans === "nein"
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-white border-zinc-300 text-zinc-600 hover:border-red-300 hover:text-red-600"
                          }`}>
                          {ans === "nein" && <X size={10} strokeWidth={2.5} />} Nein
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Agreements */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-4">Erklärungen</h3>
            <div className="space-y-3">
              {[
                {
                  key: "terms",
                  val: agreesTerms,
                  set: setAgreesTerms,
                  label: "Ich bin über 18 Jahre alt (oder habe die Zustimmung meines gesetzlichen Vormunds), habe alle obigen Aussagen wahrheitsgemäß beantwortet und willige in die Tätowierung ein."
                },
                {
                  key: "aftercare",
                  val: agreesAftercare,
                  set: setAgreesAftercare,
                  label: "Ich habe die Pflegehinweise erhalten und werde das Tattoo gemäß den Anweisungen des Studios pflegen. Ich nehme zur Kenntnis, dass das Studio für Komplikationen, die durch mangelnde Pflege entstehen, nicht haftet."
                },
                {
                  key: "dsgvo",
                  val: agreesDsgvo,
                  set: setAgreesDsgvo,
                  label: "Ich stimme der Verarbeitung meiner personenbezogenen Daten und Gesundheitsdaten im Rahmen dieser Einverständniserklärung gemäß DSGVO Art. 9 Abs. 2 lit. a zu. Die Daten werden ausschließlich zur Dokumentation und Absicherung des Tätowierungsvorgangs verwendet und nicht an Dritte weitergegeben."
                }
              ].map(item => (
                <label key={item.key}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                    item.val ? "bg-zinc-900 border-zinc-900" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                  }`}>
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all ${
                      item.val ? "bg-white border-white" : "border-zinc-300 bg-white"
                    }`}
                    onClick={() => item.set(v => !v)}>
                    {item.val && <CheckCircle size={12} className="text-zinc-900" strokeWidth={2.5} />}
                  </div>
                  <span className={`text-sm font-inter leading-relaxed ${item.val ? "text-white" : "text-zinc-600"}`}>
                    {item.label}
                  </span>
                  <input type="checkbox" className="sr-only"
                    checked={item.val}
                    onChange={e => item.set(e.target.checked)} />
                </label>
              ))}
            </div>
          </motion.div>

          {/* Signature */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Unterschrift *</h3>
                <p className="text-xs font-inter text-zinc-400 mt-0.5">Zeichne deine Unterschrift im Feld unten</p>
              </div>
              {hasSignature && (
                <button type="button" onClick={clearSignature}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-inter text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-all">
                  <RotateCcw size={12} strokeWidth={1.5} /> Löschen
                </button>
              )}
            </div>
            <div className={`relative rounded-xl border-2 transition-colors overflow-hidden ${
              hasSignature ? "border-zinc-900" : "border-dashed border-zinc-300"
            }`} style={{ height: 160 }}>
              {!hasSignature && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <PenLine size={22} className="text-zinc-300 mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-inter text-zinc-300">Hier unterschreiben</p>
                </div>
              )}
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", touchAction: "none", cursor: "crosshair" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            {hasSignature && (
              <p className="text-xs text-emerald-600 font-inter font-medium mt-2 flex items-center gap-1">
                <CheckCircle size={12} strokeWidth={2} /> Unterschrift erfasst
              </p>
            )}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-sm font-inter text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}>
            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-zinc-900 text-white font-inter font-semibold text-sm rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Wird eingereicht…</>
              ) : (
                <><PenLine size={15} strokeWidth={1.5} /> Einverständniserklärung einreichen</>
              )}
            </motion.button>
            <p className="text-xs font-inter text-zinc-400 text-center mt-3">
              Mit dem Einreichen bestätigst du alle obigen Angaben nach bestem Wissen und Gewissen.
            </p>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
