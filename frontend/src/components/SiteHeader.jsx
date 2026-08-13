import React from "react";
import { Link } from "react-router-dom";
import { StudioOSWordmark } from "./StudioOSLogo";

/**
 * Kopfzeile für die statischen Seiten (Impressum, Datenschutz, AGB, Über uns).
 *
 * Ersetzt die alte Navbar aus der Replit-Zeit: die hing am AuthContext des
 * alten Produkts und zeigte je nach Anmeldung Menüpunkte, die es hier nicht
 * mehr gibt. Diese Seiten sind öffentlich und brauchen keinen Anmeldestatus —
 * also nur Wortmarke zurück zur Startseite und ein Einstieg ins Dashboard.
 * Optik bewusst identisch zur Kopfzeile der Landing Page.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-zinc-50/85 backdrop-blur border-b border-zinc-200/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <StudioOSWordmark markSize={26} textSize="text-lg" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/os/login"
            className="text-sm font-inter text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors"
          >
            Anmelden
          </Link>
          <Link
            to="/os/login"
            className="text-sm font-inter text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl px-4 py-2 transition-colors whitespace-nowrap"
          >
            Studio anlegen
          </Link>
        </div>
      </div>
    </header>
  );
}
