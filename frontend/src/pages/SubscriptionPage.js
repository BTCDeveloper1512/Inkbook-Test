import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircle, Crown, Zap, AlertCircle, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMPARISON = [
  { feature: "Buchungen/Monat", basic: "50", pro: "Unbegrenzt" },
  { feature: "Artist-Profile", basic: "1", pro: "5" },
  { feature: "Analytics", basic: "Basis", pro: "Premium" },
  { feature: "Listing-Position", basic: "Standard", pro: "Priorität" },
  { feature: "Support", basic: "E-Mail", pro: "Priority" },
  { feature: "Verifizierungs-Badge", basic: false, pro: true },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState({});
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
  if (!user) {
    navigate("/login");
    return;
  }

  if (user.role !== "studio_owner" && user.role !== "admin") {
    navigate("/dashboard");
    return;
  }

  fetchData();

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const plan = params.get("plan");

  if (sessionId && plan) {
    verifyPayment(sessionId, plan);
  }
}, [user, navigate, verifyPayment]);

  const fetchData = async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        axios.get(`${API}/subscriptions/plans`),
        axios.get(`${API}/subscriptions/status`, { withCredentials: true })
      ]);
      setPlans(plansRes.data);
      setSubStatus(statusRes.data);
    } catch {} finally { setLoading(false); }
  };

  const verifyPayment = async (sessionId, plan) => {
    setVerifying(true);
    try {
      const { data } = await axios.get(`${API}/subscriptions/verify/${sessionId}`, { params: { plan }, withCredentials: true });
      if (data.status === "active") { fetchData(); window.history.replaceState({}, "", "/subscription"); }
    } catch {} finally { setVerifying(false); }
  };

  const handleSubscribe = async (planKey) => {
    setCheckoutLoading(planKey);
    try {
      const { data } = await axios.post(`${API}/subscriptions/checkout`, { plan: planKey, origin_url: window.location.origin }, { withCredentials: true });
      window.location.href = data.url;
    } catch (e) { alert(e.response?.data?.detail || "Fehler beim Checkout"); } finally { setCheckoutLoading(""); }
  };

  const handleCancel = async () => {
    if (!window.confirm("Abo wirklich kündigen?")) return;
    setCancelLoading(true);
    try {
      await axios.post(`${API}/subscriptions/cancel`, {}, { withCredentials: true });
      fetchData();
    } catch {} finally { setCancelLoading(false); }
  };

  const activeSubscription = subStatus?.subscription;
  const isActive = activeSubscription?.status === "active";

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-zinc-100 py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-3">Für Studios</p>
            <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-zinc-900 mb-3">Studio-Abo wählen</h1>
            <p className="text-zinc-500 font-inter">Alles was du brauchst, um dein Tattoo-Studio erfolgreich zu betreiben.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Verifying */}
        <AnimatePresence>
          {verifying && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center text-sm font-inter text-blue-700 flex items-center justify-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Zahlung wird überprüft...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Subscription Banner */}
        {isActive && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between"
            data-testid="active-subscription-banner"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-600" strokeWidth={1.5} />
              <div>
                <p className="font-inter font-semibold text-emerald-800">
                  Aktives Abo: <span className="capitalize">{activeSubscription.plan}</span> Plan
                </p>
                <p className="text-xs text-emerald-600 font-inter mt-0.5 flex items-center gap-1">
                  <Calendar size={11} strokeWidth={1.5} /> Läuft ab: {new Date(activeSubscription.expires_at).toLocaleDateString("de-DE")}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="text-xs text-red-500 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 font-inter transition-all disabled:opacity-50"
              data-testid="cancel-subscription-btn"
            >
              {cancelLoading ? "..." : "Kündigen"}
            </button>
          </motion.div>
        )}

        {activeSubscription?.status === "cancelled" && (
          <div className="mb-10 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600" strokeWidth={1.5} />
            <p className="text-sm font-inter text-amber-700">Dein Abo wurde gekündigt. Wähle einen neuen Plan.</p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {Object.entries(plans).map(([key, plan], idx) => {
            const isCurrentPlan = activeSubscription?.plan === key && isActive;
            const isPro = key === "pro";
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`relative bg-white rounded-2xl border p-8 transition-all duration-300 ${
                  isPro ? "border-zinc-900 shadow-[0_20px_40px_rgb(0,0,0,0.08)]" : "border-zinc-200 hover:border-zinc-300 shadow-[0_4px_16px_rgb(0,0,0,0.04)]"
                } ${isCurrentPlan ? "ring-2 ring-emerald-400 ring-offset-2" : ""}`}
                data-testid={`plan-card-${key}`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-4 py-1.5 rounded-full font-inter font-semibold tracking-widest uppercase">
                    Empfohlen
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-sm font-inter font-semibold ${
                  isPro ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                }`}>
                  {isPro ? <Crown size={14} strokeWidth={1.5} /> : <Zap size={14} strokeWidth={1.5} />}
                  {plan.name}
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-playfair font-semibold text-zinc-900">€{plan.price}</span>
                  <span className="text-zinc-400 font-inter ml-1">/Monat</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm font-inter text-zinc-600">
                      <CheckCircle size={14} className={isPro ? "text-zinc-900" : "text-emerald-500"} strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => !isCurrentPlan && handleSubscribe(key)}
                  disabled={isCurrentPlan || checkoutLoading === key}
                  className={`w-full py-3 rounded-full font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                      : isPro
                      ? "btn-primary"
                      : "btn-secondary"
                  } disabled:opacity-50`}
                  data-testid={`subscribe-${key}-btn`}
                >
                  {checkoutLoading === key ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Weiterleitung...</>
                  ) : isCurrentPlan ? (
                    <><CheckCircle size={15} /> Aktiver Plan</>
                  ) : (
                    <>{plan.name} wählen <ChevronRight size={15} /></>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="font-playfair font-semibold text-lg text-zinc-900">Pläne im Vergleich</h3>
          </div>
          <div className="grid grid-cols-3 px-6 py-3 border-b border-zinc-100">
            <span className="text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400">Feature</span>
            <span className="text-center text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400">Basic</span>
            <span className="text-center text-xs font-inter font-semibold tracking-widest uppercase text-zinc-900">Pro</span>
          </div>
          <div className="divide-y divide-zinc-50">
            {COMPARISON.map((row, i) => (
              <div key={i} className="grid grid-cols-3 px-6 py-3 text-sm font-inter hover:bg-zinc-50 transition-colors">
                <span className="text-zinc-600">{row.feature}</span>
                <span className="text-center text-zinc-500">
                  {typeof row.basic === "boolean" ? (row.basic ? <CheckCircle size={14} className="mx-auto text-emerald-500" /> : <span className="text-zinc-300">—</span>) : row.basic}
                </span>
                <span className="text-center font-semibold text-zinc-900">
                  {typeof row.pro === "boolean" ? (row.pro ? <CheckCircle size={14} className="mx-auto text-zinc-900" /> : <span className="text-zinc-300">—</span>) : row.pro}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/studio-dashboard" className="text-sm text-zinc-400 font-inter hover:text-zinc-700 transition-colors underline underline-offset-2">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
