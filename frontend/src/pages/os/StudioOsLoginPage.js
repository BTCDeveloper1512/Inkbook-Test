import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Store, User } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { EmailConfirmationPendingShell } from "./StudioOsEmailConfirmedPage";

/**
 * Studio-staff login/registration for the new backend. Separate from the
 * old /login page (different auth system entirely) until the rest of the
 * app has migrated over.
 */
export default function StudioOsLoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // null | "studio" | "customer"
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false); // login blocked pending confirmation
  const [pendingEmail, setPendingEmail] = useState(""); // set once registration itself is done
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      if (mode === "login") {
        await studioOsAuth.login(email, password);
        navigate("/os/dashboard");
      } else {
        const data = await studioOsAuth.register(email, password, name, studioName);
        if (data.pendingVerification) setPendingEmail(data.email);
        else navigate("/os/onboarding"); // defensive: older backend, session already set
      }
    } catch (err) {
      if (err.response?.data?.code === "email_unverified") setUnverified(true);
      setError(err.response?.data?.error || "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }

  async function resend(targetEmail) {
    setResending(true);
    try {
      await studioOsAuth.resendConfirmation(targetEmail);
    } catch {
      // Same stance as forgot-password: nothing to reveal either way.
    } finally {
      setResending(false);
      setResent(true);
    }
  }

  if (pendingEmail) {
    return <EmailConfirmationPendingShell email={pendingEmail} onResend={() => resend(pendingEmail)} resending={resending} resent={resent} />;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8"
        >
          <StudioOSWordmark className="mb-6" />
          <h1 className="font-playfair text-lg text-zinc-900 mb-1">Willkommen</h1>
          <p className="text-sm text-zinc-500 font-inter mb-6">Wie möchtest du dich anmelden?</p>

          <div className="space-y-3">
            {[
              { value: "studio", icon: Store, label: "Ich bin Studio", desc: "Termine planen, Angebote senden, Team verwalten" },
              { value: "customer", icon: User, label: "Ich bin Kunde", desc: "Deine Anfragen und Angebote ansehen" },
            ].map(({ value, icon: Icon, label, desc }) => (
              <motion.button
                key={value}
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  // Customers have their own entry point now: it authenticates
                  // first and works out which studios they belong to, instead
                  // of asking them to produce a link from memory.
                  if (value === "customer") {
                    navigate("/konto");
                    return;
                  }
                  setRole(value);
                  setError("");
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:shadow-soft text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-zinc-600" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-inter font-medium text-sm text-zinc-900">{label}</div>
                  <div className="font-inter text-xs text-zinc-500">{desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8">
        <StudioOSWordmark className="mb-6" />
        <div className="flex gap-1 mb-6 bg-zinc-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${mode === "login" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${mode === "register" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
          >
            Studio anlegen
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Dein Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" required />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Studio-Name</Label>
                <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="rounded-xl h-10" required />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" required />
          </div>
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" required />
          </div>

          {error && <p className="text-xs text-red-600 font-inter">{error}</p>}
          {unverified && (
            <button
              type="button"
              onClick={() => resend(email)}
              disabled={resending}
              className="text-xs font-inter text-zinc-900 underline underline-offset-2"
            >
              {resending ? "Wird gesendet…" : resent ? "Erneut gesendet" : "Bestätigungslink erneut senden"}
            </button>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Anmelden" : "Studio anlegen"}
          </Button>
        </form>
        {mode === "login" && (
          <button
            type="button"
            onClick={() => navigate("/os/passwort-vergessen")}
            className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-3"
          >
            Passwort vergessen?
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setRole(null);
            setError("");
          }}
          className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-4"
        >
          Ich bin Kunde
        </button>
      </motion.div>
    </div>
  );
}
