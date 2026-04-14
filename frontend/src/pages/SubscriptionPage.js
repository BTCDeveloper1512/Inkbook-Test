import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircle, Crown, Zap, X, ChevronRight, AlertCircle, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_ICONS = { basic: <Zap size={20} />, pro: <Crown size={20} /> };
const PLAN_COLORS = { basic: "border-gray-300", pro: "border-black" };
const PLAN_BG = { basic: "bg-white", pro: "bg-black text-white" };

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
    if (!user) { navigate("/login"); return; }
    if (user.role !== "studio_owner" && user.role !== "admin") { navigate("/dashboard"); return; }
    fetchData();
    // Check for Stripe return
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const plan = params.get("plan");
    if (sessionId && plan) {
      verifyPayment(sessionId, plan);
    }
  }, [user]);

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
      const { data } = await axios.get(`${API}/subscriptions/verify/${sessionId}`, {
        params: { plan },
        withCredentials: true
      });
      if (data.status === "active") {
        fetchData();
        window.history.replaceState({}, "", "/subscription");
      }
    } catch {} finally { setVerifying(false); }
  };

  const handleSubscribe = async (planKey) => {
    if (!user) { navigate("/login"); return; }
    setCheckoutLoading(planKey);
    try {
      const { data } = await axios.post(`${API}/subscriptions/checkout`, {
        plan: planKey,
        origin_url: window.location.origin
      }, { withCredentials: true });
      window.location.href = data.url;
    } catch (e) {
      alert(e.response?.data?.detail || "Fehler beim Checkout");
    } finally { setCheckoutLoading(""); }
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
    <div className="min-h-screen bg-white"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-black text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-3">Für Studios</p>
          <h1 className="text-5xl font-playfair font-bold mb-4">Studio-Abo wählen</h1>
          <p className="text-gray-400 font-outfit">Alles was du brauchst, um dein Tattoo-Studio erfolgreich zu betreiben.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Verifying Banner */}
        {verifying && (
          <div className="mb-8 bg-blue-50 border border-blue-200 p-4 text-center text-sm font-outfit text-blue-700 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Zahlung wird überprüft...
          </div>
        )}

        {/* Current Subscription Banner */}
        {isActive && (
          <div className="mb-10 bg-green-50 border border-green-200 p-5 flex items-center justify-between" data-testid="active-subscription-banner">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="font-outfit font-semibold text-green-800">
                  Aktives Abo: <span className="capitalize">{activeSubscription.plan}</span> Plan
                </p>
                <p className="text-xs text-green-600 font-outfit mt-0.5 flex items-center gap-1">
                  <Calendar size={12} /> Läuft ab: {new Date(activeSubscription.expires_at).toLocaleDateString("de-DE")}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="text-xs text-red-600 border border-red-300 px-3 py-1.5 hover:bg-red-50 font-outfit transition-colors disabled:opacity-50"
              data-testid="cancel-subscription-btn"
            >
              {cancelLoading ? "..." : "Kündigen"}
            </button>
          </div>
        )}

        {activeSubscription?.status === "cancelled" && (
          <div className="mb-10 bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600" />
            <p className="text-sm font-outfit text-amber-700">Dein Abo wurde gekündigt. Wähle einen neuen Plan.</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrentPlan = activeSubscription?.plan === key && isActive;
            const isPro = key === "pro";
            return (
              <div
                key={key}
                className={`relative border-2 p-8 transition-all ${isPro ? "border-black" : "border-gray-200 hover:border-gray-400"} ${isCurrentPlan ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
                data-testid={`plan-card-${key}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-1 font-outfit font-semibold tracking-widest uppercase">
                    Empfohlen
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs px-3 py-1 font-outfit font-semibold">
                    Aktuell aktiv
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-outfit font-semibold ${isPro ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}>
                  {PLAN_ICONS[key]} {plan.name}
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-playfair font-bold">€{plan.price}</span>
                  <span className="text-gray-500 font-outfit">/Monat</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-outfit text-gray-600">
                      <CheckCircle size={14} className={isPro ? "text-black" : "text-green-500"} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && handleSubscribe(key)}
                  disabled={isCurrentPlan || checkoutLoading === key}
                  className={`w-full py-3 font-outfit font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                      : isPro
                      ? "bg-black text-white hover:bg-neutral-800"
                      : "border border-black text-black hover:bg-black hover:text-white"
                  } disabled:opacity-50`}
                  data-testid={`subscribe-${key}-btn`}
                >
                  {checkoutLoading === key ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Weiterleitung...</>
                  ) : isCurrentPlan ? (
                    <><CheckCircle size={16} /> Aktiver Plan</>
                  ) : (
                    <>{plan.name} wählen <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-playfair font-bold text-lg">Pläne im Vergleich</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { feature: "Buchungen/Monat", basic: "50", pro: "Unbegrenzt" },
              { feature: "Artist-Profile", basic: "1", pro: "5" },
              { feature: "Analytics", basic: "Basis", pro: "Premium" },
              { feature: "Listing-Position", basic: "Standard", pro: "Priorität" },
              { feature: "Support", basic: "E-Mail", pro: "Priority" },
              { feature: "Verifizierungs-Badge", basic: "✕", pro: "✓" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 px-6 py-3 text-sm font-outfit">
                <span className="text-gray-600">{row.feature}</span>
                <span className="text-center text-gray-500">{row.basic}</span>
                <span className="text-center font-semibold">{row.pro}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/studio-dashboard" className="text-sm text-gray-500 font-outfit hover:text-black underline">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
