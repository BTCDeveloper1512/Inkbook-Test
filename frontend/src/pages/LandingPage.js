import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, CalendarCheck, MessageCircle, Search,
  Shield, Zap, Star, CheckCircle, Users, BarChart2, Clock
} from "lucide-react";
import axios from "axios";
import SplashScreen from "../components/SplashScreen";
import { StudioOSMark } from "../components/StudioOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const F = { inter: "'Inter',sans-serif", play: "'Playfair Display',serif" };

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

/* ─── MacBook frame ─── */
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

function NotebookContent() {
  const studios = [
    { name: "Dark Ink Studio",  city: "Berlin",  rating: "4.9", style: "Fine Line · Realism",   active: true },
    { name: "Sacred Needles",   city: "Hamburg", rating: "4.8", style: "Traditional · Neo Trad", active: false },
    { name: "Noir Collective",  city: "Muenchen", rating: "4.7", style: "Blackwork · Dotwork",    active: false },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: "#fafafa", fontFamily: F.inter, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                <div style={{ fontSize: 8, fontWeight: 700, color: "#18181b" }}>&#9733; {s.rating}</div>
              </div>
              <div style={{ fontSize: 7, color: "#71717a", marginBottom: 4 }}>{s.city} &middot; {s.style}</div>
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

/* ─── Phone mockup ─── */
const CAL_DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const CAL_GRID = [
  [1,2,3,4,5,6,7],
  [8,9,10,11,12,13,14],
  [15,16,17,18,19,20,21],
  [22,23,24,25,26,27,28],
  [29,30,null,null,null,null,null],
];
const TODAY = 16;
const SELECTED = 22;
const DOT_MAP = {
  1:"#d4d4d8",2:"#d4d4d8",3:"#d4d4d8",4:"#d4d4d8",5:"#d4d4d8",
  6:"#d4d4d8",7:"#d4d4d8",8:"#d4d4d8",9:"#d4d4d8",10:"#d4d4d8",
  11:"#d4d4d8",12:"#d4d4d8",13:"#d4d4d8",14:"#d4d4d8",15:"#d4d4d8",16:"#d4d4d8",
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
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 52, height: 4, borderRadius: 3, background: "rgba(255,255,255,0.1)" }} />
      <div style={{ padding: "26px 12px 12px", height: "100%", display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" }}>
        <div>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 2 }}>Termin anfragen</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: F.play, letterSpacing: "-0.01em" }}>Dark Ink Studio</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Berlin &middot; Kein Account nötig</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "8px 7px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 6, color: "rgba(255,255,255,0.28)" }}>&#8249;</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em" }}>Juni 2026</div>
            <div style={{ fontSize: 6, color: "rgba(255,255,255,0.28)" }}>&#8250;</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 3 }}>
            {CAL_DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 5.5, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {CAL_GRID.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const isPast = day <= TODAY;
                const isSel = day === SELECTED;
                const dot = DOT_MAP[day];
                return (
                  <div key={di} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 1px", borderRadius: 5, background: isSel ? "white" : "transparent" }}>
                    <span style={{ fontSize: 7, fontWeight: isSel ? 700 : 500, color: isSel ? "#18181b" : isPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)", lineHeight: 1 }}>{day}</span>
                    {dot && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "#18181b" : dot, marginTop: 1 }} />}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 5, justifyContent: "center" }}>
            {[["#22c55e","Frei"],["#f59e0b","Begrenzt"],["#ef4444","Voll"]].map(([c,l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 5.5, color: "rgba(255,255,255,0.3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>Gewählter Termin</div>
          <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Montag, 22. Juni 2026</div>
        </div>
        <Link to="/search" style={{ marginTop: "auto", padding: "10px 0", background: "white", borderRadius: 10, textAlign: "center", textDecoration: "none", display: "block" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>Studio finden &#8594;</span>
        </Link>
      </div>
    </div>
  );
}

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
        {status === "success" ? <p className="text-sm font-inter text-zinc-500">&#10003; {msg}</p> : (
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

        {/* ══ SEITE 1 — HERO ══════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-screen flex flex-col justify-center pt-20 pb-16 px-6">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.038) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          <div className="max-w-6xl mx-auto relative w-full">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* Left copy */}
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
                  Finde kuratierte Tattoo-Studios, buche per Echtzeit-Kalender
                  und kommuniziere direkt im integrierten Chat — ohne Umwege.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}
                  className="flex flex-col sm:flex-row gap-3 mb-6">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.44 }}
                  className="flex items-center gap-4">
                  <p className="text-xs text-zinc-400 font-inter">Kostenlos &middot; Kein Account nötig zum Stöbern</p>
                </motion.div>
              </div>

              {/* Right: devices */}
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
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", bottom: -24, left: -52, zIndex: 10, filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.2))" }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] tracking-widest uppercase text-zinc-300 font-inter">Mehr entdecken</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-6 bg-gradient-to-b from-zinc-300 to-transparent"
            />
          </motion.div>
        </section>

        {/* ══ SEITE 2 — FEATURES + STUDIO + CTA ══════════════════ */}

        {/* Wie es funktioniert */}
        <section className="bg-zinc-50 border-t border-zinc-100 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeUp className="text-center mb-14">
              <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-3 font-inter">Wie es funktioniert</p>
              <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950">Drei Schritte.<br />Ein Termin.</h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Search,        step: "01", label: "Entdecken", title: "Finde dein Studio",    desc: "Durchsuche kuratierte Tattoo-Studios. Filter nach Stil, Preis und Bewertung — und finde deinen Wunschkünstler." },
                { icon: CalendarCheck, step: "02", label: "Buchen",    title: "Termin in Sekunden",   desc: "Sieh in Echtzeit welche Tage frei sind. Kein Telefonieren, kein Warten auf Antwort — einfach Datum wählen und anfragen." },
                { icon: MessageCircle, step: "03", label: "Chatten",   title: "Direkt kommunizieren", desc: "Schreib dem Studio, kläre Details, teile Referenzbilder — alles in einem integrierten Chat ohne App-Download." },
              ].map(({ icon: Icon, step, label, title, desc }, i) => (
                <FadeUp key={step} delay={i * 0.1}>
                  <div className="group p-8 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all bg-white h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon size={17} strokeWidth={1.5} color="white" />
                      </div>
                      <span className="text-[10px] tracking-widest uppercase text-zinc-400 font-inter">{step} &mdash; {label}</span>
                    </div>
                    <h3 className="font-playfair text-2xl text-zinc-950 mb-3 leading-snug">{title}</h3>
                    <p className="text-sm text-zinc-500 font-inter leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* Warum StudioOS — Kunden-Benefits */}
        <section className="py-24 px-6 border-t border-zinc-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <FadeUp>
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-4 font-inter">Für Kunden</p>
                <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
                  Dein Wunsch-Tattoo.<br />Ohne Stress.
                </h2>
                <p className="text-zinc-500 font-inter leading-relaxed mb-8">
                  Schluss mit wochenlangem Warten auf Instagram-DMs oder Telefonrunden. 
                  StudioOS bringt die gesamte Terminbuchung online — transparent, schnell und sicher.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Search,    text: "Studios nach Stil, Ort und Preis durchsuchen" },
                    { icon: Zap,       text: "Echtzeit-Verfügbarkeit — kein Hin-und-Her mehr" },
                    { icon: Shield,    text: "Sichere Anzahlung via Stripe — dein Geld ist geschützt" },
                    { icon: Star,      text: "Echte Bewertungen von echten Kunden" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={12} strokeWidth={2} className="text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-600 font-inter">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link to="/search"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all group font-inter">
                    Studios entdecken
                    <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </FadeUp>

              {/* Visual: Booking confirmation mockup */}
              <FadeUp delay={0.15}>
                <div className="relative">
                  <div className="bg-zinc-950 rounded-2xl p-6 space-y-4 font-inter">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <CheckCircle size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">StudioOS</p>
                        <p className="text-sm font-semibold text-white">Anfrage gesendet</p>
                      </div>
                    </div>
                    {[
                      { label: "Studio",   value: "Dark Ink Studio, Berlin" },
                      { label: "Datum",    value: "Montag, 22. Juni 2026" },
                      { label: "Groesse",  value: "Mittel · Fine Line" },
                      { label: "Anzahlung", value: "EUR 50 via Stripe gesichert" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/40 font-inter">{label}</span>
                        <span className="text-xs text-white/80 font-inter font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-xs text-emerald-300 font-inter">Das Studio meldet sich in Kuerze mit einem Angebot.</p>
                      </div>
                    </div>
                  </div>
                  {/* Decorative glow */}
                  <div className="absolute -inset-4 bg-zinc-950/5 rounded-3xl -z-10" />
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* Für Studios */}
        <section className="bg-zinc-950 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Studio Features Visual */}
              <FadeUp className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: CalendarCheck, title: "Buchungskalender", desc: "Verwalte alle Anfragen und Bestätigungen an einem Ort." },
                    { icon: Users,         title: "Kundenchat",       desc: "Direkte Kommunikation mit jedem Kunden im Chat." },
                    { icon: BarChart2,     title: "Uebersicht",       desc: "Einnahmen, Auslastung und Bewertungen auf einen Blick." },
                    { icon: Clock,         title: "Zeitersparnis",    desc: "Automatische Bestätigungen — du fokussierst dich aufs Tattoo." },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                        <Icon size={14} strokeWidth={1.5} className="text-white/70" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1 font-inter">{title}</p>
                      <p className="text-xs text-white/40 font-inter leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </FadeUp>

              {/* Studio Copy */}
              <FadeUp delay={0.1} className="order-1 lg:order-2">
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-500 mb-4 font-inter">Fur Studios</p>
                <h2 className="font-playfair text-4xl sm:text-5xl text-white leading-tight mb-6">
                  Mehr Kunden.<br />Weniger Aufwand.
                </h2>
                <p className="text-white/50 font-inter leading-relaxed mb-8">
                  Beende das Chaos aus DMs, WhatsApp-Gruppen und verpassten Anfragen. 
                  StudioOS gibt dir ein professionelles Buchungssystem — ohne technisches Know-how.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Eigenes Studio-Profil mit Kapazitätskalender",
                    "Buchungsanfragen direkt im Dashboard verwalten",
                    "Automatische Anzahlung via Stripe — kein Aufwand",
                    "Kunden-Chat und Termin-Erinnerungen inklusive",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle size={14} strokeWidth={2} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/60 font-inter">{item}</p>
                    </div>
                  ))}
                </div>
                <Link to="/register?role=studio"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-all group font-inter">
                  Kostenlos starten
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* Vertrauen & Qualität */}
        <section className="py-24 px-6 border-t border-zinc-100">
          <div className="max-w-6xl mx-auto">
            <FadeUp className="text-center mb-14">
              <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-3 font-inter">Unser Versprechen</p>
              <h2 className="font-playfair text-4xl text-zinc-950">Gebaut für Vertrauen.</h2>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield,    title: "Sichere Zahlungen",  desc: "Alle Transaktionen laufen über Stripe — denselben Anbieter der hinter Shopify und Amazon steht. Dein Geld ist jederzeit geschützt." },
                { icon: Star,      title: "Echte Bewertungen",  desc: "Nur Kunden die wirklich gebucht haben können bewerten. Keine gekauften Reviews — nur transparente, echte Erfahrungen." },
                { icon: Zap,       title: "Keine Wartezeiten",  desc: "Echtzeit-Verfügbarkeit bedeutet: du siehst sofort ob ein Studio frei ist. Buchung in unter zwei Minuten abschliessen." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.09}>
                  <div className="p-8 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all bg-white h-full text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-5">
                      <Icon size={20} strokeWidth={1.5} className="text-zinc-700" />
                    </div>
                    <h3 className="font-playfair text-xl text-zinc-950 mb-3">{title}</h3>
                    <p className="text-sm text-zinc-500 font-inter leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <FadeUp>
          <div className="mx-4 sm:mx-6 mb-20 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)" }}>
            <div className="max-w-4xl mx-auto px-8 py-16 text-center">
              <p className="text-[10px] tracking-[.28em] uppercase text-zinc-500 mb-4 font-inter">Jetzt loslegen</p>
              <h3 className="font-playfair text-3xl sm:text-4xl text-white leading-tight mb-4">
                Bereit für dein<br />nächstes Tattoo?
              </h3>
              <p className="text-white/50 font-inter text-sm mb-8 max-w-sm mx-auto">
                Entdecke Studios, vergleiche Preise und buche deinen Termin — kostenlos und ohne Konto.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/search"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-all group font-inter">
                  Studios entdecken
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link to="/register?role=studio"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-medium border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition-all font-inter">
                  Als Studio registrieren
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Footer */}
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
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">Die Tattoo-Buchungsplattform fur Deutschland.</p>
              </div>
              {[
                { heading: "Produkt",     links: [{ to: "/search", l: "Studios finden" }, { to: "/register", l: "Registrieren" }, { to: "/faq", l: "FAQ" }] },
                { heading: "Unternehmen", links: [{ to: "/ueber-uns", l: "Ueber uns" }, { to: "/faq", l: "Support" }] },
                { heading: "Rechtliches", links: [{ to: "/impressum", l: "Impressum" }, { to: "/datenschutz", l: "Datenschutz" }, { to: "/agb", l: "AGB" }] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-4 font-inter">{heading}</p>
                  <div className="flex flex-col gap-2.5">
                    {links.map(({ to, l }) => (
                      <Link key={l} to={to} className="text-xs text-zinc-500 hover:text-zinc-900 font-inter transition-colors">{l}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 font-inter">&copy; {new Date().getFullYear()} StudioOS. Alle Rechte vorbehalten.</p>
              <p className="text-xs text-zinc-300 font-inter">Gemacht mit Sorgfalt in Deutschland.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
