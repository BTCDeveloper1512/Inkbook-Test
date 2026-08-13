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

// sessionStorage, not localStorage: an unfinished enrollment is scoped to the
// tab it was started in and shouldn't outlive it. Holds a secret, so it's
// cleared the moment the factor is verified.
const ENROLLMENT_KEY = "studioos.mfaEnrollment";

function readCachedEnrollment() {
  try {
    const raw = sessionStorage.getItem(ENROLLMENT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.factorId && parsed?.qrCode ? parsed : null;
  } catch {
    return null;
  }
}

function cacheEnrollment(value) {
  try {
    if (value) sessionStorage.setItem(ENROLLMENT_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(ENROLLMENT_KEY);
  } catch {
    /* private mode / storage disabled — setup still works, just not across reloads */
  }
}

/**
 * Supabase hands the TOTP QR over as `data:image/svg+xml;utf-8,<svg …>`.
 * That's a malformed data URI — `utf-8` isn't a `name=value` media-type
 * parameter — so it can't be trusted in an `<img src>`; the markup after the
 * comma, though, is a perfectly good inline SVG. Injecting the whole string
 * unchanged (what this used to do) rendered the prefix as literal text above
 * the code. Base64 variants are a valid URI and go straight into an <img>.
 */
function qrSource(raw) {
  const qr = (raw || "").trim();
  if (/^data:[^,]*;base64,/i.test(qr)) return { src: qr };
  const prefix = /^data:[^,]*,/.exec(qr);
  const body = prefix ? qr.slice(prefix[0].length) : qr;
  // Percent-encoded payloads are also in circulation; a bare "<" means it isn't.
  return { svg: withViewBox(body.startsWith("<") ? body : decodeURIComponent(body)) };
}

/**
 * The QR arrives with a pixel width/height but no viewBox. Sizing such an SVG
 * with CSS only resizes its viewport — the modules keep drawing at their
 * original scale, so the box shows the top-left corner of the code and a phone
 * has no complete code to scan. Deriving the viewBox from the declared
 * dimensions makes the content scale along with the box.
 */
function withViewBox(svg) {
  const open = /<svg\b[^>]*>/i.exec(svg);
  if (!open || /\bviewBox\s*=/i.test(open[0])) return svg;
  const w = /\bwidth\s*=\s*"?([\d.]+)/i.exec(open[0]);
  const h = /\bheight\s*=\s*"?([\d.]+)/i.exec(open[0]);
  if (!w || !h) return svg;
  const patched = open[0].replace(/<svg\b/i, `<svg viewBox="0 0 ${w[1]} ${h[1]}" preserveAspectRatio="xMidYMid meet"`);
  return svg.replace(open[0], patched);
}

/** No factor yet — mandatory, so this is a wall, not an offer. */
function SetupMode({ onDone }) {
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  // Enrolling creates a factor server-side, so this must fire exactly once per
  // mount — StrictMode's dev double-invoke would otherwise leave a dead factor
  // behind on every visit to this screen.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // The QR and secret can't be re-fetched for an existing factor, so they're
    // held here for the length of the tab: a reload mid-setup (or a dev-server
    // hot reload) then continues with the same factor instead of silently
    // replacing the secret the authenticator app was just given.
    const cached = readCachedEnrollment();
    studioOsAuth
      .mfaEnroll(cached?.factorId)
      .then((res) => {
        // `reused` means the server kept the factor and sent no QR — the one
        // to display is the cached one. Guarded anyway: an enrollment without
        // a QR would leave this screen on a spinner forever.
        const next = res.reused ? cached : res;
        if (!next?.qrCode) return restart();
        cacheEnrollment(next);
        setEnrollment(next);
      })
      .catch((err) => setLoadError(err.response?.data?.error || "Einrichtung konnte nicht gestartet werden."));
  }, []);

  /**
   * Escape hatch for a setup that can't be rescued: the app was given a secret
   * from an attempt whose factor is long gone, so every code it produces is
   * checked against something else. Dropping the cache and enrolling without
   * a reuse id sweeps the old factor and starts clean.
   */
  async function restart() {
    cacheEnrollment(null);
    setEnrollment(null);
    setError("");
    setLoadError("");
    try {
      const res = await studioOsAuth.mfaEnroll();
      cacheEnrollment(res);
      setEnrollment(res);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Einrichtung konnte nicht gestartet werden.");
    }
  }

  async function submit(code) {
    setSubmitting(true);
    setError("");
    try {
      const challenge = await studioOsAuth.mfaChallenge(enrollment.factorId);
      await studioOsAuth.mfaVerify(enrollment.factorId, challenge.challengeId, code);
      cacheEnrollment(null);
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
          {(() => {
            const qr = qrSource(enrollment.qrCode);
            // 176px rather than 160: phone cameras want a bit more to lock
            // onto, and the white p-3 padding is the code's quiet zone — most
            // scanners fail on a QR that runs right up against a border.
            const box = "w-44 h-44 mx-auto mb-4 rounded-xl border border-zinc-100 bg-white p-3 overflow-hidden";
            return qr.src ? (
              <div className={box}>
                <img src={qr.src} alt="QR-Code für die Authenticator-App" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className={`${box} [&>svg]:block [&>svg]:w-full [&>svg]:h-full`} dangerouslySetInnerHTML={{ __html: qr.svg }} />
            );
          })()}
          <details className="mb-4">
            <summary className="text-[11px] font-inter text-zinc-400 cursor-pointer text-center">Code manuell eingeben</summary>
            <p className="text-[11px] font-inter text-zinc-400 text-center mt-2">Als „Schlüssel" / „Setup key" in der App eintragen, Typ: zeitbasiert (TOTP).</p>
            <p className="text-xs font-inter font-mono tracking-wider text-zinc-700 text-center mt-1.5 break-all">{enrollment.secret}</p>
          </details>
          <OtpForm onSubmit={submit} submitting={submitting} error={error} submitLabel="Bestätigen & aktivieren" />
          <button
            type="button"
            onClick={restart}
            className="w-full text-[11px] font-inter text-zinc-400 hover:text-zinc-600 mt-3 transition-colors"
          >
            Code passt nicht? Neuen QR-Code erzeugen
          </button>
        </>
      )}
    </CodeShell>
  );
}

