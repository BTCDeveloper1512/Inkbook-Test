import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ActivatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!email || !token) navigate("/login");
  }, [email, token, navigate]);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError("Passwort muss mindestens 8 Zeichen haben."); return; }
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/auth/activate`, {
        email, ghost_token: token, password
      }, { withCredentials: true });
      setUser(data);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Aktivierung fehlgeschlagen.");
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_8px_32px_rgb(0,0,0,0.06)] p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-playfair font-semibold text-2xl text-zinc-900 mb-2">Konto aktiviert!</h1>
        <p className="text-sm text-zinc-500 font-inter mb-6">Willkommen bei InkBook. Deine Anfragen und Buchungen findest du in deinem Dashboard.</p>
        <button onClick={() => navigate("/dashboard")}
          className="btn-primary w-full justify-center gap-2">
          Zum Dashboard <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_8px_32px_rgb(0,0,0,0.06)] p-8 w-full max-w-md">
          <h1 className="font-playfair font-semibold text-2xl text-zinc-900 mb-1">Konto aktivieren</h1>
          <p className="text-sm text-zinc-500 font-inter mb-6">Erstelle ein Passwort, um deine Buchung fortzusetzen und den Chat zu nutzen.</p>

          <div className="bg-zinc-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" strokeWidth={2} />
            <p className="text-xs text-zinc-600 font-inter truncate">{email}</p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Passwort</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen" required
                  className="input-base w-full pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPw ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Passwort bestätigen</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  type={showPw ? "text" : "password"} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Passwort wiederholen" required
                  className="input-base w-full pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-inter px-3 py-2.5 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 disabled:opacity-50">
              {loading ? "Wird aktiviert…" : "Konto aktivieren & weitermachen"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 font-inter mt-4">
            <Link to="/login" className="text-zinc-600 underline underline-offset-2 hover:text-zinc-900 transition-colors">Ich habe bereits ein vollständiges Konto</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
