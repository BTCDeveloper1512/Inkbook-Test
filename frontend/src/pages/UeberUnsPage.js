import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
          <p className="text-xs tracking-widest uppercase text-zinc-500 font-inter mb-4">Über StudioOS</p>
          <h1 className="font-playfair text-5xl font-semibold mb-6 leading-tight">
            Tattoo-Buchungen.<br />Neu gedacht.
          </h1>
          <p className="text-base text-zinc-400 font-inter leading-relaxed max-w-xl mx-auto">
            StudioOS verbindet Tattoo-Enthusiasten mit den besten Studios und Artists Deutschlands –
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
            unabhängig von Ort oder persönlichen Kontakten. StudioOS macht es möglich,
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
              text="StudioOS verbindet eine Gemeinschaft von Ink-Liebhabern und talentierten Künstlern."
            />
          </div>
        </div>

        {/* Founder */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-8">Der Gründer</p>
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <img
                src="https://customer-assets.emergentagent.com/job_artist-connect-82/artifacts/mbnukf0c_fd29300d-306b-4d46-897e-8117f2919c2d.png"
                alt="Founder"
                className="w-36 h-36 rounded-2xl object-cover object-top shadow-md"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-block px-2.5 py-0.5 bg-zinc-100 rounded-full text-[10px] tracking-widest uppercase font-inter text-zinc-500 mb-3">
                Founder &amp; Developer
              </div>
              <p className="font-playfair text-xl font-semibold text-zinc-900 mb-3 leading-snug">
                IT-Background. Tattoo-Passion.<br className="hidden sm:block" /> Eine Idee daraus gemacht.
              </p>
              <p className="text-sm text-zinc-500 font-inter leading-relaxed">
                Als ausgebildeter Fachinformatiker und leidenschaftlicher Tech-Enthusiast arbeite ich seit Jahren
                in der IT-Branche. Parallel entdeckte ich das Tätowieren für mich – und merkte schnell,
                wie umständlich die gesamte Welt rund um Studio-Termine, Kommunikation und Buchungen ist.
                Verstreute Messenger, keine Übersicht, keine einfache Möglichkeit für Kunden zu buchen.
              </p>
              <p className="text-sm text-zinc-500 font-inter leading-relaxed mt-3">
                StudioOS ist meine Antwort darauf: Eine Plattform, die Termine, Chats, Studio-Profile
                und Kundenverwaltung in einem vereint – durchdacht, modern und speziell für
                die Tattoo-Community entwickelt.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-zinc-900 rounded-2xl p-8 text-center">
          <p className="font-playfair text-2xl text-white mb-2">Werde Teil von StudioOS.</p>
          <p className="text-sm text-zinc-400 font-inter mb-6">
            Ob Studio-Inhaber oder Tattoo-Fan – StudioOS ist für dich gemacht.
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
