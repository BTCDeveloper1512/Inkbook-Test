import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import TattooAnimation from "../components/TattooAnimation";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [view, setView] = useState("login"); // "login" | "forgot" | "forgot-sent" | "resend" | "resend-sent"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  // Resend activation state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [devActivateUrl, setDevActivateUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "studio_owner" ? "/studio-dashboard" : user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Anmeldung fehlgeschlagen");
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError(""); setForgotLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email: forgotEmail }, { withCredentials: true });
      setDevResetUrl(res.data?.reset_url || "");
      setView("forgot-sent");
    } catch (err) {
      const d = err.response?.data?.detail;
      setForgotError(typeof d === "string" ? d : "Fehler beim Senden. Bitte versuche es erneut.");
    } finally { setForgotLoading(false); }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError(""); setResendLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/resend-activation`, { email: resendEmail }, { withCredentials: true });
      setDevActivateUrl(res.data?.activate_url || "");
      setView("resend-sent");
    } catch (err) {
      const d = err.response?.data?.detail;
      setResendError(typeof d === "string" ? d : "Fehler. Bitte versuche es erneut.");
    } finally { setResendLoading(false); }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-playfair font-bold text-sm">I</span>
            </div>
            <span className="text-lg font-playfair font-semibold text-zinc-900">StudioOS</span>
          </Link>

          <AnimatePresence mode="wait">

            {/* ── LOGIN ── */}
            {view === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}>
                <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-1">{t("auth.login")}</h1>
                <p className="text-sm text-zinc-500 font-inter mb-8">
                  {t("auth.noAccount")} <Link to="/register" className="text-zinc-900 font-medium hover:underline">{t("auth.register")}</Link>
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-inter mb-6" data-testid="login-error">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">{t("auth.email")}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-base w-full" placeholder="email@beispiel.de" data-testid="login-email-input" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 font-inter">{t("auth.password")}</label>
                      <button
                        type="button"
                        onClick={() => { setView("forgot"); setForgotEmail(email); setForgotError(""); }}
                        className="text-xs text-zinc-400 hover:text-zinc-900 font-inter transition-colors"
                        data-testid="forgot-password-link"
                      >
                        Passwort vergessen?
                      </button>
                    </div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-base w-full" placeholder="••••••••" data-testid="login-password-input" />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50" data-testid="login-submit-btn">
                    {loading ? "Bitte warten..." : t("auth.login")}
                  </motion.button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-zinc-50 text-xs text-zinc-400 font-inter">oder</span></div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleGoogleLogin} className="btn-secondary w-full flex items-center justify-center gap-3" data-testid="google-login-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {t("auth.googleLogin")}
                </motion.button>

                <p className="text-center text-xs text-zinc-400 font-inter mt-5">
                  Anfrage als Gast gestellt?{" "}
                  <button type="button" onClick={() => { setView("resend"); setResendEmail(email); setResendError(""); }}
                    className="text-zinc-600 underline underline-offset-2 hover:text-zinc-900 transition-colors">
                    Aktivierungsmail erneut anfordern
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── PASSWORT VERGESSEN ── */}
            {view === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                <button onClick={() => setView("login")} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-inter mb-8 transition-colors" data-testid="back-to-login-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Zurück zur Anmeldung
                </button>

                <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-2">Passwort vergessen?</h1>
                <p className="text-sm text-zinc-500 font-inter mb-8 leading-relaxed">
                  Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
                </p>

                {forgotError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-inter mb-5" data-testid="forgot-error">{forgotError}</div>
                )}

                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">E-Mail-Adresse</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      className="input-base w-full"
                      placeholder="email@beispiel.de"
                      data-testid="forgot-email-input"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-primary w-full justify-center disabled:opacity-50"
                    data-testid="forgot-submit-btn"
                  >
                    {forgotLoading ? "Sende Link..." : "Reset-Link senden"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── E-MAIL GESENDET ── */}
            {view === "forgot-sent" && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="text-center py-4">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-playfair font-semibold text-zinc-900 mb-3">E-Mail gesendet</h2>
                <p className="text-sm text-zinc-500 font-inter leading-relaxed mb-8 max-w-xs mx-auto">
                  Falls ein Konto mit <strong className="text-zinc-700">{forgotEmail}</strong> existiert, hast du jetzt einen Reset-Link erhalten. Bitte auch den Spam-Ordner prüfen.
                </p>

                {/* Dev fallback: show direct link if email delivery is restricted */}
                {devResetUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6 text-left">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 font-inter">Kein E-Mail-Versand möglich</p>
                    <p className="text-xs text-amber-600 font-inter mb-3 leading-relaxed">
                      Die E-Mail konnte nicht zugestellt werden (Resend-Domain nicht verifiziert). Nutze diesen Link direkt:
                    </p>
                    <a
                      href={devResetUrl}
                      className="text-xs text-amber-800 font-inter font-medium underline break-all"
                      data-testid="dev-reset-link"
                    >
                      {devResetUrl}
                    </a>
                  </div>
                )}
                <button
                  onClick={() => { setView("login"); setForgotEmail(""); }}
                  className="text-sm font-inter font-medium text-zinc-900 hover:underline"
                  data-testid="back-to-login-after-sent-btn"
                >
                  Zurück zur Anmeldung
                </button>
              </motion.div>
            )}

            {/* ── AKTIVIERUNGSMAIL ERNEUT SENDEN ── */}
            {view === "resend" && (
              <motion.div key="resend" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                <button onClick={() => setView("login")} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-inter mb-8 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Zurück zur Anmeldung
                </button>

                <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-2">Aktivierungsmail</h1>
                <p className="text-sm text-zinc-500 font-inter mb-8 leading-relaxed">
                  Gib deine E-Mail-Adresse ein und wir senden dir einen neuen Aktivierungslink, mit dem du dein Passwort festlegen kannst.
                </p>

                {resendError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-inter mb-5">{resendError}</div>
                )}

                <form onSubmit={handleResend} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">E-Mail-Adresse</label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)}
                      required
                      className="input-base w-full"
                      placeholder="email@beispiel.de"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={resendLoading}
                    className="btn-primary w-full justify-center disabled:opacity-50"
                  >
                    {resendLoading ? "Sende Link..." : "Aktivierungsmail senden"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── AKTIVIERUNGSMAIL GESENDET ── */}
            {view === "resend-sent" && (
              <motion.div key="resend-sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="text-center py-4">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-playfair font-semibold text-zinc-900 mb-3">E-Mail gesendet</h2>
                <p className="text-sm text-zinc-500 font-inter leading-relaxed mb-8 max-w-xs mx-auto">
                  Falls ein Gast-Konto mit <strong className="text-zinc-700">{resendEmail}</strong> existiert, hast du jetzt einen neuen Aktivierungslink erhalten.
                </p>

                {devActivateUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6 text-left">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 font-inter">Direktlink (kein E-Mail-Versand)</p>
                    <a href={devActivateUrl} className="text-xs text-amber-800 font-inter font-medium underline break-all">{devActivateUrl}</a>
                  </div>
                )}

                <button
                  onClick={() => { setView("login"); setResendEmail(""); }}
                  className="text-sm font-inter font-medium text-zinc-900 hover:underline"
                >
                  Zurück zur Anmeldung
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>

      {/* Animation side */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white border-l border-zinc-100 items-center justify-center">
        <TattooAnimation />
      </div>
    </div>
  );
}
