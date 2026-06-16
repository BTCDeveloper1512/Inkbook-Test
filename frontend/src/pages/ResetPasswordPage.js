import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Das Passwort muss mindestens 8 Zeichen lang sein."); return; }
    if (password !== confirm) { setError("Die Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, new_password: password }, { withCredentials: true });
      setDone(true);
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Fehler beim Zurücksetzen. Bitte fordere einen neuen Link an.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-playfair font-bold text-sm">I</span>
          </div>
          <span className="text-lg font-playfair font-semibold text-zinc-900">StudioOS</span>
        </Link>

        {/* Invalid / missing token */}
        {!token && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 className="text-xl font-playfair font-semibold text-zinc-900 mb-2">Ungültiger Link</h2>
            <p className="text-sm text-zinc-500 font-inter mb-6">Dieser Reset-Link ist ungültig oder fehlt.</p>
            <Link to="/login" className="text-sm font-inter font-medium text-zinc-900 hover:underline">Zurück zur Anmeldung</Link>
          </div>
        )}

        {/* Success state */}
        {token && done && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-2xl font-playfair font-semibold text-zinc-900 mb-3">Passwort geändert</h2>
            <p className="text-sm text-zinc-500 font-inter leading-relaxed mb-8">
              Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="btn-primary w-full justify-center"
              data-testid="go-to-login-btn"
            >
              Zur Anmeldung
            </motion.button>
          </motion.div>
        )}

        {/* Reset form */}
        {token && !done && (
          <>
            <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-2">Neues Passwort</h1>
            <p className="text-sm text-zinc-500 font-inter mb-8 leading-relaxed">
              Wähle ein neues, sicheres Passwort für dein StudioOS-Konto.
            </p>

            {error && (
              <div
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-inter mb-5"
                data-testid="reset-error"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="input-base w-full"
                  placeholder="Mindestens 8 Zeichen"
                  data-testid="reset-password-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="input-base w-full"
                  placeholder="••••••••"
                  data-testid="reset-confirm-input"
                />
              </div>

              {/* Strength hint */}
              {password.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: password.length < 6
                          ? (i === 0 ? "#ef4444" : "#e4e4e7")
                          : password.length < 10
                          ? (i < 2 ? "#f59e0b" : "#e4e4e7")
                          : (i < 3 ? "#22c55e" : "#e4e4e7"),
                      }}
                    />
                  ))}
                  <span className="text-xs text-zinc-400 font-inter ml-1">
                    {password.length < 6 ? "Schwach" : password.length < 10 ? "Mittel" : "Stark"}
                  </span>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 !mt-6"
                data-testid="reset-submit-btn"
              >
                {loading ? "Wird gespeichert..." : "Passwort speichern"}
              </motion.button>
            </form>

            <p className="text-center mt-6">
              <Link to="/login" className="text-xs text-zinc-400 hover:text-zinc-700 font-inter transition-colors">
                Zurück zur Anmeldung
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
