import React from "react";
import SiteHeader from "../components/SiteHeader";
import { Link } from "react-router-dom";
import { Layers, Link2, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Die alte Fassung warb mit Bewertungen und einem Verzeichnis — beides gibt
 * es nicht und soll es nicht geben. Diese Seite erklärt stattdessen die zwei
 * Entscheidungen, die das Produkt von den üblichen Terminkalendern
 * unterscheiden: denken in Projekten statt in Einzelterminen, und kein
 * Discovery-Pfad.
 */

const Pillar = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 p-6">
    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
      <Icon size={17} className="text-zinc-600" strokeWidth={1.5} />
    </div>
    <h3 className="font-inter font-semibold text-sm text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-600 font-inter leading-relaxed">{children}</p>
  </div>
);

export default function UeberUnsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Über uns</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-4 leading-tight">
            Software für Studios, kein Marktplatz
          </h1>
          <p className="text-base text-zinc-600 font-inter leading-relaxed">
            StudioOS bündelt Anfragen, Angebote, Termine und Absprachen an einem Ort — damit abends nicht noch
            Nachrichten sortiert werden müssen, sondern Feierabend ist.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8 mb-8">
          <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-4">Warum es das gibt</h2>
          <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-4">
            <p>
              Ein Tattoo ist selten ein Termin. Es ist eine Idee, ein Kostenvoranschlag, ein Hin und Her über
              Motiv und Größe, eine Sitzung, dann noch eine — und irgendwo dazwischen zwanzig Nachrichten auf drei
              Kanälen. Die üblichen Buchungssysteme kennen davon nur den einen Termin und lassen den Rest im
              Posteingang liegen.
            </p>
            <p>
              StudioOS ist um das gebaut, was tatsächlich zusammengehört: das Projekt. Alle Sitzungen, alle
              Referenzbilder, alle Absprachen und alle Zahlungen hängen an einer Sache statt verstreut zu sein.
            </p>
            <p>
              Und weil geschätzte und tatsächliche Dauer beide erfasst werden, wird die Planung mit jeder Sitzung
              ein Stück genauer — statt dass die Erfahrung im Kopf einer einzelnen Person bleibt.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Pillar icon={Layers} title="Projekte statt Einzeltermine">
            Mehrere Sitzungen an einem Motiv bleiben zusammen — samt Verlauf, Referenzen und Zahlungen.
          </Pillar>
          <Pillar icon={Link2} title="Deine Kunden bleiben deine">
            Kein Verzeichnis, keine Suche, kein Ranking. Deine Seite ist nur über den Link erreichbar, den du selbst
            verteilst.
          </Pillar>
          <Pillar icon={ShieldCheck} title="Getrennt und in der EU">
            Server in Frankfurt. Kundendaten liegen pro Studio getrennt — erzwungen von der Datenbank, nicht bloß
            versprochen.
          </Pillar>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-8 mb-8">
          <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-4">Was wir bewusst nicht tun</h2>
          <div className="text-sm text-zinc-600 font-inter leading-relaxed space-y-3">
            <p>
              Viele Plattformen in diesem Feld verdienen daran, Kunden zwischen Studios zu verteilen. Das heißt: Wer
              dich gefunden hat, sieht daneben drei andere. Und wer aufhört zu zahlen, verschwindet aus der Suche.
            </p>
            <p className="font-medium text-zinc-800">
              Diesen Hebel gibt es hier nicht, weil es die Suche nicht gibt.
            </p>
            <p>
              Keine Bewertungen, kein Ranking, keine Verlinkung zwischen Studios, keine Weitergabe von Kundendaten.
              StudioOS ist Werkzeug, nicht Zwischenhändler — bezahlt wird für die Software, nicht für Sichtbarkeit.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 px-8 py-10 text-center">
          <h2 className="font-playfair text-2xl text-white mb-3">In ein paar Minuten eingerichtet</h2>
          <p className="text-sm font-inter text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
            Konto anlegen, Öffnungszeiten eintragen, Link teilen — die erste Anfrage kann noch heute reinkommen.
          </p>
          <Link
            to="/os/login"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-inter text-sm transition-colors"
          >
            Studio kostenlos anlegen
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex gap-6 mt-8 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
          <Link to="/faq" className="hover:text-zinc-700 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
