import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-playfair font-bold text-sm">I</span>
            </div>
            <span className="text-lg font-playfair font-semibold text-zinc-900">InkBook</span>
          </Link>

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
              <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">{t("auth.password")}</label>
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
        </motion.div>
      </div>

      {/* Image side */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/28991540/pexels-photo-28991540.jpeg?w=900&q=80" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/60 to-transparent flex items-end p-14">
          <div>
            <h2 className="text-4xl font-playfair text-white mb-2 leading-tight">Deine Kunst.<br />Dein Termin.</h2>
            <p className="text-white/70 font-inter text-sm">Premium Tattoo-Buchungsplattform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
