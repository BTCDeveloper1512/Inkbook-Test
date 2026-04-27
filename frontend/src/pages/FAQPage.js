import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    category: "Für Kunden",
    items: [
      {
        q: "Wie buche ich einen Tattoo-Termin?",
        a: "Gehe auf 'Studios finden', suche nach deinem Wunsch-Studio oder -Stil, wähle einen verfügbaren Slot aus und bestätige deine Buchung. Du erhältst eine Bestätigungs-E-Mail.",
      },
      {
        q: "Ist InkBook kostenlos für Kunden?",
        a: "Ja! Die Nutzung von InkBook ist für Kunden vollständig kostenlos. Du kannst Buchungen vornehmen, mit Studios chatten und Bewertungen schreiben – ohne Gebühren.",
      },
      {
        q: "Kann ich einen Termin absagen oder verschieben?",
        a: "Du kannst Buchungen im Dashboard unter 'Meine Termine' stornieren. Verschiebungen sind direkt mit dem Studio im Chat zu vereinbaren. Bitte beachte die Stornierungsbedingungen des jeweiligen Studios.",
      },
      {
        q: "Wie funktioniert die Anzahlung?",
        a: "Manche Studios verlangen eine Anzahlung zur Terminbestätigung. Der Betrag und die Zahlungsdetails werden dir beim Buchungsvorgang angezeigt.",
      },
      {
        q: "Was ist der KI-Stilberater?",
        a: "Unser KI-Stilberater hilft dir, den passenden Tattoo-Stil und das richtige Studio für deine Idee zu finden. Beschreibe einfach deine Vorstellung und erhalte personalisierte Empfehlungen.",
      },
    ],
  },
  {
    category: "Für Studios & Artists",
    items: [
      {
        q: "Was kostet InkBook für Studios?",
        a: "InkBook bietet ein monatliches Abonnement für Studios an. Genaue Preise findest du im Bereich 'Abo & Preise' in deinem Studio-Dashboard. Eine kostenlose Testphase ist verfügbar.",
      },
      {
        q: "Wie erstelle ich ein Studio-Profil?",
        a: "Registriere dich als Studio, vervollständige dein Profil mit Fotos, Stilen und Beschreibung. Füge deine Artists hinzu und richte deinen Kalender ein – schon bist du buchbar.",
      },
      {
        q: "Wie verwalte ich meine Termine?",
        a: "Im Studio-Dashboard unter 'Kalender' siehst du alle kommenden und vergangenen Termine. Du kannst Buchungsanfragen annehmen, ablehnen und Slots verwalten.",
      },
      {
        q: "Wann erhalte ich meine Auszahlung?",
        a: "Auszahlungen werden über Stripe abgewickelt. Die genauen Konditionen hängen von deinem Abonnement-Modell ab. Das Payouts-Dashboard ist in Entwicklung.",
      },
      {
        q: "Kann ich mehrere Artists zu meinem Studio hinzufügen?",
        a: "Ja! Im Studio-Dashboard unter 'Artists' kannst du beliebig viele Artists mit Profilen, Portfolios, Stilen und Instagram-Links hinzufügen.",
      },
    ],
  },
  {
    category: "Technisches & Konto",
    items: [
      {
        q: "Ich habe mein Passwort vergessen – was tun?",
        a: "Eine Passwort-Zurücksetzen-Funktion ist in Entwicklung. Bis dahin wende dich an unseren Support (unten rechts auf der Seite oder über den Admin-Chat).",
      },
      {
        q: "Wie kann ich mein Konto löschen?",
        a: "Die Löschung deines Kontos kannst du über den Support beantragen. Alle deine Daten werden entsprechend der DSGVO gelöscht.",
      },
      {
        q: "Welche Browser werden unterstützt?",
        a: "InkBook funktioniert optimal in allen modernen Browsern (Chrome, Firefox, Safari, Edge). Für die beste Erfahrung empfehlen wir die aktuelle Browser-Version.",
      },
      {
        q: "Gibt es eine App?",
        a: "InkBook ist als Progressive Web App (PWA) verfügbar – du kannst es direkt von deinem Browser auf dem Home-Bildschirm speichern für eine App-ähnliche Erfahrung. Eine native App ist geplant.",
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
        data-testid="faq-item-toggle"
      >
        <span className="text-sm font-medium text-zinc-900 font-inter pr-4 group-hover:text-zinc-600 transition-colors">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
          : <ChevronDown size={16} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
        }
      </button>
      {open && (
        <div className="pb-4 text-sm text-zinc-500 font-inter leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-3">Hilfe</p>
          <h1 className="font-playfair text-4xl font-semibold text-zinc-900 mb-3">Häufige Fragen</h1>
          <p className="text-sm text-zinc-500 font-inter max-w-lg">
            Hier findest du Antworten auf die häufigsten Fragen. Findest du keine Lösung?
            Nutze unseren Support-Chat unten rechts oder schreib uns direkt.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((group) => (
            <div key={group.category} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-50">
                <h2 className="font-inter font-semibold text-xs tracking-widest uppercase text-zinc-400">{group.category}</h2>
              </div>
              <div className="px-6">
                {group.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-zinc-900 rounded-2xl p-8 text-center">
          <p className="font-inter text-sm text-zinc-400 mb-2">Keine Antwort gefunden?</p>
          <p className="font-playfair text-xl text-white mb-4">Unser Support hilft dir weiter.</p>
          <p className="text-xs text-zinc-500 font-inter">
            Klicke auf das Chat-Symbol unten rechts oder schreibe an{" "}
            <span className="text-zinc-300">support@inkbook.de</span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-400 font-inter">
          <Link to="/impressum" className="hover:text-zinc-700 transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-700 transition-colors">Datenschutz</Link>
          <Link to="/agb" className="hover:text-zinc-700 transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  );
}
