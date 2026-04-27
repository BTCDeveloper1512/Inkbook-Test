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
      { q: "Wie buche ich einen Tattoo-Termin?", a: "Gehe auf 'Studios finden', suche nach deinem Wunsch-Studio, wähle einen verfügbaren Slot aus und bestätige deine Buchung." },
      { q: "Ist InkBook kostenlos für Kunden?", a: "Ja! Die Nutzung von InkBook ist für Kunden vollständig kostenlos." },
      { q: "Kann ich einen Termin absagen?", a: "Du kannst Buchungen im Dashboard unter 'Meine Termine' stornieren. Bitte beachte die Stornierungsbedingungen des jeweiligen Studios." },
    ],
  },
  {
    category: "Für Studios & Artists",
    items: [
      { q: "Was kostet InkBook für Studios?", a: "InkBook bietet ein monatliches Abonnement an. Genaue Preise findest du im Studio-Dashboard." },
      { q: "Wie erstelle ich ein Studio-Profil?", a: "Registriere dich als Studio, vervollständige dein Profil mit Fotos, Stilen und Beschreibung und richte deinen Kalender ein." },
    ],
  },
];
