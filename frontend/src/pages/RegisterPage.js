import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Users, Scissors } from "lucide-react";
import TattooAnimation from "../components/TattooAnimation";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); 
    if (!privacyAccepted) {
      setError("Bitte akzeptiere die Datenschutzerklärung und AGB um fortzufahren.");
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.email, form.password, form.name, form.role);
      navigate(user.role === "studio_owner" ? "/studio-dashboard" : "/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Registrierung fehlgeschlagen");
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-playfair font-bold text-sm">I</span>
            </div>
            <span className="text-lg font-playfair font-semibold">InkBook</span>
          </Link>

          <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-1">{t("auth.register")}</h1>
          <p className="text-sm text-zinc-500 font-inter mb-6">
            {t("auth.haveAccount")} <Link to="/login" className="text-zinc-900 font-medium hover:underline">{t("auth.login")}</Link>
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { role: "customer", label: "Als Kunde", icon: <Users size={16} strokeWidth={1.5} /> },
              { role: "studio_owner", label: "Als Studio", icon: <Scissors size={16} strokeWidth={1.5} /> }
            ].map(opt => (
              <motion.button key={opt.role} whileTap={{ scale: 0.97 }} type="button" onClick={() => setForm({ ...form, role: opt.role })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-inter text-sm transition-all duration-200 ${form.role === opt.role ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"}`}
                data-testid={`role-${opt.role === "customer" ? "customer" : "studio"}-btn`}>
                {opt.icon} {opt.label}
              </motion.button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-inter mb-4" data-testid="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: t("auth.name"), name: "name", type: "text", placeholder: "Dein Name", testid: "register-name-input" },
              { label: t("auth.email"), name: "email", type: "email", placeholder: "email@beispiel.de", testid: "register-email-input" },
              { label: t("auth.password"), name: "password", type: "password", placeholder: "••••••••", testid: "register-password-input" },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">{field.label}</label>
                <input type={field.type} name={field.name} value={form[field.name]} onChange={e => setForm({...form, [e.target.name]: e.target.value})} required className="input-base w-full" placeholder={field.placeholder} data-testid={field.testid} />
              </div>
            ))}
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading || !privacyAccepted} className="btn-primary w-full justify-center disabled:opacity-50" data-testid="register-submit-btn">
              {loading ? "Bitte warten..." : t("auth.register")}
            </motion.button>

            {/* Datenschutz-Checkbox */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="privacy-checkbox"
                type="checkbox"
                checked={privacyAccepted}
                onChange={e => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer flex-shrink-0"
                data-testid="privacy-checkbox"
              />
              <label htmlFor="privacy-checkbox" className="text-xs text-zinc-500 font-inter leading-relaxed cursor-pointer">
                Ich habe die{" "}
                <Link to="/datenschutz" className="text-zinc-900 underline hover:no-underline" target="_blank">
                  Datenschutzerklärung
                </Link>{" "}
                und die{" "}
                <Link to="/agb" className="text-zinc-900 underline hover:no-underline" target="_blank">
                  AGB
                </Link>{" "}
                gelesen und akzeptiere diese. Ich stimme der Verarbeitung meiner Daten gemäß DSGVO zu.
              </label>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
            <div className="relative flex justify-center"><span className="px-3 bg-zinc-50 text-xs text-zinc-400 font-inter">oder</span></div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGoogleLogin} className="btn-secondary w-full flex items-center justify-center gap-3" data-testid="google-register-btn">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t("auth.googleLogin")}
          </motion.button>
        </motion.div>
      </div>

      {/* Animation side */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white border-l border-zinc-100 items-center justify-center">
        <TattooAnimation />
      </div>
    </div>
  );
}
