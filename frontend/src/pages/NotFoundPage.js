import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StudioOSMark } from "../components/StudioOSLogo";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#f3f0e9] text-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <StudioOSMark size={42} />
        <p className="mt-10 text-xs tracking-[0.24em] uppercase text-zinc-500 font-inter">404 · Seite nicht gefunden</p>
        <h1 className="mt-4 text-5xl md:text-7xl font-playfair font-semibold tracking-tight">Hier ist gerade kein Studio.</h1>
        <p className="mt-6 text-zinc-600 font-inter leading-relaxed">Prüfe den Link deines Studios oder kehre zu StudioOS zurück.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-950 text-white px-6 py-3 text-sm font-inter">
          <ArrowLeft size={15} /> Zur Startseite
        </Link>
      </div>
    </main>
  );
}