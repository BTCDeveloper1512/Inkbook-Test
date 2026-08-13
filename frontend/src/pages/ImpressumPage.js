import React from "react";
import SiteHeader from "../components/SiteHeader";
import { Link } from "react-router-dom";

/**
 * Die Platzhalter bleiben bewusst als Platzhalter stehen und sind deutlich
 * markiert. Handelsregisternummer, USt-IdNr., Anschrift und Telefonnummer sind
 * in Deutschland Pflichtangaben — sie zu erfinden oder mit plausibel
 * aussehenden Beispielwerten zu füllen wäre schlimmer als eine sichtbare
 * Lücke, weil ein falsches Impressum genauso abmahnfähig ist wie ein
 * fehlendes, nur schwerer zu bemerken.
 */

const Section = ({ title, children }) => (
  <div className="mb-9 last:mb-0">
    <h2 className="font-playfair text-lg font-semibold text-zinc-900 mb-3">{title}</h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-1.5">{children}</div>
  </div>
);

const Placeholder = ({ label }) => (
  <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded font-inter font-medium">
    [{label}]
  </span>
);

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Impressum</h1>
          <p className="text-sm text-zinc-500 font-inter">Angaben gemäß § 5 DDG</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-8">
          <p className="text-sm font-inter text-amber-900 leading-relaxed">
            <span className="font-semibold">Noch unvollständig.</span> Die markierten Felder sind gesetzliche
            Pflichtangaben und müssen vor dem Start ausgefüllt werden. Ein unvollständiges Impressum ist abmahnfähig.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <Section title="Anbieter">
            <p><Placeholder label="Firmenname inkl. Rechtsform" /></p>
            <p><Placeholder label="Straße und Hausnummer" /></p>
            <p><Placeholder label="PLZ und Stadt" />, Deutschland</p>
          </Section>

          <Section title="Kontakt">
            <p>
              E-Mail: <Placeholder label="kontakt@…" />
            </p>
            <p>
              Telefon: <Placeholder label="+49 …" />
            </p>
          </Section>

          <Section title="Vertreten durch">
            <p><Placeholder label="Vor- und Nachname der Geschäftsführung" /></p>
          </Section>

          <Section title="Registereintrag">
            <p>
              Registergericht: <Placeholder label="Amtsgericht Stadt" />
            </p>
            <p>
              Registernummer: <Placeholder label="HRB …" />
            </p>
          </Section>

          <Section title="Umsatzsteuer-Identifikationsnummer">
            <p>
              Gemäß § 27a Umsatzsteuergesetz: <Placeholder label="DE …" />
            </p>
          </Section>

          <Section title="Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)">
            <p><Placeholder label="Vor- und Nachname" /></p>
            <p><Placeholder label="Anschrift" /></p>
          </Section>

          <Section title="Verbraucherstreitbeilegung">
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit. Wir sind nicht
              verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </Section>

          <Section title="Hinweis zu den Studios">
            <p>
              StudioOS ist eine Verwaltungssoftware für Tattoo-Studios und kein Marktplatz. Verträge über
              Tätowierungen oder Beratungen kommen ausschliesslich zwischen dem jeweiligen Studio und seinen
              Kundinnen und Kunden zustande. Für die Angaben auf einer Studio-Seite — einschliesslich des dort
              hinterlegten Impressums — ist allein das jeweilige Studio verantwortlich.
            </p>
          </Section>

          <Section title="Haftung für Links">
            <p>
              Für die Inhalte externer Links übernehmen wir keine Haftung. Für den Inhalt der verlinkten Seiten sind
              ausschliesslich deren Betreiber verantwortlich.
            </p>
          </Section>
        </div>

        <div className="flex gap-6 mt-8 text-xs text-zinc-400 font-inter">
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/ueber-uns" className="hover:text-zinc-700 transition-colors">Über uns</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
