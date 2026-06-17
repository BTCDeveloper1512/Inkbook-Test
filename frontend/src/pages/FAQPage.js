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
            Alles was du über StudioOS wissen musst.
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
      { q: "Wie buche ich einen Tattoo-Termin?", a: "Öffne die Profilseite eines Studios, wähle deine Tattoo-Größe (Mini bis XL) und optional eine Körperstelle. Danach siehst du verfügbare Tage im Kalender – wähle einen Slot und fülle das Buchungsformular aus. Das Studio bestätigt deinen Termin und du erhältst eine Bestätigungsmail." },
      { q: "Was bedeuten die Tattoo-Größen Mini, Small, Medium, Large und XL?", a: "Die Größen helfen dem Studio bei der Zeitplanung: Mini (Schriftzug, Symbol), Small (ca. 5 cm), Medium (ca. 10 cm), Large (z.B. Unterarm), XL (Rücken, Sleeve). Je nach Größe kann ein Tag unterschiedlich viele Buchungen aufnehmen." },
      { q: "Muss ich eine Anzahlung leisten?", a: "Das hängt vom Studio ab. Viele Studios verlangen eine Anzahlung zur Absicherung des Termins. Falls eine Anzahlung fällig ist, erhältst du nach der Bestätigung einen Zahlungslink direkt im Dashboard. Die Buchung gilt erst als vollständig gesichert, wenn die Anzahlung bezahlt wurde." },
      { q: "Kann ich einen Termin absagen?", a: "Ja. Du kannst eine Buchung in deinem Dashboard unter 'Meine Termine' stornieren. Bitte beachte: Bereits geleistete Anzahlungen können je nach Stornierungsbedingungen des Studios einbehalten werden. Stornierungs­bedingungen werden vom jeweiligen Studio festgelegt." },
      { q: "Kann ich ein Studio direkt kontaktieren?", a: "Du kannst einem Studio erst dann eine Nachricht schreiben, wenn du einen bestätigten Termin bei ihnen hast. Die Nachrichtenfunktion steht dir dann im Dashboard unter 'Nachrichten' zur Verfügung." },
      { q: "Ist StudioOS für Kunden kostenlos?", a: "Ja, vollständig kostenlos. Suchen, Vergleichen, Buchen und Nachrichten senden ist für Kunden ohne jede Gebühr möglich." },
    ],
  },
  {
    category: "Für Studios & Artists",
    items: [
      { q: "Wie erstelle ich ein Studio-Profil?", a: "Registriere dich mit der Rolle 'Studio' und vervollständige dein Profil: Name, Adresse, Beschreibung, Banner-Bild und Tattoo-Stile. Je vollständiger das Profil, desto besser wirst du von Kunden gefunden." },
      { q: "Wie füge ich Artists zu meinem Studio hinzu?", a: "Gehe im Dashboard auf den Tab 'Artists' und klicke auf 'Artist hinzufügen'. Du kannst Name, Bio, Stile und Portfolio-Bilder hinterlegen. Jeder Artist erscheint dann mit eigenem Profil auf deiner Studio-Seite." },
      { q: "Wie funktioniert die Kapazitätsverwaltung im Kalender?", a: "Im Kalender kannst du pro Tag eine Punktzahl als Kapazität festlegen. Jede Buchungsgröße verbraucht eine bestimmte Anzahl Punkte (Mini = 1, XL = 8). Ist die Kapazität ausgeschöpft, erscheint der Tag als nicht buchbar. Der Standard sind 8 Punkte pro Tag." },
      { q: "Wie bestätige oder lehne ich eine Buchungsanfrage ab?", a: "Neue Anfragen erscheinen im Dashboard als 'Ausstehend'. Klicke auf die Buchung und wähle 'Bestätigen' oder 'Stornieren'. Der Kunde wird automatisch per E-Mail benachrichtigt." },
      { q: "Kann ich eine Anzahlung von Kunden verlangen?", a: "Ja. Bei jeder Buchung kannst du einen Anzahlungsbetrag festlegen. Der Kunde bezahlt sicher über Stripe direkt im Dashboard – du siehst den Status in Echtzeit." },
      { q: "Wie kommuniziere ich mit Kunden?", a: "Über die integrierte Nachrichtenfunktion kannst du direkt mit Kunden chatten. Neue Nachrichten werden in der Navigation angezeigt. Alle Konversationen findest du unter 'Nachrichten'." },
      { q: "Was kostet StudioOS für Studios?", a: "Die aktuellen Preise findest du auf unserer Preisseite. Für Fragen zum Abonnement kannst du uns jederzeit über den Support kontaktieren." },
    ],
  },
];
