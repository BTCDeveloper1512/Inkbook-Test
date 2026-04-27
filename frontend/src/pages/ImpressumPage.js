import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-4">{title}</h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">{children}</div>
  </div>
);

const Placeholder = ({ label }) => (
  <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded font-inter font-medium">[{label}]</span>
);

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Impressum</h1>
          <p className="text-sm text-zinc-500 font-inter">Angaben gemäß § 5 TMG</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8 space-y-0">
          <Section title="Anbieter">
            <p><strong>InkBook GmbH</strong> <span className="text-xs text-zinc-400">(Folgt noch)</span></p>
            <p><Placeholder label="Straße und Hausnummer" /></p>
            <p><Placeholder label="PLZ und Stadt" />, Deutschland</p>
          </Section>

          <Section title="Kontakt">
            <p>E-Mail: <Placeholder label="kontakt@inkbook.de" /></p>
            <p>Telefon: <Placeholder label="+49 XXX XXXXXXX" /></p>
          </Section>

          <Section title="Vertreten durch">
            <p>Geschäftsführung: <Placeholder label="Vor- und Nachname" /></p>
          </Section>

          <Section title="Registereintrag">
            <p>Eingetragen im Handelsregister</p>
            <p>Registergericht: <Placeholder label="Amtsgericht Stadt" /></p>
            <p>Registernummer: <Placeholder label="HRB XXXXX" /></p>
          </Section>

          <Section title="Umsatzsteuer-ID">
            <p>Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz:</p>
            <p><Placeholder label="DE XXXXXXXXX" /></p>
          </Section>

          <Section title="Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)">
            <p><Placeholder label="Vor- und Nachname" /></p>
            <p><Placeholder label="Adresse" /></p>
          </Section>

          <Section title="Haftungsausschluss">
            <p>
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
              externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </Section>

          <div className="pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-inter">Stand: <Placeholder label="Monat Jahr" /> · Alle Angaben werden kurzfristig vervollständigt.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-400 font-inter">
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
