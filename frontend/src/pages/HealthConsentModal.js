import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X, Check } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { DEFAULT_HEALTH_QUESTIONS, RISK_ACKNOWLEDGEMENT_TEXT, DSGVO_ACKNOWLEDGEMENT_TEXT } from "../lib/healthConsent";
import SignatureField from "../components/SignatureField";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

/**
 * Shown before an offer with a required health declaration can be accepted
 * (see offers.ts respond — it refuses with code "consent_required" until
 * one is on file for the project). Submits on its own, then the caller
 * retries the accept call.
 */
export default function HealthConsentModal({ slug, projectId, studio, onClose, onSubmitted }) {
  const questions = studio?.settings?.healthConsentQuestions?.length ? studio.settings.healthConsentQuestions : DEFAULT_HEALTH_QUESTIONS;
  const [answers, setAnswers] = useState(() => questions.map((question) => ({ question, answer: null, detail: "" })));
  const [notes, setNotes] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [dsgvoAcknowledged, setDsgvoAcknowledged] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState({ dataUrl: null, mode: "typed" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setAnswer(index, answer) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, answer } : a)));
  }
  function setDetail(index, detail) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, detail } : a)));
  }

  const allAnswered = answers.every((a) => a.answer !== null);
  const canSubmit = allAnswered && riskAcknowledged && dsgvoAcknowledged && signerName.trim() && signature.dataUrl && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await studioApi.post(`/t/${slug}/projects/${projectId}/health-consent`, {
        answers: answers.map((a) => ({ question: a.question, answer: a.answer, detail: a.answer ? a.detail || undefined : undefined })),
        notes: notes || undefined,
        riskAcknowledged: true,
        dsgvoAcknowledged: true,
        signerName: signerName.trim(),
        signatureDataUrl: signature.dataUrl,
        signatureMode: signature.mode,
      });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || "Konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
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
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[88vh] overflow-y-auto"
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-playfair text-xl text-zinc-900">Gesundheits-Einverständnis</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs font-inter text-zinc-500 mb-5">
          Bitte beantworte die folgenden Fragen wahrheitsgemäß, bevor du das Angebot annimmst — das Studio braucht sie, um die Tätowierung sicher durchzuführen.
        </p>

        <div className="space-y-3 mb-5">
          {answers.map((a, i) => (
            <div key={i} className="rounded-xl border border-zinc-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-inter text-zinc-800 flex-1">{a.question}</p>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setAnswer(i, false)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-inter transition-colors ${
                      a.answer === false ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-500 hover:border-zinc-400"
                    }`}
                  >
                    Nein
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(i, true)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-inter transition-colors ${
                      a.answer === true ? "bg-amber-600 text-white" : "border border-zinc-200 text-zinc-500 hover:border-zinc-400"
                    }`}
                  >
                    Ja
                  </button>
                </div>
              </div>
              {a.answer === true && (
                <input
                  type="text"
                  value={a.detail}
                  onChange={(e) => setDetail(i, e.target.value)}
                  placeholder="Details (optional)"
                  className="w-full h-8 px-2.5 mt-2 rounded-lg border border-zinc-200 text-xs font-inter focus:outline-none focus:border-zinc-400"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="text-xs font-inter text-zinc-500 mb-1.5 block">Sonstige Angaben (optional)</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl min-h-[60px] text-xs" />
        </div>

        <div className="space-y-2.5 mb-5">
          <button type="button" onClick={() => setRiskAcknowledged((v) => !v)} className="flex items-start gap-2.5 text-left w-full">
            <span className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border ${riskAcknowledged ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"}`}>
              {riskAcknowledged && <Check size={11} className="text-white" />}
            </span>
            <span className="text-[11px] font-inter text-zinc-600 leading-relaxed">{RISK_ACKNOWLEDGEMENT_TEXT}</span>
          </button>
          <button type="button" onClick={() => setDsgvoAcknowledged((v) => !v)} className="flex items-start gap-2.5 text-left w-full">
            <span className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border ${dsgvoAcknowledged ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"}`}>
              {dsgvoAcknowledged && <Check size={11} className="text-white" />}
            </span>
            <span className="text-[11px] font-inter text-zinc-600 leading-relaxed">{DSGVO_ACKNOWLEDGEMENT_TEXT}</span>
          </button>
        </div>

        <div className="mb-2">
          <label className="text-xs font-inter text-zinc-500 mb-1.5 block">Ihr vollständiger Name</label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-inter focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="mb-5">
          <label className="text-xs font-inter text-zinc-500 mb-1.5 block">Unterschrift</label>
          <SignatureField onChange={(dataUrl, mode) => setSignature({ dataUrl, mode })} />
        </div>

        {error && <p className="text-xs font-inter text-red-600 mb-3">{error}</p>}

        <Button onClick={submit} disabled={!canSubmit} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-sm">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Einverständnis senden & Angebot annehmen"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
