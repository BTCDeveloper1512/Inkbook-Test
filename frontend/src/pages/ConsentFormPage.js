import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, X, PenLine } from "lucide-react";
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

  // Typed cursive signature (replaces freehand canvas)
  const [signatureName, setSignatureName] = useState("");
  const hasSignature = signatureName.trim().length > 0;

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

  // Generate signature image from typed name (cursive-style canvas render)
  const buildSignatureDataUrl = useCallback(() => {
    const name = signatureName.trim();
    if (!name) return "";
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 52px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "#18181b";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 16, 64);
    // Underline
    const metrics = ctx.measureText(name);
    ctx.beginPath();
    ctx.moveTo(16, 92);
    ctx.lineTo(Math.min(16 + metrics.width, canvas.width - 16), 92);
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return canvas.toDataURL("image/png");
  }, [signatureName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Bitte gib deinen vollständigen Namen ein."); return; }
    const allHealthAnswered = HEALTH_QUESTIONS.every(q => healthAnswers[q.key] !== null);
    if (!allHealthAnswered) { setError("Bitte beantworte alle Gesundheitsfragen mit Ja oder Nein."); return; }
    const allCustomAnswered = customQuestions.every((_, i) => customAnswers[i] !== null);
    if (!allCustomAnswered) { setError("Bitte beantworte alle Zusatzfragen des Studios."); return; }
    if (!hasSignature) { setError("Bitte gib deinen Namen im Unterschriftenfeld ein."); return; }
    if (!agreesTerms || !agreesAftercare || !agreesDsgvo) { setError("Bitte bestätige alle Pflichtfelder einschließlich der DSGVO-Zustimmung."); return; }

    // Build signature image from typed cursive name
    const signatureData = buildSignatureDataUrl();

    // Generate PDF with jsPDF
    let pdfDataUrl = "";
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 15; // margin
      const now = new Date();
      const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

      // ── Header bar ──
      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, W, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.text("StudioOS", M, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 185);
      doc.text("Digitale Einverständniserklärung", M, 22);
      doc.text(dateStr, W - M, 22, { align: "right" });

      doc.setTextColor(24, 24, 27);
      let y = 42;

      // ── Title + booking ref ──
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("Einverständniserklärung", M, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 113, 122);
      const bookingRef = `Buchungs-ID: ${bookingId}` + (booking?.studio_name ? `   ·   Studio: ${booking.studio_name}` : "");
      doc.text(bookingRef, M, y);
      y += 3;
      doc.setDrawColor(230, 230, 233);
      doc.setLineWidth(0.4);
      doc.line(M, y, W - M, y);
      y += 8;

      // ── Helper: section header ──
      const sectionHeader = (title) => {
        doc.setFillColor(245, 245, 247);
        doc.roundedRect(M, y - 1, W - M * 2, 7, 1, 1, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(24, 24, 27);
        doc.text(title.toUpperCase(), M + 3, y + 4);
        y += 11;
      };

      // ── Persönliche Angaben ──
      sectionHeader("Persönliche Angaben");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(24, 24, 27);
      doc.text("Name:", M + 3, y);
      doc.setFont("helvetica", "bold");
      doc.text(fullName.trim(), M + 25, y);
      y += 10;

      // ── Gesundheitserklärung ──
      sectionHeader("Gesundheitserklärung");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const QUESTION_LABELS = {
        no_blood_disorders: "Keine Blutgerinnungsstörungen / Blutverdünner",
        no_skin_conditions: "Keine aktiven Hauterkrankungen an der Tätowierungsstelle",
        no_pregnancy: "Nicht schwanger / nicht stillend",
        no_medications: "Keine wundheilungshemmenden Medikamente",
        no_known_allergies: "Keine Allergien gegen Tinten, Latex oder Desinfektionsmittel",
        no_infectious_diseases: "Keine übertragbaren Infektionskrankheiten",
      };
      HEALTH_QUESTIONS.forEach(({ key }, idx) => {
        const ans = healthAnswers[key];
        const isJa = ans === "ja";
        const isNein = ans === "nein";
        const bgFill = isJa ? [240, 253, 244] : isNein ? [254, 242, 242] : [248, 248, 249];
        doc.setFillColor(...bgFill);
        doc.roundedRect(M, y - 1, W - M * 2, 6.5, 1, 1, "F");
        // Status dot
        doc.setFillColor(isJa ? 22 : isNein ? 220 : 180, isJa ? 163 : isNein ? 38 : 180, isJa ? 74 : isNein ? 38 : 185);
        doc.circle(M + 5, y + 2.2, 1.5, "F");
        doc.setTextColor(isJa ? 21 : isNein ? 185 : 80, isJa ? 128 : isNein ? 28 : 80, isJa ? 61 : isNein ? 28 : 85);
        doc.setFont("helvetica", "bold");
        doc.text(isJa ? "JA" : isNein ? "NEIN" : "–", M + 9, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 45);
        const label = QUESTION_LABELS[key] || key;
        const lines = doc.splitTextToSize(label, W - M * 2 - 30);
        doc.text(lines, M + 25, y + 4);
        y += lines.length * 5 + 2.5;
        if (idx < HEALTH_QUESTIONS.length - 1) y += 0.5;
      });
      y += 3;

      if (allergyNotes.trim()) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(24, 24, 27);
        doc.text("Allergien / Unverträglichkeiten:", M + 3, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 90);
        const allergyLines = doc.splitTextToSize(allergyNotes.trim(), W - M * 2 - 6);
        doc.text(allergyLines, M + 3, y);
        y += allergyLines.length * 5 + 4;
      }
      if (medicationNotes.trim()) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(24, 24, 27);
        doc.text("Medikamente:", M + 3, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 90);
        const medLines = doc.splitTextToSize(medicationNotes.trim(), W - M * 2 - 6);
        doc.text(medLines, M + 3, y);
        y += medLines.length * 5 + 4;
      }

      if (customQuestions.length > 0) {
        sectionHeader("Studio-Zusatzfragen");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        customQuestions.forEach((q, idx) => {
          const val = customAnswers[idx] === "ja";
          doc.setFillColor(val ? 240 : 254, val ? 253 : 242, val ? 244 : 242);
          doc.roundedRect(M, y - 1, W - M * 2, 6.5, 1, 1, "F");
          doc.setFillColor(val ? 22 : 220, val ? 163 : 38, val ? 74 : 38);
          doc.circle(M + 5, y + 2.2, 1.5, "F");
          doc.setTextColor(val ? 21 : 185, val ? 128 : 28, val ? 61 : 28);
          doc.setFont("helvetica", "bold");
          doc.text(val ? "JA" : "NEIN", M + 9, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 45);
          const lines = doc.splitTextToSize(q, W - M * 2 - 30);
          doc.text(lines, M + 25, y + 4);
          y += lines.length * 5 + 3;
        });
        y += 3;
      }

      // ── Bestätigungen ──
      sectionHeader("Bestätigungen");
      doc.setFontSize(9);
      const confirmations = [
        "Volljährigkeit / Einwilligung in die Tätowierung",
        "Pflegehinweise erhalten und verstanden",
        "DSGVO-Zustimmung gemäß Art. 9 Abs. 2 lit. a",
      ];
      confirmations.forEach((c) => {
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(M, y - 1, W - M * 2, 6.5, 1, 1, "F");
        doc.setFillColor(22, 163, 74);
        doc.circle(M + 5, y + 2.2, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(21, 128, 61);
        doc.text("✓", M + 9, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 45);
        doc.text(c, M + 17, y + 4);
        y += 8;
      });
      y += 4;

      // ── Unterschrift ──
      sectionHeader("Unterschrift");
      if (signatureData) {
        try {
          doc.setFillColor(252, 252, 252);
          doc.setDrawColor(220, 220, 225);
          doc.setLineWidth(0.3);
          doc.roundedRect(M, y, W - M * 2, 30, 2, 2, "FD");
          doc.addImage(signatureData, "PNG", M + 3, y + 2, 90, 26);
          y += 34;
        } catch (_) { y += 10; }
      }

      // Footer
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.3);
      doc.line(M, H - 16, W - M, H - 16);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 155);
      doc.text(`${fullName.trim()}   ·   ${dateStr}   ·   Buchung: ${bookingId}`, M, H - 10);
      doc.text("Erstellt mit StudioOS", W - M, H - 10, { align: "right" });

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
            <div className="mb-4">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900">Unterschrift *</h3>
              <p className="text-xs font-inter text-zinc-400 mt-0.5">Gib deinen vollständigen Namen ein — er wird als Unterschrift übernommen</p>
            </div>
            {/* Name input */}
            <input
              type="text"
              value={signatureName}
              onChange={e => setSignatureName(e.target.value)}
              placeholder="Vollständiger Name"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
            />
            {/* Cursive preview */}
            <div className={`mt-3 rounded-xl border-2 transition-all overflow-hidden flex items-center px-5 ${
              hasSignature ? "border-zinc-800 bg-white" : "border-dashed border-zinc-200 bg-zinc-50"
            }`} style={{ minHeight: 72 }}>
              {hasSignature ? (
                <span style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "2rem",
                  color: "#18181b",
                  letterSpacing: "0.01em",
                  lineHeight: 1.1,
                  borderBottom: "1.5px solid #18181b",
                  paddingBottom: "2px",
                }}>
                  {signatureName.trim()}
                </span>
              ) : (
                <span className="text-xs font-inter text-zinc-300 mx-auto select-none flex items-center gap-1.5">
                  <PenLine size={14} strokeWidth={1.5} /> Vorschau der Unterschrift erscheint hier
                </span>
              )}
            </div>
            {hasSignature && (
              <p className="text-xs text-emerald-600 font-inter font-medium mt-2 flex items-center gap-1">
                <CheckCircle size={12} strokeWidth={2} /> Unterschrift bereit
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
