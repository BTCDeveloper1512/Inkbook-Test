import React from "react";
import SiteHeader from "../components/SiteHeader";
import { Link } from "react-router-dom";

/**
 * Beschreibt bewusst das, was die Software nachweislich tut — nicht das, was
 * eine Vorlage üblicherweise aufzählt. Konkret nachgesehen: Supabase (Postgres
 * + Auth + Storage, Projekt in eu-central-1/Frankfurt), Stripe für Abo und
 * Anzahlungen, zwei httpOnly-Session-Cookies, Zwei-Faktor per TOTP, Trennung
 * der Kundendaten pro Studio über Row-Level-Security.
 *
 * Kein Tracking, keine Analyse-Dienste, keine Werbenetzwerke — deshalb steht
 * hier auch nichts darüber. Kommt später etwas dazu, gehört es hier ergänzt.
 */

const Section = ({ title, children }) => (
  <div className="mb-9 last:mb-0">
    <h2 className="font-playfair text-lg font-semibold text-zinc-900 mb-3">{title}</h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">{children}</div>
  </div>
);

const Placeholder = ({ label }) => (
  <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded font-inter font-medium">
    [{label}]
  </span>
);

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-sm text-zinc-500 font-inter">
            Stand: <Placeholder label="Monat Jahr" />
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8">
          <Section title="Verantwortlich">
            <p>
              Verantwortlich für die Verarbeitung ist <Placeholder label="Firmenname" />,{" "}
              <Placeholder label="Anschrift" />. Kontakt siehe{" "}
              <Link to="/impressum" className="underline text-zinc-900">Impressum</Link>.
            </p>
            <p>
              Wichtig zur Einordnung: Für die Daten seiner eigenen Kundinnen und Kunden ist das jeweilige{" "}
              <span className="font-medium text-zinc-800">Studio verantwortlich</span>. Der Anbieter verarbeitet
              diese Daten in dessen Auftrag als Auftragsverarbeiter (Art. 28 DSGVO).
            </p>
          </Section>

          <Section title="Welche Daten verarbeitet werden">
            <p>
              <span className="font-medium text-zinc-800">Studio-Konten:</span> Name, E-Mail-Adresse, optional
              Telefonnummer, Rolle im Studio, Zeitpunkt der letzten Anmeldung sowie die Angaben zum Studio selbst
              (Name, Adresse, Öffnungszeiten, Beschreibung, Bilder).
            </p>
            <p>
              <span className="font-medium text-zinc-800">Kundenkonten:</span> Name, E-Mail-Adresse, optional
              Telefonnummer, die eigenen Anfragen und Termine, hochgeladene Referenzbilder, Nachrichten mit dem
              Studio sowie vom Studio hinterlegte Notizen.
            </p>
            <p>
              <span className="font-medium text-zinc-800">Zahlungen:</span> Betrag, Zeitpunkt, Status und die
              Vorgangs-Kennung von Stripe. Vollständige Kartendaten werden zu keinem Zeitpunkt an den Anbieter
              übermittelt oder von ihm gespeichert.
            </p>
          </Section>

          <Section title="Zwecke und Rechtsgrundlagen">
            <ul className="list-disc pl-5 space-y-1">
              <li>Bereitstellung der Software und Abwicklung von Terminen — Art. 6 Abs. 1 lit. b DSGVO</li>
              <li>Abrechnung des Abonnements — Art. 6 Abs. 1 lit. b DSGVO</li>
              <li>Sicherheit der Konten, insbesondere Zwei-Faktor-Authentifizierung — Art. 6 Abs. 1 lit. f DSGVO</li>
              <li>Gesetzliche Aufbewahrung von Rechnungsdaten — Art. 6 Abs. 1 lit. c DSGVO</li>
            </ul>
          </Section>

          <Section title="Trennung der Daten zwischen Studios">
            <p>
              Jedes Studio sieht ausschliesslich seine eigenen Kundinnen und Kunden. Die Trennung wird nicht allein
              durch die Anwendung hergestellt, sondern durch die Datenbank selbst erzwungen (Row-Level-Security in
              Postgres): eine Abfrage kann Daten eines fremden Studios technisch nicht zurückgeben.
            </p>
            <p>
              Wer bei mehreren Studios Kunde ist, hat dort jeweils einen eigenen, voneinander getrennten Datensatz —
              auch wenn die Anmeldung mit derselben E-Mail-Adresse erfolgt.
            </p>
          </Section>

          <Section title="Eingesetzte Dienstleister">
            <p>
              <span className="font-medium text-zinc-800">Supabase</span> — Datenbank, Anmeldung und Dateispeicher.
              Das Projekt liegt in der Region eu-central-1 (Frankfurt am Main). Es besteht ein Vertrag zur
              Auftragsverarbeitung.
            </p>
            <p>
              <span className="font-medium text-zinc-800">Stripe</span> — Abwicklung des Abonnements und der
              Anzahlungen. Die Zahlungsdaten werden unmittelbar bei Stripe eingegeben und verarbeitet.
            </p>
            <p>
              <span className="font-medium text-zinc-800">
                <Placeholder label="Hosting-Anbieter" />
              </span>{" "}
              — Betrieb der Anwendung.
            </p>
            <p>
              Soweit dabei Daten in Drittländer übermittelt werden, geschieht dies auf Grundlage der
              Standardvertragsklauseln der EU-Kommission.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Es werden ausschliesslich technisch notwendige Cookies gesetzt: zwei Sitzungs-Cookies, die die
              Anmeldung aufrechterhalten — getrennt für die Studio- und die Kundenseite, damit beide Anmeldungen im
              selben Browser nebeneinander bestehen können. Sie sind httpOnly, also für Skripte im Browser nicht
              lesbar.
            </p>
            <p>
              Es findet kein Tracking statt. Es werden keine Analyse- oder Werbedienste eingebunden und keine Profile
              gebildet. Die Entscheidung im Cookie-Hinweis wird lokal im Browser gespeichert und nicht an den Server
              übermittelt.
            </p>
          </Section>

          <Section title="Speicherdauer">
            <p>
              Daten werden gelöscht, sobald sie für die genannten Zwecke nicht mehr erforderlich sind. Löscht ein
              Studio sein Konto, werden die zugehörigen Buchungen, Termine, Angebote und Kundendaten entfernt.
              Rechnungsdaten werden für die Dauer der gesetzlichen Aufbewahrungsfristen (regelmässig zehn Jahre)
              vorgehalten.
            </p>
          </Section>

          <Section title="Deine Rechte">
            <p>
              Es bestehen die Rechte auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
              Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21
              DSGVO) sowie das Recht, sich bei einer Aufsichtsbehörde zu beschweren.
            </p>
            <p>
              Betrifft die Anfrage Daten, die bei einem Studio als Kunde entstanden sind, ist zuerst dieses Studio
              zuständig. Der Anbieter unterstützt dabei.
            </p>
            <p>
              Kontakt für Datenschutzanfragen: <Placeholder label="E-Mail-Adresse" />
            </p>
          </Section>

          <Section title="Datensicherheit">
            <p>
              Die Übertragung erfolgt verschlüsselt über HTTPS. Passwörter werden nur als Hash gespeichert. Für
              Studio-Konten ist die Zwei-Faktor-Authentifizierung verpflichtend. Eingriffe durch den
              Plattform-Support werden protokolliert.
            </p>
          </Section>
        </div>

        <div className="flex gap-6 mt-8 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/ueber-uns" className="hover:text-zinc-700 transition-colors">Über uns</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
