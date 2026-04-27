import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "inkbook_cookie_consent";
const CONSENT_VERSION = 1;

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(analytics, marketing) {
  const consent = {
    necessary: true,
    analytics,
    marketing,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-zinc-900" : "bg-zinc-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    data-testid="cookie-toggle"
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Delay to avoid flash on page load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow external reopening via event
  useEffect(() => {
    const handler = () => {
      const stored = getStoredConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener("inkbook:open-cookie-settings", handler);
    return () => window.removeEventListener("inkbook:open-cookie-settings", handler);
  }, []);

  const handleAcceptAll = () => {
    saveConsent(true, true);
    setVisible(false);
  };

  const handleDeclineAll = () => {
    saveConsent(false, false);
    setVisible(false);
  };

  const handleSaveSelection = () => {
    saveConsent(analytics, marketing);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
      data-testid="cookie-banner"
    >
      <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="font-playfair text-base font-semibold text-zinc-900">Cookie-Einstellungen</p>
            <p className="text-xs text-zinc-500 font-inter mt-1 leading-relaxed max-w-lg">
              Wir verwenden Cookies, um dir die beste Erfahrung zu bieten. Notwendige Cookies sind immer aktiv.
              Mehr in unserer{" "}
              <Link to="/datenschutz" className="underline hover:text-zinc-800 transition-colors" onClick={handleDeclineAll}>
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
          <button
            onClick={handleDeclineAll}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors ml-3 flex-shrink-0"
            data-testid="cookie-close-btn"
          >
            <X size={14} className="text-zinc-400" />
          </button>
        </div>

        {/* Details Toggle */}
        <div className="px-5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-inter transition-colors mb-3"
            data-testid="cookie-details-toggle"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Einstellungen anpassen
          </button>
        </div>

        {/* Category Details */}
        {showDetails && (
          <div className="px-5 pb-4 space-y-3 border-t border-zinc-50 pt-4">
            {/* Necessary */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-900 font-inter">Notwendig</p>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">
                  Session, Authentifizierung, Spracheinstellung. Immer aktiv.
                </p>
              </div>
              <Toggle checked={true} onChange={() => {}} disabled={true} />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-900 font-inter">Analyse</p>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">
                  Besucherstatistiken, Seitenaufruf-Analyse. Hilft uns, die Plattform zu verbessern.
                </p>
              </div>
              <Toggle checked={analytics} onChange={setAnalytics} />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-900 font-inter">Marketing</p>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">
                  Personalisierte Inhalte, Newsletter-Tracking. Nur mit deiner Zustimmung.
                </p>
              </div>
              <Toggle checked={marketing} onChange={setMarketing} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 p-5 pt-3 border-t border-zinc-50">
          <button
            onClick={handleDeclineAll}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-inter font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors"
            data-testid="cookie-decline-btn"
          >
            Alle ablehnen
          </button>
          {showDetails && (
            <button
              onClick={handleSaveSelection}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-inter font-medium text-zinc-700 border border-zinc-300 hover:bg-zinc-50 transition-colors"
              data-testid="cookie-save-selection-btn"
            >
              Auswahl speichern
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-inter font-bold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            data-testid="cookie-accept-all-btn"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call this from footer to reopen settings */
export function openCookieSettings() {
  window.dispatchEvent(new Event("inkbook:open-cookie-settings"));
}
