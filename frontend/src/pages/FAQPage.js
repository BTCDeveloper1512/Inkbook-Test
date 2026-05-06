import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden" data-testid="faq-item">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <span className="font-inter font-semibold text-zinc-900 text-sm pr-4">{q}</span>
        {open
          ? <ChevronUp size={18} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
          : <ChevronDown size={18} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />}
      </button>
      {open && (
        <div className="px-6 pb-4 border-t border-zinc-100">
          <p className="text-sm text-zinc-600 font-inter leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, [user]);

  const fetchFAQs = async () => {
    try {
      const role = user?.role || null;
      const params = role ? { role } : {};
      const res = await axios.get(`${API}/api/faq/public`, { params, withCredentials: true });
      const items = res.data || [];

      if (items.length === 0) {
        // Fallback static FAQs if none in DB
        setGroups(STATIC_FAQS);
        return;
      }

      // Group by category
      const grouped = {};
      items.forEach(item => {
        const cat = item.category || "Allgemein";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ q: item.question, a: item.answer });
      });
      setGroups(Object.entries(grouped).map(([category, items]) => ({ category, items })));
    } catch {
      setGroups(STATIC_FAQS);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user?.role === "studio_owner"
    ? "für Studios & Artists"
    : user?.role === "customer"
    ? "für Kunden"
    : "";

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-2">Hilfe & Support</p>
          <h1 className="text-4xl font-playfair font-semibold text-zinc-900 mb-3">
            Häufige Fragen
          </h1>
          {roleLabel && (
            <span className="inline-block text-xs font-inter bg-zinc-900 text-white px-3 py-1 rounded-full">
              Angepasst {roleLabel}
            </span>
          )}
          <p className="text-sm text-zinc-500 font-inter mt-3">
            Alles was du über InkBook wissen musst.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-zinc-400 font-inter py-12">Keine FAQs vorhanden.</p>
        ) : (
          <div className="space-y-8">
            {groups.map((group, i) => (
              <div key={i}>
                <h2 className="text-base font-inter font-semibold text-zinc-900 mb-3 tracking-tight">{group.category}</h2>
                <div className="space-y-2">
                  {group.items.map((item, j) => (
                    <FAQItem key={j} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center border-t border-zinc-200 pt-8">
          <p className="text-sm text-zinc-500 font-inter">
            Noch Fragen?{" "}
            <button
              onClick={() => {
                // Open support chat via custom event
                window.dispatchEvent(new CustomEvent("inkbook:open-support"));
              }}
              className="font-semibold text-zinc-900 underline underline-offset-2 hover:no-underline cursor-pointer"
            >
              Support kontaktieren
            </button>{" "}
            oder schreib uns an{" "}
            <a href="mailto:support@inkbook.de" className="font-semibold text-zinc-900 underline underline-offset-2">
              support@inkbook.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const STATIC_FAQS = [
  {
    category: "Für Kunden",
    items: [
      { q: "Wie buche ich einen Tattoo-Termin?", a: "Gehe auf 'Studios finden', wähle ein Studio aus, klicke auf den gewünschten Artist und wähle einen freien Slot im Kalender. Nach der Bestätigung erhältst du eine E-Mail mit allen Details." },
      { q: "Kann ich einen Termin absagen?", a: "Ja. Du kannst Buchungen jederzeit im Dashboard unter 'Meine Termine' stornieren. Bitte beachte die Stornierungsfrist des Studios – manche verlangen eine Absage mindestens 48 Stunden vorher." },
      { q: "Was passiert nach meiner Buchung?", a: "Das Studio erhält sofort eine Benachrichtigung und bestätigt deinen Termin. Du bekommst eine Bestätigungsemail. Den Status siehst du jederzeit im Dashboard." },
      { q: "Kann ich eine Videoberatung anfragen bevor ich buche?", a: "Ja! Viele Studios bieten kostenlose Videoberatungen an. Klicke auf 'Videoberatung' auf der Studio-Profilseite. So könnt ihr vorab über Motiv, Größe und Platzierung sprechen – ganz ohne Anreise." },
      { q: "Wie finde ich Artists für bestimmte Tattoo-Stile?", a: "Nutze die Filter auf der Suchseite: Du kannst nach Stil (z.B. Fineline, Realism, Traditional, Blackwork), Stadt und Studio filtern. Auf der Studio-Profilseite siehst du alle Artists mit ihren Portfolios." },
      { q: "Kann ich das Portfolio eines Artists einsehen?", a: "Ja! Klicke auf der Studio-Seite auf einen Artist. Es öffnet sich eine Detailansicht mit dem vollständigen Portfolio als interaktive Galerie – du kannst Bilder vergrößern und direkt buchen." },
      { q: "Wie kontaktiere ich ein Studio vor der Buchung?", a: "Jedes Studio hat eine Nachrichtenfunktion. Klicke auf der Studio-Profilseite auf 'Nachricht senden'. Alle Konversationen findest du unter 'Nachrichten' im Dashboard." },
      { q: "Wie erkenne ich verifizierte Studios?", a: "Verifizierte Studios tragen ein blaues Verified-Badge auf ihrer Profilkarte. Diese Studios wurden von InkBook geprüft und erfüllen unsere Qualitätsstandards." },
      { q: "Ist InkBook für Kunden kostenlos?", a: "Ja, vollständig kostenlos! Du kannst alle Funktionen nutzen – Suchen, Vergleichen, Buchen, Nachrichten senden und Videoberatungen – ohne jede Gebühr." },
      { q: "Bekomme ich Erinnerungen an meinen Termin?", a: "Ja. InkBook sendet automatische Erinnerungsmails vor deinem Termin. Alle kommenden Termine siehst du übersichtlich im Dashboard." },
      { q: "Wie ändere ich mein Passwort oder meine Kontodaten?", a: "Gehe im Dashboard auf dein Profil (oben rechts auf deinen Namen klicken). Dort kannst du Name, E-Mail und Passwort jederzeit aktualisieren." },
      { q: "Kann ich InkBook auf dem Handy nutzen?", a: "Ja, InkBook ist vollständig responsiv und für mobile Geräte optimiert. Du kannst direkt im Browser buchen – ohne App-Download. Eine native App ist in Planung." },
      { q: "In welchen Städten ist InkBook verfügbar?", a: "InkBook ist deutschlandweit verfügbar. Das Netzwerk wächst stetig – wenn dein Wunschstudio noch nicht dabei ist, empfiehl ihnen InkBook!" },
    ],
  },
  {
    category: "Für Studios & Artists",
    items: [
      { q: "Wie erstelle ich ein Studio-Profil?", a: "Registriere dich mit der Rolle 'Studio', bestätige deine E-Mail und vervollständige das Profil: Studio-Name, Adresse, Beschreibung, Banner-Bild und Stile. Je vollständiger das Profil, desto besser wirst du in der Suche gefunden." },
      { q: "Wie füge ich Artists zu meinem Studio hinzu?", a: "Gehe im Dashboard auf den Tab 'Artists' und klicke auf 'Artist hinzufügen'. Trage Name, Stile, Bio und Portfolio-Bilder ein. Jeder Artist bekommt eine eigene Profilkarte auf deiner Studio-Seite." },
      { q: "Welche Fotos sollte ich hochladen?", a: "Lade ein aussagekräftiges Banner-Bild (mind. 1200x400px) und mehrere Galerie-Bilder hoch. Für Artists: mindestens 3–5 Portfolio-Fotos. Hochwertige Bilder erhöhen deine Buchungsrate erheblich." },
      { q: "Was bedeutet das Verified-Badge und wie bekomme ich es?", a: "Das Badge zeigt Kunden, dass dein Studio von InkBook geprüft wurde. Kontaktiere den InkBook-Support mit deinen Studio-Dokumenten. Die Prüfung dauert in der Regel 2–3 Werktage." },
      { q: "Wie verwalte ich meinen Buchungskalender?", a: "Im Dashboard unter 'Kalender' siehst du alle Termine. Du kannst Slots freigeben, Buchungen bestätigen oder ablehnen und Auszeiten blockieren." },
      { q: "Wie bestätige oder lehne ich eine Buchungsanfrage ab?", a: "Neue Anfragen erscheinen als 'Ausstehend'. Klicke auf die Buchung und wähle 'Bestätigen' oder 'Ablehnen'. Der Kunde wird automatisch per E-Mail benachrichtigt." },
      { q: "Kann ich Öffnungszeiten und Sperrtage festlegen?", a: "Ja. Unter 'Einstellungen' trägst du deine Öffnungszeiten ein. Individuelle Sperrtage (z.B. Urlaub) können separat blockiert werden." },
      { q: "Wie kommuniziere ich mit Kunden?", a: "Über die integrierte Nachrichtenfunktion kannst du direkt mit Kunden chatten. Alle Konversationen findest du unter 'Nachrichten'. Neue Nachrichten werden sofort in der Navbar signalisiert." },
      { q: "Wie starte ich eine Videoberatung mit einem Kunden?", a: "Gehe zur Buchung im Dashboard und klicke auf 'Videoberatung starten'. Der Kunde kann direkt im Browser beitreten – keine App oder Installation nötig." },
      { q: "Werden Kunden automatisch an Termine erinnert?", a: "Ja. InkBook versendet automatische Erinnerungsmails – weniger No-Shows für dein Studio, ohne Aufwand deinerseits." },
      { q: "Was kostet InkBook für Studios?", a: "InkBook bietet ein monatliches Abonnement für Studios an. Die genauen Preise findest du auf der Preisseite oder direkt im Studio-Dashboard." },
      { q: "Wie kündige ich mein Abonnement?", a: "Du kannst das Abonnement jederzeit im Dashboard unter 'Einstellungen' kündigen. Die Kündigung gilt zum Ende der Abrechnungsperiode – du behältst den Zugang bis dahin." },
      { q: "Was tue ich, wenn ich mein Passwort vergessen habe?", a: "Klicke auf der Anmeldeseite auf 'Passwort vergessen'. Du erhältst sofort eine E-Mail mit einem Reset-Link. Der Link ist 24 Stunden gültig." },
    ],
  },
];
