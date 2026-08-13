import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * Einwilligung rein lokal, ohne Backend.
 *
 * Der Vorgänger aus der Replit-Zeit schickte die Entscheidung an das alte
 * FastAPI-Backend. Das war nie nötig: die DSGVO verlangt, dass keine nicht
 * notwendigen Cookies *gesetzt* werden, bevor eingewilligt wurde — nicht,
 * dass die Einwilligung serverseitig liegt. localStorage ist dafür der
 * ehrlichere Ort, weil er zum Gerät gehört, auf dem entschieden wurde.
 *
 * StudioOS setzt derzeit ausschliesslich technisch notwendige Cookies (die
 * Session-Tokens für Studio und Kunde). Der Banner ist deshalb bewusst schlicht
 * gehalten: er informiert und holt eine Entscheidung ein, statt Kategorien
 * anzubieten, die es gar nicht gibt. Kommt später Analytik oder etwas
 * Ähnliches dazu, gehört hier eine echte Auswahl hin — dann wird STORAGE_KEY
 * hochgezählt, damit alle erneut gefragt werden.
 */
const STORAGE_KEY = "studioos.cookie-consent.v1";

/** Was gespeichert wurde — von aussen lesbar, falls später etwas davon abhängt. */
export function getCookieConsent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Privater Modus oder gesperrter Speicher: dann gibt es eben keine
    // gespeicherte Antwort und der Banner fragt erneut. Besser als ein Absturz.
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Erst nach dem Mount lesen, nicht im useState-Initialisierer: sonst
    // liefe der localStorage-Zugriff schon beim ersten Render und der Banner
    // würde bei gesperrtem Speicher den ganzen Seitenaufbau mitreissen.
    if (!getCookieConsent()) setVisible(true);
  }, []);

  function decide(accepted) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted, at: new Date().toISOString() })
      );
    } catch {
      // Speichern nicht möglich — der Banner verschwindet trotzdem für diese
      // Sitzung, statt bei jedem Klick wieder aufzutauchen.
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          role="dialog"
          aria-label="Cookie-Hinweis"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50"
        >
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_12px_32px_rgb(0,0,0,0.14)] p-5">
            <p className="font-inter font-semibold text-sm text-zinc-900 mb-1.5">Cookies</p>
            <p className="text-xs font-inter text-zinc-600 leading-relaxed">
              StudioOS nutzt ausschliesslich technisch notwendige Cookies, damit deine Anmeldung bestehen bleibt.
              Kein Tracking, keine Werbung, keine Weitergabe an Dritte. Näheres in der{" "}
              <Link to="/datenschutz" className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
                Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => decide(true)}
                className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs transition-colors"
              >
                Verstanden
              </button>
              <Link
                to="/datenschutz"
                onClick={() => decide(false)}
                className="h-10 px-4 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-600 font-inter text-xs flex items-center transition-colors"
              >
                Mehr erfahren
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
