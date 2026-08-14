import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";

function Shell({ icon: Icon, title, body, children }) {
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

/**
 * Same fragment-token pattern as StudioOsNewPasswordPage: Supabase appends
 * access_token/refresh_token/expires_in to the URL fragment after verifying
 * the confirmation link itself, and reports an expired/reused link via
 * error_description in that same fragment.
 */
function readTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in")) || undefined;
  if (accessToken && refreshToken) return { tokens: { accessToken, refreshToken, expiresIn }, error: "" };
  return { tokens: null, error: hash.get("error_description") || "Dieser Link ist ungültig oder abgelaufen." };
}

/**
 * Where the confirmation e-mail's link lands. Registration itself no longer
 * signs the studio in — this is the one place that turns "clicked the link"
 * into an actual session, then sends them into the same onboarding flow a
 * fresh registration always has.
 */
export default function StudioOsEmailConfirmedPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    const { tokens, error: readError } = readTokens();
    if (tokens && window.location.hash) window.history.replaceState({}, "", window.location.pathname);
    if (!tokens) {
      setStatus("error");
      setError(readError);
      return;
    }
    studioOsAuth
      .verifyEmail(tokens.accessToken, tokens.refreshToken, tokens.expiresIn)
      .then(() => {
        setStatus("done");
        navigate("/os/onboarding", { replace: true });
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "E-Mail konnte nicht bestätigt werden.");
      });
    // Runs once against whatever the link carried on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking" || status === "done") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  return (
    <Shell icon={ShieldAlert} title="Link ungültig" body={error}>
      <Button onClick={() => navigate("/os/login")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
        Zur Anmeldung
      </Button>
    </Shell>
  );
}

/** Exported for the "E-Mail unterwegs" screen on the login page itself — same MailCheck shell as the forgot-password flow. */
export function EmailConfirmationPendingShell({ email, onResend, resending, resent }) {
  return (
    <Shell
      icon={MailCheck}
      title="Fast geschafft"
      body={`Wir haben dir eine Bestätigungs-E-Mail an ${email} geschickt. Klick den Link darin, dann geht's mit der Einrichtung weiter.`}
    >
      <Button onClick={onResend} disabled={resending} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
        {resending ? <Loader2 size={16} className="animate-spin" /> : resent ? "Erneut gesendet" : "E-Mail erneut senden"}
      </Button>
    </Shell>
  );
}
