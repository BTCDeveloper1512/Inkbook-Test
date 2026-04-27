import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-4">{title}</h2>
    <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Rechtliches</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-sm text-zinc-500 font-inter">Gemäß DSGVO (EU) 2016/679 und BDSG</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8 space-y-0">
          <Section title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist InkBook (Anschrift folgt,
              siehe <Link to="/impressum" className="text-zinc-900 underline">Impressum</Link>).
            </p>
          </Section>

          <Section title="2. Erhobene Daten">
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name und E-Mail-Adresse bei der Registrierung</li>
              <li>Buchungsdaten (Termin, Studio, Artist)</li>
              <li>Kommunikationsdaten (Chat-Nachrichten mit Studios)</li>
              <li>Technische Daten (IP-Adresse, Browser, Geräteinformationen)</li>
              <li>Newsletter-Anmeldung (nur E-Mail, sofern freiwillig angegeben)</li>
            </ul>
          </Section>

          <Section title="3. Zweck der Datenverarbeitung">
            <ul className="list-disc pl-5 space-y-1">
              <li>Bereitstellung und Betrieb der InkBook-Plattform</li>
              <li>Abwicklung von Buchungen und Terminen</li>
              <li>Kommunikation zwischen Kunden und Studios</li>
              <li>Zahlungsabwicklung über Stripe (eigene Datenschutzrichtlinie)</li>
              <li>E-Mail-Benachrichtigungen via Resend</li>
              <li>Versand des Newsletters (nur mit ausdrücklicher Einwilligung)</li>
            </ul>
          </Section>

          <Section title="4. Rechtsgrundlage">
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung),
              Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).
            </p>
          </Section>

          <Section title="5. Datenweitergabe">
            <p>Ihre Daten werden nicht an Dritte verkauft. Eine Weitergabe erfolgt ausschließlich an:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stripe Inc. (Zahlungsabwicklung) – <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline">Datenschutz Stripe</a></li>
              <li>Resend Inc. (E-Mail-Versand) – <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Datenschutz Resend</a></li>
              <li>Anthropic / OpenAI (KI-Support, anonymisiert)</li>
            </ul>
          </Section>

          <Section title="6. Speicherdauer">
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke
              erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen (in der Regel max. 10 Jahre
              für Geschäftsdaten).
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              InkBook setzt technisch notwendige Cookies für die Grundfunktionalität (Session, Authentifizierung)
              sowie optionale Cookies für Analytics und Marketing ein. Detaillierte Einstellungen können
              jederzeit über den Cookie-Banner (unten auf der Seite) angepasst werden.
            </p>
          </Section>

          <Section title="8. Ihre Rechte">
            <ul className="list-disc pl-5 space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich an: <span className="text-zinc-900 font-medium">datenschutz@inkbook.de</span> (folgt noch)
            </p>
          </Section>

          <Section title="9. Beschwerderecht">
            <p>
              Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren,
              z. B. beim Bundesbeauftragten für den Datenschutz und die Informationsfreiheit (BfDI).
            </p>
          </Section>

          <div className="pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-inter">
              Stand: April 2026 · Diese Datenschutzerklärung wird bei Bedarf aktualisiert.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
