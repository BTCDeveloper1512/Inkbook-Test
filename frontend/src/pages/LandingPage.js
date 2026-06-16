import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CalendarCheck, MessageCircle, Search } from "lucide-react";
import axios from "axios";
import SplashScreen from "../components/SplashScreen";
import { StudioOSMark } from "../components/StudioOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const F = { inter: "'Inter',sans-serif", play: "'Playfair Display',serif" };

/* ─── Fade-up scroll helper ─── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
  );
}

/* ─── MacBook / Notebook frame ─── */
function NotebookFrame({ children, width = 500 }) {
  const sw = width;
  const sh = Math.round(sw * 0.63);
  return (
    <div style={{ width: sw, flexShrink: 0, position: "relative" }}>
      <div style={{
        width: sw, height: sh,
        borderRadius: "12px 12px 0 0",
        background: "linear-gradient(175deg,#2a2a2a 0%,#1a1a1a 100%)",
        padding: "14px 14px 10px",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.45), 0 32px 64px rgba(0,0,0,0.22)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "#333", border: "1px solid #444" }} />
        <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
          {children}
        </div>
      </div>
      <div style={{ height: 4, background: "linear-gradient(to bottom,#111,#222)", width: sw }} />
      <div style={{
        width: sw + 48, height: 20, marginLeft: -24,
        background: "linear-gradient(to bottom,#d4d4d4,#b8b8b8)",
        borderRadius: "0 0 10px 10px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 70, height: 4, borderRadius: "0 0 6px 6px", background: "#aaa" }} />
      </div>
    </div>
  );
}

/* ─── Notebook screen: studio search ─── */
function NotebookContent() {
  const studios = [
    { name: "Dark Ink Studio",  city: "Berlin",  rating: "4.9", style: "Fine Line · Realism",   active: true },
    { name: "Sacred Needles",   city: "Hamburg", rating: "4.8", style: "Traditional · Neo Trad", active: false },
    { name: "Noir Collective",  city: "München", rating: "4.7", style: "Blackwork · Dotwork",    active: false },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: "#fafafa", fontFamily: F.inter, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Nav */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #ececec", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 1.5, borderRadius: 1, background: "#fff" }} />)}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#18181b", fontFamily: F.play }}>StudioOS</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Studios","Entdecken","Login"].map(n => <span key={n} style={{ fontSize: 7.5, color: "#a1a1aa" }}>{n}</span>)}
        </div>
      </div>
      {/* Search bar */}
      <div style={{ padding: "8px 14px 0", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#f4f4f5", borderRadius: 8, padding: "5px 10px", marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #a1a1aa", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#e4e4e7" }} />
          <div style={{ padding: "2px 8px", borderRadius: 5, background: "#09090b", fontSize: 7, color: "#fff", fontWeight: 600 }}>Suchen</div>
        </div>
        <div style={{ display: "flex", gap: 5, paddingBottom: 8 }}>
          {["Alle Stile","Fine Line","Realism","Traditional"].map((t, i) => (
            <div key={i} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 7, fontWeight: 600, background: i===0 ? "#09090b" : "#f4f4f5", color: i===0 ? "#fff" : "#71717a", border: i===0 ? "none" : "1px solid #e4e4e7" }}>{t}</div>
          ))}
        </div>
      </div>
      {/* Studio cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {studios.map((s, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 10,
            border: s.active ? "1.5px solid #09090b" : "1px solid #ececec",
            boxShadow: s.active ? "0 0 0 3px rgba(9,9,11,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
            overflow: "hidden", display: "flex",
          }}>
            <div style={{ width: 56, background: `hsl(0,0%,${82+i*4}%)`, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>{s.name}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#18181b" }}>★ {s.rating}</div>
              </div>
              <div style={{ fontSize: 7, color: "#71717a", marginBottom: 4 }}>{s.city} · {s.style}</div>
              <div style={{ padding: "3px 8px", borderRadius: 5, background: s.active ? "#09090b" : "#f4f4f5", display: "inline-block" }}>
                <span style={{ fontSize: 7, fontWeight: 600, color: s.active ? "#fff" : "#71717a" }}>Termin buchen</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Phone mockup: capacity calendar ─── */
// June 2026: starts Monday. Dots: past=grey, green/amber/red for future.
const CAL_DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
// grid: null = empty pad, number = day
const CAL_GRID = [
  [1,2,3,4,5,6,7],
  [8,9,10,11,12,13,14],
  [15,16,17,18,19,20,21],
  [22,23,24,25,26,27,28],
  [29,30,null,null,null,null,null],
];
const TODAY = 16; // today is June 16
const SELECTED = 22;
const DOT_MAP = {
  // past: grey
  1:"#d4d4d8",2:"#d4d4d8",3:"#d4d4d8",4:"#d4d4d8",5:"#d4d4d8",
  6:"#d4d4d8",7:"#d4d4d8",8:"#d4d4d8",9:"#d4d4d8",10:"#d4d4d8",
  11:"#d4d4d8",12:"#d4d4d8",13:"#d4d4d8",14:"#d4d4d8",15:"#d4d4d8",16:"#d4d4d8",
  // future: availability dots
  17:"#22c55e", 18:"#22c55e", 19:"#f59e0b", 20:"#22c55e",
  21:"#22c55e", 22:"#f59e0b", 23:"#ef4444", 24:"#22c55e",
  25:"#ef4444", 26:"#f59e0b", 27:"#22c55e", 28:"#22c55e",
  29:"#22c55e", 30:"#f59e0b",
};

function PhoneMockup() {
  return (
    <div style={{
      width: 200, height: 390, borderRadius: 28, background: "#09090b",
      boxShadow: "0 32px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.1)",
      overflow: "hidden", position: "relative", flexShrink: 0, fontFamily: F.inter,
    }}>
      {/* notch */}
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 52, height: 4, borderRadius: 3, background: "rgba(255,255,255,0.1)" }} />
      <div style={{ padding: "26px 12px 12px", height: "100%", display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" }}>

        {/* Studio header */}
        <div>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 2 }}>Termin anfragen</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: F.play, letterSpacing: "-0.01em" }}>Dark Ink Studio</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Berlin · Kein Account nötig</div>
        </div>

        {/* Calendar block */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "8px 7px" }}>
          {/* Month header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 6, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", textTransform: "uppercase" }}>‹</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em" }}>Juni 2026</div>
            <div style={{ fontSize: 6, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", textTransform: "uppercase" }}>›</div>
          </div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 3 }}>
            {CAL_DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 5.5, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {/* Calendar rows */}
          {CAL_GRID.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const isPast = day <= TODAY;
                const isSel = day === SELECTED;
                const dot = DOT_MAP[day];
                return (
                  <div key={di} style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "3px 1px",
                    borderRadius: 5,
                    background: isSel ? "white" : "transparent",
                  }}>
                    <span style={{ fontSize: 7, fontWeight: isSel ? 700 : 500, color: isSel ? "#18181b" : isPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)", lineHeight: 1 }}>{day}</span>
                    {dot && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "#18181b" : dot, marginTop: 1 }} />}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div style={{ display: "flex", gap: 6, marginTop: 5, justifyContent: "center" }}>
            {[["#22c55e","Frei"],["#f59e0b","Begrenzt"],["#ef4444","Voll"]].map(([c,l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 5.5, color: "rgba(255,255,255,0.3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected date */}
        <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>Gewählter Termin</div>
          <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Montag, 22. Juni 2026</div>
        </div>

        {/* CTA */}
        <Link to="/search" style={{
          marginTop: "auto", padding: "10px 0", background: "white", borderRadius: 10,
          textAlign: "center", textDecoration: "none", display: "block",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>Studio finden →</span>
        </Link>
      </div>
    </div>
  );
}

/* ─── Features ─── */
const features = [
  { icon: Search,        label: "Entdecken", title: "Finde dein Studio",      desc: "Hunderte kuratierter Studios. Echte Bewertungen, klare Preise, Stile filtern." },
  { icon: CalendarCheck, label: "Buchen",    title: "Termin in Sekunden",     desc: "Echtzeit-Kapazitätskalender, kein Telefonieren. Ein Klick und der Termin ist deiner." },
  { icon: MessageCircle, label: "Chatten",   title: "Direkt kommunizieren",   desc: "Schreib dem Studio, teile Referenzbilder — alles an einem Ort." },
];

/* ─── Newsletter ─── */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const handle = async (e) => {
    e.preventDefault(); if (!email.trim()) return; setStatus("loading");
    try {
      const { data } = await axios.post(`${API}/newsletter/subscribe`, { email });
      setStatus(data.status === "already_subscribed" ? "already" : "success"); setMsg(data.message);
    } catch { setStatus("error"); setMsg("Fehler. Bitte versuche es erneut."); }
  };
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-1 font-inter">Newsletter</p>
        <p className="font-playfair text-lg text-zinc-900">Bleib auf dem Laufenden.</p>
      </div>
      <div className="w-full sm:w-auto sm:min-w-[300px]">
        {status === "success" ? <p className="text-sm font-inter text-zinc-500">✓ {msg}</p> : (
          <form onSubmit={handle} className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.de" required disabled={status === "loading"}
              className="flex-1 px-4 py-2.5 rounded-full text-sm font-inter bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors disabled:opacity-50" />
            <button type="submit" disabled={status === "loading"}
              className="px-5 py-2.5 rounded-full text-xs font-inter font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              {status === "loading" ? "..." : "Anmelden"}
            </button>
          </form>
        )}
        {(status === "error" || status === "already") && <p className="text-xs mt-2 font-inter text-zinc-400">{msg}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <SplashScreen />

      <div className="bg-white min-h-screen font-inter">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 pb-20 px-6">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.038) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          <div className="max-w-6xl mx-auto relative">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* Left: copy */}
              <div className="flex-1 max-w-lg">
                <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
                  className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5 font-inter">
                  Premium Tattoo Booking
                </motion.p>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="font-playfair text-5xl sm:text-6xl text-zinc-950 leading-[1.08] tracking-tight mb-6">
                  Dein Tattoo-<br />Termin. Einfach.
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.26 }}
                  className="text-base text-zinc-500 leading-relaxed mb-8 font-inter">
                  Finde kuratierte Studios, buche per Kapazitätskalender und
                  kommuniziere im integrierten Chat — alles ohne Umwege.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}
                  className="flex flex-col sm:flex-row gap-3 mb-5">
                  <Link to="/search"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all group font-inter">
                    Studio finden
                    <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link to="/register?role=studio"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-all font-inter">
                    Als Studio registrieren
                  </Link>
                </motion.div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.44 }}
                  className="text-xs text-zinc-400 font-inter">
                  Kostenlos · Kein Account nötig zum Stöbern
                </motion.p>
              </div>

              {/* Right: Notebook + Phone */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex items-end justify-center relative"
                style={{ flexShrink: 0 }}
              >
                <NotebookFrame width={460}>
                  <NotebookContent />
                </NotebookFrame>

                {/* Phone overlapping bottom-left */}
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    bottom: -24,
                    left: -52,
                    zIndex: 10,
                    filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.2))",
                  }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────── */}
        <FadeUp className="border-y border-zinc-100">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 divide-x divide-zinc-100">
            {[["500+","Studios"],["10k+","Buchungen"],["4.9 ★","Bewertung"]].map(([v, l]) => (
              <div key={l} className="flex flex-col items-center py-1">
                <span className="font-playfair text-2xl font-bold text-zinc-950">{v}</span>
                <span className="text-xs text-zinc-400 font-inter mt-0.5">{l}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* ── FEATURES ────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeUp className="text-center mb-12">
            <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-3 font-inter">Wie es funktioniert</p>
            <h2 className="font-playfair text-4xl text-zinc-950">Drei Schritte. Ein Termin.</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, label, title, desc }, i) => (
              <FadeUp key={label} delay={i * 0.09}>
                <div className="group p-7 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all bg-white h-full">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon size={17} strokeWidth={1.5} color="white" />
                  </div>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-inter mb-2">{`0${i+1} — ${label}`}</p>
                  <h3 className="font-playfair text-xl text-zinc-950 mb-3 leading-snug">{title}</h3>
                  <p className="text-sm text-zinc-500 font-inter leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── STUDIO CTA ──────────────────────────────── */}
        <FadeUp>
          <div className="mx-4 sm:mx-6 mb-20 rounded-2xl bg-zinc-950 overflow-hidden">
            <div className="max-w-6xl mx-auto px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-500 mb-2 font-inter">Für Studios</p>
                <h3 className="font-playfair text-2xl sm:text-3xl text-white leading-tight">
                  Verwalte dein Studio.<br />Gewinne mehr Kunden.
                </h3>
              </div>
              <Link to="/register?role=studio"
                className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-all group font-inter">
                Kostenlos starten
                <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* ── FOOTER ──────────────────────────────────── */}
        <footer className="border-t border-zinc-100 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="mb-10 pb-10 border-b border-zinc-100">
              <NewsletterSection />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StudioOSMark size={22} />
                  <span className="font-playfair font-semibold text-zinc-900">Studio<strong>OS</strong></span>
                </div>
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">Die Tattoo-Buchungsplattform für Deutschland.</p>
              </div>
              {[
                { heading: "Produkt",     links: [{ to: "/search", l: "Studios finden" }, { to: "/register", l: "Registrieren" }, { to: "/faq", l: "FAQ" }] },
                { heading: "Unternehmen", links: [{ to: "/ueber-uns", l: "Über uns" }, { to: "/faq", l: "Support" }] },
                { heading: "Rechtliches", links: [{ to: "/impressum", l: "Impressum" }, { to: "/datenschutz", l: "Datenschutz" }, { to: "/agb", l: "AGB" }] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-4 font-inter">{heading}</p>
                  <div className="flex flex-col gap-2.5">
                    {links.map(({ to, l }) => (
                      <Link key={to} to={to} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-inter">{l}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 font-inter">© 2026 StudioOS · Alle Rechte vorbehalten</p>
              <p className="text-xs text-zinc-300 font-inter">Made with love in Germany</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
