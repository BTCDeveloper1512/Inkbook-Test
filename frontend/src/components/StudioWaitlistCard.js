import React, { useState } from "react";
import { Bell, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/**
 * Compact alternative to the full booking flow: "no slot fits right now,
 * notify me when one opens up." Same login-or-register pattern as
 * StudioBookingWidget, collapsed by default so it doesn't compete with the
 * primary booking widget for attention.
 */
export default function StudioWaitlistCard({ slug }) {
  const [open, setOpen] = useState(false);
  const [desiredPeriod, setDesiredPeriod] = useState("");
  const [motif, setMotif] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const authPayload = { email, password, ...(authMode === "register" ? { name } : {}) };
      try {
        await studioApi.post(`/t/${slug}/auth/${authMode}`, authPayload);
      } catch (err) {
        if (authMode === "login" && err.response?.status === 401) throw new Error("E-Mail oder Passwort ist falsch.");
        if (authMode === "register" && err.response?.status === 400) throw new Error(err.response.data?.error || "Registrierung fehlgeschlagen.");
        throw err;
      }
      await studioApi.post(`/t/${slug}/waitlist`, { desiredPeriod, motifRough: motif || undefined });
      setDone(true);
    } catch (err) {
      setError(err.message || err.response?.data?.error || "Etwas ist schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-3xl shadow-card p-6 text-center">
        <CheckCircle2 size={22} className="text-zinc-900 mx-auto mb-2" />
        <p className="text-sm font-inter text-zinc-700">Wir melden uns, sobald ein Termin frei wird.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-2.5">
          <Bell size={16} className="text-zinc-500" />
          <span className="font-inter font-medium text-sm text-zinc-900">Kein Termin passt gerade?</span>
        </span>
        {open ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>

      {open && (
        <form onSubmit={submit} className="px-5 pb-5 space-y-3">
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Wunschzeitraum</Label>
            <Input value={desiredPeriod} onChange={(e) => setDesiredPeriod(e.target.value)} placeholder="z.B. Anfang September" required className="rounded-xl h-10" />
          </div>
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Motiv (optional)</Label>
            <Input value={motif} onChange={(e) => setMotif(e.target.value)} className="rounded-xl h-10" />
          </div>

          <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-inter font-medium transition-colors ${authMode === "login" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
            >
              Schon Kunde
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-inter font-medium transition-colors ${authMode === "register" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
            >
              Neu hier
            </button>
          </div>
          {authMode === "register" && (
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="rounded-xl h-10" />
          )}
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" required className="rounded-xl h-10" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" required className="rounded-xl h-10" />

          {error && <p className="text-xs text-red-600 font-inter">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : "Auf die Warteliste"}
          </Button>
        </form>
      )}
    </div>
  );
}
