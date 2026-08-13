import React from "react";
import SiteHeader from "../components/SiteHeader";
import { Link } from "react-router-dom";

/**
 * Statisch statt aus dem Backend geladen. Die Vorgängerseite holte die Fragen
 * über einen Endpoint des alten FastAPI-Produkts — der ist weg, und ein
 * eigener Redaktions-Endpoint für ein Dutzend Antworten wäre Aufwand ohne
 * Gegenwert: die Antworten ändern sich seltener als der Code, in dem sie
 * stehen.
 *
 * Die Antworten sind bewusst an dem ausgerichtet, was die Software wirklich
 * tut. Wo etwas noch nicht existiert, steht das hier auch so.
 */

const FAQ_GROUPS = [
  {
    title: "Für Studios",
    items: [
      {
        q: "Werde ich in einem Verzeichnis gelistet?",
        a: "Nein. StudioOS hat keine Suche, kein Ranking und keine Verlinkung zwischen Studios. Deine Seite ist ausschliesslich über den Link erreichbar, den du selbst verteilst — als QR-Code im Studio, im Bio-Link oder per Nachricht.",
      },
      {
        q: "Muss ich mein bisheriges System sofort ablösen?",
        a: "Nein. Viele starten mit den nächsten Anfragen und lassen den alten Kalender parallel weiterlaufen, bis alles Laufende dort erledigt ist.",
      },
      {
        q: "Was kostet es?",
        a: "Der kostenlose Tarif läuft ohne Zeitlimit und deckt einen Artist mit fünf Terminen im Monat ab. Starter (19,99 € monatlich) und Pro (49,99 € monatlich) erweitern Artists, Termine und Funktionen. Alles monatlich kündbar, ohne Mindestlaufzeit.",
      },
      {
        q: "Wie funktioniert ein Projekt mit mehreren Sitzungen?",
        a: "Du legst beim Angebot alle Sitzungen an, die du schon kennst — die stehen nach der Zusage gemeinsam im Kalender. Kommt später eine weitere dazu, bietest du sie über „Weitere Session anbieten\" nach. Alle Sitzungen, Bilder und Nachrichten bleiben am selben Projekt.",
      },
      {
        q: "Kann ich Anzahlungen verlangen?",
        a: "Ja. Du hinterlegst eine Anzahlung im Angebot; der Termin gilt erst als fest, wenn sie bezahlt ist. Die Zahlung läuft über Stripe, alternativ vermerkst du eine Barzahlung von Hand.",
      },
      {
        q: "Was passiert, wenn ich aufhören will?",
        a: "Du kannst dein Studio jederzeit selbst löschen — samt aller Buchungen, Termine und Kundendaten. Keine Kündigungsfrist, kein Anruf nötig.",
      },
    ],
  },
  {
    title: "Sicherheit und Daten",
    items: [
      {
        q: "Warum brauche ich zwingend Zwei-Faktor?",
        a: "In einem Studio-Konto liegen die Kontaktdaten und Termine aller deiner Kundinnen und Kunden. Ein Passwort allein reicht dafür nicht. Beim ersten Login richtest du eine Authenticator-App ein; danach genügt der sechsstellige Code.",
      },
      {
        q: "Mein Handy ist weg — komme ich noch rein?",
        a: "Ja. Der Support kann den zweiten Faktor zurücksetzen, danach richtest du ihn beim nächsten Login neu ein. Jeder solche Eingriff wird protokolliert.",
      },
      {
        q: "Wo liegen die Daten?",
        a: "Auf Servern in Frankfurt am Main. Die Kundendaten der Studios sind voneinander getrennt — nicht nur in der Anwendung, sondern von der Datenbank selbst erzwungen. Eine Abfrage kann Daten eines fremden Studios technisch nicht zurückgeben.",
      },
      {
        q: "Wird getrackt?",
        a: "Nein. Es sind keine Analyse- oder Werbedienste eingebunden, es werden keine Profile gebildet und keine Kundendaten weitergegeben. Gesetzt werden nur die beiden Sitzungs-Cookies, ohne die keine Anmeldung bestehen bleibt.",
      },
    ],
  },
  {
    title: "Für Kundinnen und Kunden",
    items: [
      {
        q: "Brauche ich eine App?",
        a: "Nein. Du öffnest den Link deines Studios im Browser, legst beim ersten Mal ein Konto an und siehst dort danach deine Termine, Angebote und Nachrichten.",
      },
      {
        q: "Ich bin bei zwei Studios Kunde — brauche ich zwei Konten?",
        a: "Du meldest dich mit derselben E-Mail-Adresse an, hast aber bei jedem Studio einen eigenen Datensatz. Die Studios sehen jeweils nur, was bei ihnen entstanden ist.",
      },
      {
        q: "Bekomme ich meine Anzahlung zurück, wenn ich absage?",
        a: "Das richtet sich nach den Stornobedingungen deines Studios — die stehen auf dessen Seite. StudioOS wickelt die Zahlung nur technisch ab; die Vereinbarung besteht zwischen dir und dem Studio.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Häufige Fragen</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-2">Bevor du loslegst</h1>
        </div>

        <div className="space-y-6">
          {FAQ_GROUPS.map((group) => (
            <div key={group.title} className="bg-white rounded-2xl border border-zinc-100 p-8">
              <h2 className="font-playfair text-xl font-semibold text-zinc-900 mb-5">{group.title}</h2>
              <div className="divide-y divide-zinc-100">
                {group.items.map(({ q, a }) => (
                  <details key={q} className="group py-4 first:pt-0 last:pb-0">
                    <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                      <span className="font-inter font-medium text-sm text-zinc-900">{q}</span>
                      <span className="text-zinc-300 text-lg leading-none transition-transform group-open:rotate-45 flex-shrink-0">
                        +
                      </span>
                    </summary>
                    <p className="text-sm font-inter text-zinc-600 leading-relaxed mt-3 pr-8">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 mt-8 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-inter text-zinc-600">Frage nicht dabei?</p>
          <a
            href="mailto:hallo@studioos.de?subject=Frage%20zu%20StudioOS"
            className="inline-flex items-center h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs transition-colors"
          >
            Schreib uns
          </a>
        </div>

        <div className="flex gap-6 mt-8 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  );
}
