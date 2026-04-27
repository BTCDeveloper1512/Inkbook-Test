import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Section = ({ number, title, children }) => (
  <div className="mb-8">
    <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-4">§ {number} {title}</h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-sm text-zinc-500 font-inter">Stand: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <Section number={1} title="Geltungsbereich">
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der InkBook-Plattform
              (nachfolgend „Plattform"), die unter inkbook.de und zugehörigen Subdomains betrieben wird.
            </p>
            <p>
              Anbieter ist die InkBook GmbH (vollständige Angaben siehe{" "}
              <Link to="/impressum" className="underline text-zinc-900">Impressum</Link>).
            </p>
          </Section>

          <Section number={2} title="Leistungsbeschreibung">
            <p>InkBook ist eine Online-Plattform zur Vermittlung von Buchungen zwischen Tattoo-Studios/Artists und Kunden.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kunden (Endnutzer): Kostenlose Nutzung, Buchungen, Chat, Bewertungen</li>
              <li>Studios / Artists: Monatliches Abonnement für erweiterte Funktionen (Kalender, Kundenverwaltung, Dashboard)</li>
            </ul>
            <p className="text-zinc-400 italic">Weitere Details zu Leistungen folgen noch.</p>
          </Section>

          <Section number={3} title="Registrierung und Nutzerkonto">
            <p>
              Zur vollständigen Nutzung der Plattform ist eine Registrierung erforderlich. Der Nutzer verpflichtet sich,
              wahrheitsgemäße Angaben zu machen und sein Passwort geheim zu halten.
            </p>
            <p>InkBook behält sich vor, Konten bei Verstößen gegen diese AGB zu sperren oder zu löschen.</p>
          </Section>

          <Section number={4} title="Abonnement für Studios (Bezahlmodell)">
            <p>
              Studio-Inhaber können die Plattform im Rahmen eines monatlichen Abonnements nutzen. Die Abrechnung
              erfolgt über Stripe. Das Abonnement verlängert sich automatisch, sofern es nicht rechtzeitig gekündigt wird.
            </p>
            <p>
              Preise und Tarife sind im jeweiligen Abonnement-Bereich einsehbar. Änderungen werden mit einem
              Vorlauf von mindestens 30 Tagen angekündigt.
            </p>
            <p className="text-zinc-400 italic">Detaillierte Preisgestaltung folgt noch.</p>
          </Section>

          <Section number={5} title="Buchungen und Termine">
            <p>
              InkBook vermittelt Buchungen zwischen Kunden und Studios. Der Vertrag über einen Tattoo-Termin
              kommt ausschließlich zwischen dem Kunden und dem jeweiligen Studio zustande.
              InkBook ist nicht Vertragspartner für Tattoo-Leistungen.
            </p>
          </Section>

          <Section number={6} title="Haftung">
            <p>
              InkBook haftet nicht für die Qualität der Leistungen der auf der Plattform gelisteten Studios.
              Die Haftung für leichte Fahrlässigkeit ist – soweit gesetzlich zulässig – ausgeschlossen.
            </p>
            <p className="text-zinc-400 italic">Vollständige Haftungsregelung folgt noch.</p>
          </Section>

          <Section number={7} title="Datenschutz">
            <p>
              Informationen zur Verarbeitung personenbezogener Daten sind in unserer{" "}
              <Link to="/datenschutz" className="underline text-zinc-900">Datenschutzerklärung</Link> zu finden.
            </p>
          </Section>

          <Section number={8} title="Schlussbestimmungen">
            <p>Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist – sofern gesetzlich zulässig – der Sitz von InkBook.</p>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
              Bestimmungen unberührt.
            </p>
          </Section>

          <div className="pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-inter">
              Diese AGB befinden sich in Überarbeitung. Die finale Version wird vor dem offiziellen Launch veröffentlicht.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
