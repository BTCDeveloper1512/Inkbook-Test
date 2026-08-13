import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

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
 * "Passwort vergessen", Schritt 1: E-Mail anfordern.
 *
 * Die Bestätigung ist bewusst unabhängig davon, ob es das Konto gibt. Eine
 * ehrliche Fehlermeldung („kein Konto mit dieser E-Mail") würde die Seite in
 * ein Werkzeug verwandeln, mit dem sich fremde E-Mail-Adressen auf ein
 * StudioOS-Konto prüfen lassen.
 */
export function StudioOsForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await studioOsAuth.forgotPassword(email);
    } catch {
      // Auch ein Netzwerkfehler darf hier nichts über das Konto verraten.
    } finally {
      setSending(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Shell
        icon={MailCheck}
        title="E-Mail unterwegs"
        body={`Wenn es ein Konto mit ${email} gibt, liegt gleich ein Link zum Zurücksetzen im Postfach. Der Link gilt eine Stunde.`}
      >
        <Button onClick={() => navigate("/os/login")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Zurück zur Anmeldung
        </Button>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-3"
        >
          Andere E-Mail verwenden
        </button>
      </Shell>
    );
  }

  return (
    <Shell icon={KeyRound} title="Passwort vergessen" body="Gib die E-Mail deines Studio-Kontos ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" required autoFocus />
        </div>
        <Button type="submit" disabled={sending} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
          {sending ? <Loader2 size={16} className="animate-spin" /> : "Link anfordern"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => navigate("/os/login")}
        className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-4"
      >
        Zurück zur Anmeldung
      </button>
    </Shell>
  );
}

/**
 * Liest die Wiederherstellungs-Tokens aus dem URL-Fragment. Supabase meldet
 * abgelaufene oder schon benutzte Links über `error_description` im selben
 * Fragment — die Meldung von dort ist genauer als alles, was wir raten könnten.
 */
function readTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) return { tokens: { accessToken, refreshToken }, error: "" };
  return { tokens: null, error: hash.get("error_description") || "Dieser Link ist ungültig oder abgelaufen." };
}

/**
 * Schritt 2: das Ziel des Links aus der E-Mail. Supabase hängt die Tokens als
 * URL-Fragment an (`#access_token=…&refresh_token=…`), nicht als Query — ein
 * Fragment wird nie an einen Server gesendet und landet daher in keinem
 * Zugriffslog. Sie werden sofort aus der Adresszeile entfernt, damit sie nicht
 * im Verlauf stehen bleiben.
 */
export function StudioOsNewPasswordPage() {
  const navigate = useNavigate();
  // Synchron beim ersten Render gelesen, nicht in einem Effekt: läge das im
  // Effekt, wäre der Hash bereits verpasst, wenn die Komponente schon stand
  // und sich nur das Fragment ändert — ein Fragmentwechsel remountet die Route
  // nicht. Der hashchange-Listener unten deckt genau diesen Fall zusätzlich ab.
  const [tokens, setTokens] = useState(() => readTokens().tokens);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(() => (readTokens().tokens ? "" : readTokens().error));
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Sobald die Tokens im State liegen, kommen sie aus der Adresszeile raus —
    // sie sollen nicht im Verlauf oder in einem geteilten Link landen.
    if (tokens && window.location.hash) window.history.replaceState({}, "", window.location.pathname);
  }, [tokens]);

  useEffect(() => {
    const onHashChange = () => {
      const next = readTokens();
      if (next.tokens) {
        setTokens(next.tokens);
        setError("");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (password !== repeat) return setError("Die beiden Passwörter stimmen nicht überein.");
    setSaving(true);
    setError("");
    try {
      await studioOsAuth.resetPassword(tokens.accessToken, tokens.refreshToken, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Passwort konnte nicht gesetzt werden.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Shell
        icon={ShieldCheck}
        title="Passwort gesetzt"
        body="Melde dich jetzt mit dem neuen Passwort an. Danach fragt StudioOS wie gewohnt nach deinem Zwei-Faktor-Code."
      >
        <Button onClick={() => navigate("/os/login")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Zur Anmeldung
        </Button>
      </Shell>
    );
  }

  if (!tokens) {
    return (
      <Shell icon={KeyRound} title="Link ungültig" body={error}>
        <Button onClick={() => navigate("/os/passwort-vergessen")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Neuen Link anfordern
        </Button>
      </Shell>
    );
  }

  return (
    <Shell icon={KeyRound} title="Neues Passwort" body="Mindestens 8 Zeichen. Nach dem Speichern meldest du dich damit neu an.">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Neues Passwort</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" minLength={8} required autoFocus />
        </div>
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Wiederholen</Label>
          <Input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className="rounded-xl h-10" minLength={8} required />
        </div>
        {error && <p className="text-xs text-red-600 font-inter">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Passwort speichern"}
        </Button>
      </form>
    </Shell>
  );
}
