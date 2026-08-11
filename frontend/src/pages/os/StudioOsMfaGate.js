import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";

/**
 * Two-factor is mandatory for every staff account (backend: requireStaff in
 * plugins/auth.ts rejects any aal1 request everywhere except the MFA and
 * session-lookup endpoints). This is the one gate every /os/* route beyond
 * login goes through: it asks the backend where the session actually stands
 * and renders whichever of the two screens applies — set up a factor for
 * the first time, or answer a challenge for one that already exists — never
 * both, never neither. Children only render once the session is genuinely
 * at aal2.
 */
export default function StudioOsMfaGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | setup | verify | ready
  const navigate = useNavigate();

  const check = React.useCallback(async () => {
    try {
      const me = await studioOsAuth.me();
      if (me.aal === "aal2") setStatus("ready");
      else setStatus(me.mfaEnrolled ? "verify" : "setup");
    } catch {
      navigate("/os/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  if (status === "ready") return children;

  return status === "setup" ? <SetupMode onDone={check} /> : <VerifyMode onDone={check} />;
}

function CodeShell({ icon: Icon, title, body, children }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8"
      >
        <StudioOSWordmark className="mb-6" />
        <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Icon size={18} className="text-zinc-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-playfair text-lg text-zinc-900 mb-1">{title}</h1>
        <p className="text-sm text-zinc-500 font-inter mb-6 leading-relaxed">{body}</p>
        {children}
      </motion.div>
    </div>
  );
}

function OtpForm({ onSubmit, submitting, error, submitLabel }) {
  const [code, setCode] = useState("");
  const triedRef = useRef(false);

  useEffect(() => {
    if (code.length === 6 && !triedRef.current) {
      triedRef.current = true;
      onSubmit(code).finally(() => {
        triedRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="space-y-4">
      <InputOTP maxLength={6} value={code} onChange={setCode} disabled={submitting} containerClassName="justify-center">
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot key={i} index={i} className="w-11 h-12 text-base rounded-none first:rounded-l-xl last:rounded-r-xl" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && <p className="text-xs font-inter text-red-600 text-center">{error}</p>}
      <Button
        type="button"
        onClick={() => onSubmit(code)}
        disabled={submitting || code.length !== 6}
        className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}

/** Already has a verified factor, just needs to answer one challenge for it. */
function VerifyMode({ onDone }) {
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    studioOsAuth
      .mfaChallenge()
      .then(setChallenge)
      .catch((err) => setLoadError(err.response?.data?.error || "Code konnte nicht angefordert werden."));
  }, []);

  async function submit(code) {
    setSubmitting(true);
    setError("");
    try {
      await studioOsAuth.mfaVerify(challenge.factorId, challenge.challengeId, code);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Code ist falsch oder abgelaufen.");
      // A stale challenge can't be retried — the next attempt needs a fresh one.
      studioOsAuth.mfaChallenge().then(setChallenge).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CodeShell icon={Smartphone} title="Bestätigungscode" body="Gib den 6-stelligen Code aus deiner Authenticator-App ein.">
      {loadError ? (
        <p className="text-xs font-inter text-red-600">{loadError}</p>
      ) : !challenge ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-zinc-300" size={18} />
        </div>
      ) : (
        <OtpForm onSubmit={submit} submitting={submitting} error={error} submitLabel="Bestätigen" />
      )}
    </CodeShell>
  );
}

/** No factor yet — mandatory, so this is a wall, not an offer. */
function SetupMode({ onDone }) {
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    studioOsAuth
      .mfaEnroll()
      .then(setEnrollment)
      .catch((err) => setLoadError(err.response?.data?.error || "Einrichtung konnte nicht gestartet werden."));
  }, []);

  async function submit(code) {
    setSubmitting(true);
    setError("");
    try {
      const challenge = await studioOsAuth.mfaChallenge(enrollment.factorId);
      await studioOsAuth.mfaVerify(enrollment.factorId, challenge.challengeId, code);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Code ist falsch. Neu versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CodeShell
      icon={ShieldCheck}
      title="Zwei-Faktor einrichten"
      body="Aus Sicherheitsgründen ist das für jedes StudioOS-Konto Pflicht. Scanne den Code mit einer Authenticator-App (z. B. Google Authenticator, Authy) und gib den angezeigten 6-stelligen Code ein."
    >
      {loadError ? (
        <p className="text-xs font-inter text-red-600">{loadError}</p>
      ) : !enrollment ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-zinc-300" size={18} />
        </div>
      ) : (
        <>
          <div
            className="w-40 h-40 mx-auto mb-4 rounded-xl border border-zinc-100 bg-white p-2"
            dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
          />
          <details className="mb-4">
            <summary className="text-[11px] font-inter text-zinc-400 cursor-pointer text-center">Code manuell eingeben</summary>
            <p className="text-[11px] font-inter font-mono text-zinc-600 text-center mt-2 break-all">{enrollment.secret}</p>
          </details>
          <OtpForm onSubmit={submit} submitting={submitting} error={error} submitLabel="Bestätigen & aktivieren" />
        </>
      )}
    </CodeShell>
  );
}

