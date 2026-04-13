import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Instagram, Mail, Globe } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <span className="text-black font-bold text-sm font-playfair">I</span>
              </div>
              <span className="text-xl font-bold font-playfair">InkBook</span>
            </div>
            <p className="text-gray-400 text-sm font-outfit leading-relaxed">
              Die Plattform für Tattoo-Studios und -Artists. Buchung leicht gemacht.
            </p>
          </div>
          <div>
            <h4 className="font-playfair font-semibold mb-4 text-sm tracking-widest uppercase text-gray-300">Kunden</h4>
            <ul className="space-y-2">
              <li><Link to="/search" className="text-sm text-gray-400 hover:text-white font-outfit transition-colors">Studios finden</Link></li>
              <li><Link to="/ai-advisor" className="text-sm text-gray-400 hover:text-white font-outfit transition-colors">KI-Stilberater</Link></li>
              <li><Link to="/dashboard" className="text-sm text-gray-400 hover:text-white font-outfit transition-colors">Meine Buchungen</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-playfair font-semibold mb-4 text-sm tracking-widest uppercase text-gray-300">Studios</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-gray-400 hover:text-white font-outfit transition-colors">Studio registrieren</Link></li>
              <li><Link to="/studio-dashboard" className="text-sm text-gray-400 hover:text-white font-outfit transition-colors">Studio-Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-playfair font-semibold mb-4 text-sm tracking-widest uppercase text-gray-300">Kontakt</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400 font-outfit">
                <Mail size={14} /> hello@inkbook.de
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400 font-outfit">
                <Globe size={14} /> www.inkbook.de
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-gray-500 font-outfit">© 2025 InkBook. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-gray-500 font-outfit mt-2 md:mt-0">Datenschutz · Impressum · AGB</p>
        </div>
      </div>
    </footer>
  );
}
