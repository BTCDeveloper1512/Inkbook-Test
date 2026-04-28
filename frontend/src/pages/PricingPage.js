import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Check, X, Zap, Star, Crown, Sparkles, ArrowRight, Plus
} from "lucide-react";

const PLANS = [
  {
    key: "free",
    icon: <Sparkles size={18} strokeWidth={1.5} />,
    name: "Kostenlos",
    subtitle: "Zum Reinschnuppern",
    price: 0,
    period: "",
    color: "zinc",
    badge: null,
    features: [
      { label: "1 Artist", ok: true },
      { label: "5 Slots / Monat", ok: true },
      { label: "5 Portfolio-Bilder", ok: true },
      { label: "Basis-Profil", ok: true },
      { label: "Kontaktformular", ok: true },
      { label: "InkBook-Branding sichtbar", ok: false, note: "Pflicht" },
      { label: "Chat-Terminbestätigung", ok: false },
      { label: "Analytics", ok: false },
      { label: "Bewertungen", ok: false },
    ],
  },
  {
    key: "starter",
    icon: <Zap size={18} strokeWidth={1.5} />,
    name: "Starter",
    subtitle: "Für wachsende Studios",
    price: 19.99,
    period: "/ Monat",
    color: "blue",
    badge: null,
    features: [
      { label: "2 Artists", ok: true },
      { label: "20 Slots / Monat", ok: true },
      { label: "20 Portfolio-Bilder", ok: true },
      { label: "Vollständiges Studio-Profil", ok: true },
      { label: "Chat-Terminbestätigung", ok: true },
      { label: "E-Mail-Benachrichtigungen", ok: true },
      { label: "Basis-Statistiken", ok: true },
      { label: "Bewertungen sammeln", ok: true },
      { label: "Kein InkBook-Branding", ok: true },
    ],
  },
  {
    key: "pro",
    icon: <Star size={18} strokeWidth={1.5} />,
    name: "Pro",
    subtitle: "Für etablierte Studios",
    price: 49.99,
    period: "/ Monat",
    color: "violet",
    badge: "Beliebt",
    features: [
      { label: "4 Artists", ok: true },
      { label: "Unlimited Slots", ok: true },
      { label: "100 Portfolio-Bilder", ok: true },
      { label: "Alles aus Starter", ok: true },
      { label: "Anzahlungsfunktion (Stripe)", ok: true },
      { label: "Erweiterte Statistiken", ok: true },
      { label: "Kalender-Sync (Google/Apple)", ok: true },
      { label: "Priorität in der Suche", ok: true },
      { label: "Storno-Management", ok: true },
    ],
  },
  {
    key: "full_studio",
    icon: <Crown size={18} strokeWidth={1.5} />,
    name: "Full Studio",
    subtitle: "Das Komplettpaket",
    price: 149.99,
    period: "/ Monat",
    color: "amber",
    badge: "Premium",
    features: [
      { label: "Unlimited Artists", ok: true },
      { label: "Unlimited Slots", ok: true },
      { label: "Unlimited Portfolio-Bilder", ok: true },
      { label: "Alles aus Pro", ok: true },
      { label: "Videoberatung mit Kunden", ok: true },
      { label: "Newsletter-Kampagnen", ok: true },
      { label: "Dedicated Admin Support", ok: true },
      { label: "Hervorgehobenes Profil (Banner)", ok: true },
      { label: "SMS-Erinnerungen", ok: true },
    ],
  },
];

const ADDONS = [
  { label: "Extra Artist", price: "9,99 €/Monat", icon: "+" },
  { label: "Newsletter-Boost (Einzelaktion)", price: "24,99 €", icon: "📢" },
  { label: "Zusätzliche 50 Portfolio-Bilder", price: "4,99 €/Monat", icon: "🖼" },
  { label: "Verifiziertes Studio-Badge", price: "9,99 €/Monat", icon: "✓" },
  { label: "SMS-Erinnerungen (100 Stück)", price: "4,99 €", icon: "💬" },
];

const colorMap = {
  zinc:   { badge: "bg-zinc-100 text-zinc-600", ring: "ring-zinc-200", btn: "bg-zinc-900 text-white hover:bg-zinc-700", icon: "bg-zinc-100 text-zinc-700" },
  blue:   { badge: "bg-blue-50 text-blue-600", ring: "ring-blue-200", btn: "bg-blue-600 text-white hover:bg-blue-700", icon: "bg-blue-50 text-blue-600" },
  violet: { badge: "bg-violet-50 text-violet-600", ring: "ring-violet-400", btn: "bg-violet-600 text-white hover:bg-violet-700", icon: "bg-violet-50 text-violet-600" },
  amber:  { badge: "bg-amber-50 text-amber-700", ring: "ring-amber-300", btn: "bg-amber-500 text-white hover:bg-amber-600", icon: "bg-amber-50 text-amber-600" },
};

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const handleSelect = (planKey) => {
    if (planKey === "free") return;
    if (!user) { navigate("/login"); return; }
    if (user.role !== "studio_owner") { navigate("/studio-dashboard"); return; }
    navigate(`/subscription?plan=${planKey}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 px-6 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-4">
          <Sparkles size={12} strokeWidth={1.5} /> Abo-Modell
        </span>
        <h1 className="text-4xl sm:text-5xl font-inter font-black text-zinc-900 leading-tight mb-4">
          Das richtige Paket<br />für dein Studio.
        </h1>
        <p className="text-zinc-500 font-inter text-base max-w-xl mx-auto">
          Starte kostenlos. Wachse mit deinem Studio. Kündige jederzeit.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto w-full pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const c = colorMap[plan.color];
            const isHighlighted = plan.badge === "Beliebt";
            return (
              <div
                key={plan.key}
                onMouseEnter={() => setHovered(plan.key)}
                onMouseLeave={() => setHovered(null)}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-300 ${
                  isHighlighted
                    ? `ring-2 ${c.ring} shadow-xl shadow-violet-100`
                    : hovered === plan.key
                    ? "shadow-lg border-zinc-200"
                    : "border-zinc-100 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-inter font-bold px-3 py-1 rounded-full ${c.badge} border border-current`}>
                    {plan.badge}
                  </span>
                )}

                {/* Header */}
                <div className="mb-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}>
                    {plan.icon}
                  </div>
                  <p className="font-inter font-black text-zinc-900 text-lg">{plan.name}</p>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div className="mb-6 pb-5 border-b border-zinc-100">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-inter font-black text-zinc-900">Kostenlos</span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-inter font-black text-zinc-900">
                        {plan.price.toFixed(2).replace(".", ",")} €
                      </span>
                      <span className="text-sm text-zinc-400 font-inter mb-1">{plan.period}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${f.ok ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {f.ok
                          ? <Check size={9} strokeWidth={3} />
                          : <X size={9} strokeWidth={2.5} />}
                      </span>
                      <span className={`text-xs font-inter leading-snug ${f.ok ? "text-zinc-700" : "text-zinc-400 line-through"}`}>
                        {f.label}
                        {f.note && <span className="ml-1 text-zinc-400 no-underline">({f.note})</span>}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.key === "free" ? (
                  <Link
                    to="/register"
                    className={`w-full text-center py-2.5 rounded-xl text-sm font-inter font-semibold transition-all ${c.btn}`}
                    data-testid={`pricing-cta-${plan.key}`}
                  >
                    Kostenlos starten
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.key)}
                    className={`w-full py-2.5 rounded-xl text-sm font-inter font-semibold transition-all flex items-center justify-center gap-2 ${c.btn}`}
                    data-testid={`pricing-cta-${plan.key}`}
                  >
                    Jetzt wählen <ArrowRight size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature comparison table (condensed) */}
      <section className="px-6 max-w-5xl mx-auto w-full pb-20">
        <h2 className="text-xl font-inter font-black text-zinc-900 mb-6 text-center">
          Alle Features im Überblick
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
          <table className="w-full text-sm font-inter">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left p-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider w-1/3">Feature</th>
                {PLANS.map(p => (
                  <th key={p.key} className="p-4 text-center text-zinc-700 font-bold text-sm">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Artists", "1", "2", "4", "Unlim."],
                ["Slots / Monat", "5", "20", "Unlim.", "Unlim."],
                ["Portfolio-Bilder", "5", "20", "100", "Unlim."],
                ["Chat-Bestätigung", false, true, true, true],
                ["E-Mail-Benach.", false, true, true, true],
                ["Anzahlung (Stripe)", false, false, true, true],
                ["Videoberatung", false, false, false, true],
                ["Newsletter", false, false, false, true],
                ["Priority-Listing", false, false, true, true],
                ["SMS-Erinnerungen", false, false, false, true],
              ].map(([label, ...vals], ri) => (
                <tr key={ri} className={`border-b border-zinc-50 ${ri % 2 === 0 ? "bg-zinc-50/30" : ""}`}>
                  <td className="p-4 text-zinc-600 font-medium text-xs">{label}</td>
                  {vals.map((v, vi) => (
                    <td key={vi} className="p-4 text-center">
                      {typeof v === "boolean" ? (
                        v
                          ? <span className="inline-flex w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full items-center justify-center mx-auto"><Check size={10} strokeWidth={3} /></span>
                          : <span className="inline-flex w-5 h-5 bg-zinc-100 text-zinc-300 rounded-full items-center justify-center mx-auto"><X size={10} strokeWidth={2} /></span>
                      ) : (
                        <span className="text-xs text-zinc-700 font-semibold">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add-ons */}
      <section className="px-6 max-w-4xl mx-auto w-full pb-20">
        <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100">
          <div className="flex items-center gap-2 mb-2">
            <Plus size={16} strokeWidth={2} className="text-zinc-500" />
            <h2 className="text-lg font-inter font-black text-zinc-900">Einzeln buchbare Add-ons</h2>
          </div>
          <p className="text-xs text-zinc-400 font-inter mb-6">Ergänze deinen Plan mit gezielten Extras.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ADDONS.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-zinc-100 shadow-sm">
                <span className="text-sm font-inter text-zinc-700 font-medium">{a.label}</span>
                <span className="text-sm font-inter font-bold text-zinc-900 whitespace-nowrap ml-3">{a.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 font-inter mt-5 text-center">
            Add-ons auf Anfrage buchbar — <a href="mailto:support@inkbook.de" className="underline hover:text-zinc-600">support@inkbook.de</a>
          </p>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="px-6 max-w-3xl mx-auto w-full pb-20 text-center">
        <p className="text-sm font-inter text-zinc-500">
          Fragen zum Abo?{" "}
          <a href="/faq" className="text-zinc-900 font-semibold underline hover:no-underline">FAQ ansehen</a>
          {" · "}
          <a href="/ueber-uns" className="text-zinc-900 font-semibold underline hover:no-underline">Kontakt aufnehmen</a>
        </p>
      </section>

      <Footer />
    </div>
  );
}
