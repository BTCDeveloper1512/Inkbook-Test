import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const TeamMember = ({ initials, name, role }) => (
  <div className="flex flex-col items-center text-center">
    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-3">
      <span className="text-white font-playfair font-bold text-lg">{initials}</span>
    </div>
    <p className="font-inter font-semibold text-sm text-zinc-900">{name}</p>
    <p className="font-inter text-xs text-zinc-400 mt-0.5">{role}</p>
  </div>
);

const ValueCard = ({ title, text }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 p-6">
    <h3 className="font-playfair text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 font-inter leading-relaxed">{text}</p>
  </div>
);

export default function UeberUnsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-zinc-900 text-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase text-zinc-500 font-inter mb-4">Über InkBook</p>
          <h1 className="font-playfair text-5xl font-semibold mb-6 leading-tight">
            Tattoo-Buchungen.<br />Neu gedacht.
          </h1>
          <p className="text-base text-zinc-400 font-inter leading-relaxed max-w-xl mx-auto">
            InkBook verbindet Tattoo-Enthusiasten mit den besten Studios und Artists Deutschlands –
            einfach, transparent und ohne Wartezeiten.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Unsere Mission</p>
          <h2 className="font-playfair text-3xl font-semibold text-zinc-900 mb-4">
            Tattoos zugänglicher machen.
          </h2>
          <p className="text-sm text-zinc-600 font-inter leading-relaxed mb-4">
            Wir glauben, dass jeder Mensch Zugang zu erstklassigen Tattoo-Artists verdient –
            unabhängig von Ort oder persönlichen Kontakten. InkBook macht es möglich,
            das perfekte Studio zu finden, Artists zu vergleichen und direkt zu buchen.
          </p>
          <p className="text-sm text-zinc-400 font-inter leading-relaxed italic">
            Weitere Details über unsere Geschichte und Vision folgen in Kürze.
          </p>
        </div>

        {/* Values */}
        <div>
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-6">Unsere Werte</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ValueCard
              title="Vertrauen"
              text="Verifizierte Studios, echte Bewertungen und transparente Preise – damit du sicher buchst."
            />
            <ValueCard
              title="Qualität"
              text="Wir kuratieren die besten Studios und unterstützen Artists dabei, ihr Portfolio zu zeigen."
            />
            <ValueCard
              title="Einfachheit"
              text="Von der Suche bis zur Buchung in wenigen Klicks. Kein Telefonieren, kein Warten."
            />
            <ValueCard
              title="Community"
              text="InkBook verbindet eine Gemeinschaft von Ink-Liebhabern und talentierten Künstlern."
            />
          </div>
        </div>

        {/* Team Placeholder */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-6">Das Team</p>
          <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
            <TeamMember initials="?" name="Folgt noch" role="CEO & Gründer" />
            <TeamMember initials="?" name="Folgt noch" role="CTO" />
            <TeamMember initials="?" name="Folgt noch" role="Design" />
            <TeamMember initials="?" name="Folgt noch" role="Business Dev." />
          </div>
          <p className="text-xs text-zinc-400 font-inter mt-6">
            Team-Profile werden in Kürze ergänzt.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-zinc-900 rounded-2xl p-8 text-center">
          <p className="font-playfair text-2xl text-white mb-2">Werde Teil von InkBook.</p>
          <p className="text-sm text-zinc-400 font-inter mb-6">
            Ob Studio-Inhaber oder Tattoo-Fan – InkBook ist für dich gemacht.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-inter font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              Kostenlos registrieren
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-inter font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              Studios entdecken
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
