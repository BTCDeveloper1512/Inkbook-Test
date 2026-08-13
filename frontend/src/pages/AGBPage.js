import React from "react";
import SiteHeader from "../components/SiteHeader";
import { Link } from "react-router-dom";

/**
 * Die Fassung aus der Replit-Zeit beschrieb StudioOS als Vermittlungsplattform
 * mit Bewertungen — also als Marktplatz. Genau das ist das Produkt bewusst
 * nicht: es gibt keine Suche, kein Verzeichnis, keine Bewertungen und keine
 * Verlinkung zwischen Studios. Ein Studio erreicht seine Kunden ausschliesslich
 * über den Link, den es selbst verteilt.
 *
 * Der Unterschied ist nicht kosmetisch: als Vermittler träfen den Anbieter
 * ganz andere Pflichten als als reiner Software-Anbieter. Deshalb ist hier
 * durchgehend von Software die Rede, und der Vertrag über das Tattoo kommt
 * ausdrücklich zwischen Studio und Kunde zustande.
 */

const Section = ({ number, title, children }) => (
  <div className="mb-9 last:mb-0">
    <h2 className="font-playfair text-lg font-semibold text-zinc-900 mb-3">
      <span className="text-zinc-300 mr-2">§{number}</span>
      {title}
    </h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">{children}</div>
  </div>
);

const Placeholder = ({ label }) => (
  <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded font-inter font-medium">
    [{label}]
  </span>
);

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-sm text-zinc-500 font-inter">
            Stand: <Placeholder label="Monat Jahr" />
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <Section number={1} title="Geltungsbereich und Anbieter">
            <p>
              Diese Bedingungen gelten für die Nutzung der Software StudioOS (nachfolgend „die Software") durch
              Tattoo-Studios und deren Personal sowie für die Nutzung der öffentlichen Buchungsseiten durch deren
              Kundinnen und Kunden.
            </p>
            <p>
              Anbieter der Software ist <Placeholder label="Firmenname" />, vollständige Angaben im{" "}
              <Link to="/impressum" className="underline text-zinc-900">Impressum</Link>.
            </p>
          </Section>

          <Section number={2} title="Gegenstand der Leistung">
            <p>
              StudioOS ist eine Verwaltungssoftware für Tattoo-Studios. Sie stellt einem Studio Werkzeuge zur
              Verfügung, um Anfragen anzunehmen, Angebote zu senden, Termine zu planen, mit Kundinnen und Kunden zu
              schreiben und Anzahlungen entgegenzunehmen.
            </p>
            <p className="font-medium text-zinc-800">
              StudioOS ist ausdrücklich kein Marktplatz und keine Vermittlungsplattform.
            </p>
            <p>
              Es gibt keine Suchfunktion, kein Verzeichnis, kein Ranking, keine Bewertungen und keine Verlinkung
              zwischen Studios. Die öffentliche Seite eines Studios ist ausschliesslich über den Link erreichbar, den
              das Studio selbst verteilt. Der Anbieter empfiehlt keine Studios, stellt keinen Kontakt her und wird zu
              keinem Zeitpunkt Partei des Vertrags zwischen Studio und Kunde.
            </p>
          </Section>

          <Section number={3} title="Zustandekommen von Verträgen">
            <p>
              Über die Software geschlossene Vereinbarungen über eine Tätowierung, Beratung oder sonstige Leistung
              kommen ausschliesslich zwischen dem jeweiligen Studio und der Kundin oder dem Kunden zustande. Der
              Anbieter schuldet allein die Bereitstellung der Software.
            </p>
            <p>
              Für Inhalt, Preis, Durchführung, Qualität, Terminzusagen, Gewährleistung und die Einhaltung
              hygiene- und gewerberechtlicher Vorschriften ist allein das Studio verantwortlich.
            </p>
          </Section>

          <Section number={4} title="Konten und Zwei-Faktor-Authentifizierung">
            <p>
              Für die Nutzung der Studio-Oberfläche ist ein Konto erforderlich. Angaben sind wahrheitsgemäss zu
              machen, Zugangsdaten geheim zu halten.
            </p>
            <p>
              Für jedes Studio-Konto ist die Zwei-Faktor-Authentifizierung verpflichtend. Ohne eingerichteten zweiten
              Faktor ist kein Zugriff auf die Studio-Oberfläche möglich. Der Verlust des zweiten Faktors kann über den
              Support zurückgesetzt werden.
            </p>
            <p>
              Kundinnen und Kunden legen ihr Konto jeweils bei dem Studio an, bei dem sie buchen. Bestehen Konten bei
              mehreren Studios, bleiben die dort hinterlegten Daten voneinander getrennt.
            </p>
          </Section>

          <Section number={5} title="Tarife, Preise und Laufzeit">
            <p>
              Die Software wird in den Tarifen Kostenlos, Starter und Pro angeboten. Der kostenlose Tarif ist zeitlich
              unbegrenzt nutzbar. Die kostenpflichtigen Tarife werden monatlich abgerechnet und verlängern sich um
              jeweils einen Monat, solange sie nicht gekündigt werden.
            </p>
            <p>
              Die Abrechnung erfolgt über Stripe. Kündigung und Tarifwechsel sind jederzeit zum Ende des laufenden
              Abrechnungszeitraums über die Abo-Verwaltung im Konto möglich; es gibt keine Mindestlaufzeit und keine
              Kündigungsfrist.
            </p>
            <p>
              Der Umfang der Tarife (Anzahl der Artists, Termine pro Monat, verfügbare Funktionen) ist auf der
              Startseite einsehbar. Preisänderungen werden mindestens <Placeholder label="Frist" /> im Voraus in
              Textform angekündigt; Studios können in diesem Fall zum Wirksamwerden der Änderung kündigen.
            </p>
          </Section>

          <Section number={6} title="Anzahlungen zwischen Studio und Kunde">
            <p>
              Ein Studio kann für einen Termin eine Anzahlung verlangen. Diese Zahlung erfolgt vom Kunden an das
              Studio; der Anbieter wickelt sie technisch über Stripe ab, wird aber nicht Gläubiger der Forderung.
            </p>
            <p>
              Ob und in welcher Höhe eine Anzahlung erstattet wird, richtet sich nach den Stornobedingungen des
              jeweiligen Studios. Streitigkeiten hierüber sind zwischen Studio und Kunde zu klären.
            </p>
          </Section>

          <Section number={7} title="Pflichten der Studios">
            <p>Studios verpflichten sich insbesondere,</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>ihre eigenen Pflichtangaben (Impressum, Datenschutzhinweise, Stornobedingungen) vollständig zu hinterlegen,</li>
              <li>Kundendaten nur zur Abwicklung der eigenen Termine zu verwenden,</li>
              <li>keine rechtswidrigen, jugendgefährdenden oder rechteverletzenden Inhalte hochzuladen,</li>
              <li>bei hochgeladenen Bildern über die erforderlichen Rechte zu verfügen.</li>
            </ul>
            <p>
              Der Anbieter kann Konten bei erheblichen oder wiederholten Verstössen sperren. Eine Sperre wird
              protokolliert und dem betroffenen Konto mitgeteilt.
            </p>
          </Section>

          <Section number={8} title="Verfügbarkeit">
            <p>
              Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Software, schuldet jedoch keine
              ununterbrochene Erreichbarkeit. Wartungsarbeiten werden nach Möglichkeit angekündigt und in
              nachfragearme Zeiten gelegt.
            </p>
          </Section>

          <Section number={9} title="Haftung">
            <p>
              Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben,
              Körper und Gesundheit. Bei einfacher Fahrlässigkeit haftet er nur bei Verletzung einer wesentlichen
              Vertragspflicht und der Höhe nach begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
            </p>
            <p>
              Für die zwischen Studio und Kunde vereinbarten Leistungen haftet der Anbieter nicht, da er an diesen
              Verträgen nicht beteiligt ist.
            </p>
          </Section>

          <Section number={10} title="Beendigung und Löschung">
            <p>
              Ein Studio kann sein Konto jederzeit selbst löschen. Dabei werden die zugehörigen Buchungen, Termine,
              Angebote, Kundendaten und Team-Zugänge entfernt. Gesetzliche Aufbewahrungspflichten, insbesondere für
              Rechnungsdaten, bleiben davon unberührt.
            </p>
          </Section>

          <Section number={11} title="Änderungen dieser Bedingungen">
            <p>
              Änderungen werden mindestens <Placeholder label="Frist" /> vor Wirksamwerden in Textform angekündigt.
              Widerspricht ein Studio nicht innerhalb der genannten Frist, gelten die Änderungen als angenommen;
              auf diese Wirkung wird in der Ankündigung gesondert hingewiesen.
            </p>
          </Section>

          <Section number={12} title="Schlussbestimmungen">
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Ist das Studio Kaufmann, juristische Person des
              öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand{" "}
              <Placeholder label="Ort" />.
            </p>
            <p>
              Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </Section>
        </div>

        <div className="flex gap-6 mt-8 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/ueber-uns" className="hover:text-zinc-700 transition-colors">Über uns</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
