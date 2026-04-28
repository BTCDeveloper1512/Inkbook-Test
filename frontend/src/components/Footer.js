import React from "react";
import { Link } from "react-router-dom";
import { Mail, Globe, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                <span className="text-zinc-900 font-bold text-sm font-playfair">I</span>
              </div>
              <span className="text-lg font-playfair font-semibold">InkBook</span>
            </div>
            <p className="text-zinc-500 text-sm font-inter leading-relaxed">Die Premium-Plattform für Tattoo-Studios und ihre Kunden.</p>
          </div>

          {/* Link columns */}
          {[
            {
              title: "Kunden",
              links: [
                { to: "/search",    label: "Studios finden" },
                { to: "/dashboard", label: "Meine Buchungen" },
                { to: "/messages",  label: "Nachrichten" },
                { to: "/faq",       label: "FAQ & Hilfe" },
              ]
            },
            {
              title: "Studios",
              links: [
                { to: "/register",          label: "Studio registrieren" },
                { to: "/studio-dashboard",  label: "Studio Dashboard" },
              ]
            },
            {
              title: "Kontakt",
              links: []
            }
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 font-inter mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-zinc-400 hover:text-white font-inter transition-colors flex items-center gap-1 group"
                    >
                      {l.label}
                      <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
                {col.title === "Kontakt" && (
                  <>
                    <li className="flex items-center gap-2 text-sm text-zinc-400 font-inter">
                      <Mail size={12} strokeWidth={1.5} />hello@inkbook.de
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-400 font-inter">
                      <Globe size={12} strokeWidth={1.5} />www.inkbook.de
                    </li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600 font-inter">© 2026 InkBook. Alle Rechte vorbehalten.</p>
          <div className="flex gap-5">
            {[
              { label: "Datenschutz", to: "/datenschutz" },
              { label: "Impressum",   to: "/impressum" },
              { label: "AGB",         to: "/agb" },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-xs text-zinc-600 hover:text-zinc-400 font-inter transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
