import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Trash2, ChevronRight, Check, AlertTriangle, ArrowLeft, Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function SuccessBanner({ message }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-inter">
      <Check size={15} strokeWidth={2.5} className="flex-shrink-0" />
      {message}
    </motion.div>
  );
}

function ErrorBanner({ message }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-inter">
      <AlertTriangle size={15} strokeWidth={2} className="flex-shrink-0" />
      {message}
    </motion.div>
  );
}

function ProfileSection({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/users/me`, { name }, { withCredentials: true });
      setUser(data);
      setSuccess("Name erfolgreich gespeichert.");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <AnimatePresence mode="wait">
        {success && <SuccessBanner key="s" message={success} />}
        {error && <ErrorBanner key="e" message={error} />}
      </AnimatePresence>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setSuccess(""); setError(""); }}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          placeholder="Dein Name"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">E-Mail</label>
        <div className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-400 cursor-not-allowed select-none">
          {user?.email}
        </div>
        <p className="text-xs text-zinc-400 font-inter mt-1.5">E-Mail-Adresse kann derzeit nicht geändert werden.</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading || name.trim() === (user?.name || "")}
        className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Speichern..." : "Änderungen speichern"}
      </motion.button>
    </form>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (next !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (next.length < 8) { setError("Neues Passwort muss mindestens 8 Zeichen haben."); return; }
    setLoading(true);
    try {
      await axios.put(`${API}/users/me/password`, { current_password: current, new_password: next }, { withCredentials: true });
      setSuccess("Passwort erfolgreich geändert.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Ändern des Passworts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <AnimatePresence mode="wait">
        {success && <SuccessBanner key="s" message={success} />}
        {error && <ErrorBanner key="e" message={error} />}
      </AnimatePresence>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">Aktuelles Passwort</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={e => { setCurrent(e.target.value); setError(""); setSuccess(""); }}
            className="w-full px-4 py-3 pr-11 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            placeholder="••••••••"
            required
          />
          <button type="button" onClick={() => setShowCurrent(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
            {showCurrent ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">Neues Passwort</label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={e => { setNext(e.target.value); setError(""); setSuccess(""); }}
            className="w-full px-4 py-3 pr-11 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            placeholder="Mindestens 8 Zeichen"
            required
          />
          <button type="button" onClick={() => setShowNext(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
            {showNext ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2 font-inter">Passwort bestätigen</label>
        <input
          type="password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError(""); setSuccess(""); }}
          className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:bg-white transition-colors ${
            confirm && next !== confirm ? "border-red-300 focus:border-red-400" : "border-zinc-200 focus:border-zinc-400"
          }`}
          placeholder="••••••••"
          required
        />
        {confirm && next !== confirm && (
          <p className="text-xs text-red-500 font-inter mt-1.5">Passwörter stimmen nicht überein.</p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading || !current || !next || !confirm}
        className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Speichern..." : "Passwort ändern"}
      </motion.button>
    </form>
  );
}

function AccountSection({ onDeleted }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setError(""); setLoading(true);
    try {
      await axios.delete(`${API}/users/me`, { withCredentials: true });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Löschen des Kontos.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="font-inter font-semibold text-red-800 text-sm">Konto löschen</h3>
            <p className="text-xs text-red-600 font-inter mt-1 leading-relaxed">
              Diese Aktion ist unwiderruflich. Alle deine Buchungen und persönlichen Daten werden dauerhaft gelöscht.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        </AnimatePresence>

        {!showConfirm ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirm(true)}
            className="px-5 py-2.5 bg-white border border-red-300 text-red-600 text-sm font-inter font-medium rounded-xl hover:bg-red-50 transition-colors"
          >
            Konto löschen
          </motion.button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-xs font-inter text-red-700 font-medium">
              Tippe <strong>LÖSCHEN</strong> ein, um zu bestätigen:
            </p>
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-red-300 rounded-xl text-sm font-inter focus:outline-none focus:border-red-500 transition-colors"
              placeholder="LÖSCHEN"
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDelete}
                disabled={confirm !== "LÖSCHEN" || loading}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-inter font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Löschen..." : "Endgültig löschen"}
              </motion.button>
              <button
                onClick={() => { setShowConfirm(false); setConfirm(""); setError(""); }}
                className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 text-sm font-inter font-medium rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "security", label: "Passwort", icon: Lock },
  { id: "account", label: "Konto", icon: Trash2 },
];

export default function CustomerSettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const handleDeleted = async () => {
    try { await logout(); } catch {}
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 font-inter mb-8 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          Zurück zum Dashboard
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="text-3xl font-playfair font-semibold text-zinc-900 mb-1">Einstellungen</h1>
          <p className="text-sm text-zinc-400 font-inter mb-8">Verwalte dein Konto und deine Sicherheitseinstellungen.</p>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            {/* Sidebar Nav */}
            <nav className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-inter font-medium transition-all ${
                      active
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} strokeWidth={active ? 2 : 1.5} />
                      {tab.label}
                    </div>
                    {!active && <ChevronRight size={13} strokeWidth={1.5} className="text-zinc-300" />}
                  </motion.button>
                );
              })}
            </nav>

            {/* Content Panel */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6 md:p-8">
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <h2 className="font-playfair font-semibold text-xl text-zinc-900 mb-1">Profil</h2>
                    <p className="text-xs text-zinc-400 font-inter mb-6">Dein Name wie er anderen angezeigt wird.</p>
                    <ProfileSection user={user} setUser={setUser} />
                  </motion.div>
                )}
                {activeTab === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <h2 className="font-playfair font-semibold text-xl text-zinc-900 mb-1">Passwort ändern</h2>
                    <p className="text-xs text-zinc-400 font-inter mb-6">Wähle ein sicheres Passwort mit mindestens 8 Zeichen.</p>
                    <PasswordSection />
                  </motion.div>
                )}
                {activeTab === "account" && (
                  <motion.div key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    <h2 className="font-playfair font-semibold text-xl text-zinc-900 mb-1">Konto</h2>
                    <p className="text-xs text-zinc-400 font-inter mb-6">Gefährliche Aktionen, die nicht rückgängig gemacht werden können.</p>
                    <AccountSection onDeleted={handleDeleted} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
