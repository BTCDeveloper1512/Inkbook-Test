import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CalendarCheck, MessageCircle, Search } from "lucide-react";
import axios from "axios";
import SplashScreen from "../components/SplashScreen";
import { StudioOSMark } from "../components/StudioOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const F = { inter: "'Inter',sans-serif", play: "'Playfair Display',serif" };

function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PhoneMockup() {
  return (
    <div style={{
      width: 220, height: 400, borderRadius: 32, background: "#09090b",
      boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
      overflow: "hidden", position: "relative", flexShrink: 0, fontFamily: F.inter,
    }}>
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)" }} />
      <div style={{ padding: "28px 14px 14px", height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 3 }}>Termin buchen</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white", fontFamily: F.play, letterSpacing: "-0.01em" }}>Dark Ink Studio</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["Mo","12"],["Di","13"],["Mi","14"],["Do","15"],["Fr","16"]].map(([d,n], i) => (
            <div key={i} style={{ flex: 1, padding: "5px 2px", borderRadius: 8, textAlign: "center", background: i===2 ? "white" : "rgba(255,255,255,0.05)", border: `1px solid ${i===2 ? "white" : "rgba(255,255,255,0.07)"}` }}>
              <div style={{ fontSize: 6, color: i===2 ? "#71717a" : "rgba(255,255,255,0.3)" }}>{d}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: i===2 ? "#18181b" : "rgba(255,255,255,0.7)", marginTop: 2 }}>{n}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Verfügbare Zeiten</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {[["10:00",false],["11:30",true],["13:00",false],["14:30",false],["16:00",false],["17:30",false]].map(([t, sel], i) => (
              <div key={i} style={{ padding: "7px 3px", borderRadius: 8, textAlign: "center", background: sel ? "white" : "rgba(255,255,255,0.04)", border: `1px solid ${sel ? "white" : "rgba(255,255,255,0.06)"}` }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: sel ? "#18181b" : "rgba(255,255,255,0.75)" }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 5, width: 55, background: "rgba(255,255,255,0.22)", borderRadius: 3 }} />
            <div style={{ height: 4, width: 35, background: "rgba(255,255,255,0.09)", borderRadius: 3, marginTop: 4 }} />
          </div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>★ 4.9</div>
        </div>
        <div style={{ marginTop: "auto", padding: "11px 0", background: "white", borderRadius: 11, textAlign: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#18181b" }}>Jetzt buchen →</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Search,
    label: "Entdecken",
    title: "Finde dein perfektes Studio",
    desc: "Hunderte kuratierter Studios. Echte Bewertungen, klare Preise, Stile filtern.",
  },
  {
    icon: CalendarCheck,
    label: "Buchen",
    title: "Termin in Sekunden",
    desc: "Echtzeit-Slots, kein Telefonieren. Ein Klick und der Termin ist deiner.",
  },
  {
    icon: MessageCircle,
    label: "Chatten",
    title: "Direkt kommunizieren",
    desc: "Schreib dem Studio, teile Referenzbilder – alles an einem Ort.",
  },
];

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const { data } = await axios.post(`${API}/newsletter/subscribe`, { email });
      if (data.status === "already_subscribed") { setStatus("already"); setMsg(data.message); }
      else { setStatus("success"); setMsg(data.message); }
    } catch {
      setStatus("error"); setMsg("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-400 mb-1 font-inter">Newsletter</p>
        <p className="font-playfair text-lg text-zinc-900">Bleib auf dem Laufenden.</p>
      </div>
      <div className="w-full sm:w-auto sm:min-w-[320px]">
        {status === "success" ? (
          <p className="text-sm font-inter text-zinc-500">✓ {msg}</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de" required disabled={status === "loading"}
              className="flex-1 px-4 py-2.5 rounded-full text-sm font-inter bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors disabled:opacity-50"
            />
            <button type="submit" disabled={status === "loading"}
              className="px-5 py-2.5 rounded-full text-xs font-inter font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              {status === "loading" ? "..." : "Anmelden"}
            </button>
          </form>
        )}
        {(status === "error" || status === "already") && (
          <p className="text-xs mt-2 font-inter text-zinc-400">{msg}</p>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <SplashScreen />

      <div className="bg-white min-h-screen font-inter">

        {/* ── HERO ─────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 pb-16 px-6">
          {/* Subtle grid bg */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          <div className="max-w-6xl mx-auto relative">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Text */}
              <div className="flex-1 max-w-xl">
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5 font-inter"
                >
                  Premium Tattoo Booking
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="font-playfair text-5xl sm:text-6xl text-zinc-950 leading-[1.08] tracking-tight mb-6"
                >
                  Dein Tattoo-<br />Termin. Einfach.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.28 }}
                  className="text-base text-zinc-500 leading-relaxed mb-8 font-inter"
                >
                  Finde kuratierte Studios in deiner Stadt, buche direkt und
                  kommuniziere im integrierten Chat — ohne Umwege.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.36 }}
                  className="flex flex-col sm:flex-row gap-3 mb-6"
                >
                  <Link to="/search"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all group"
                    style={{ fontFamily: F.inter }}>
                    Studio finden
                    <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link to="/register?role=studio"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-all"
                    style={{ fontFamily: F.inter }}>
                    Als Studio registrieren
                  </Link>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.46 }}
                  className="text-xs text-zinc-400 font-inter"
                >
                  Kostenlos · Kein Account nötig zum Stöbern
                </motion.p>
              </div>

              {/* Phone mockup */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex items-center justify-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────── */}
        <FadeUp delay={0} className="border-y border-zinc-100">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 divide-x divide-zinc-100">
            {[["500+","Studios"],["10k+","Buchungen"],["4.9 ★","Bewertung"]].map(([v, l]) => (
              <div key={l} className="flex flex-col items-center py-2">
                <span className="font-playfair text-2xl font-bold text-zinc-950">{v}</span>
                <span className="text-xs text-zinc-400 font-inter mt-0.5">{l}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* ── FEATURES ─────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeUp className="text-center mb-14">
            <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-3 font-inter">Wie es funktioniert</p>
            <h2 className="font-playfair text-4xl text-zinc-950">Drei Schritte. Ein Termin.</h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, label, title, desc }, i) => (
              <FadeUp key={label} delay={i * 0.1}>
                <div className="group p-7 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all bg-white">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon size={18} strokeWidth={1.5} color="white" />
                  </div>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-inter mb-2">{`0${i+1} — ${label}`}</p>
                  <h3 className="font-playfair text-xl text-zinc-950 mb-3 leading-snug">{title}</h3>
                  <p className="text-sm text-zinc-500 font-inter leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── STUDIO CTA BAND ──────────────────────── */}
        <FadeUp>
          <div className="mx-6 mb-20 rounded-2xl bg-zinc-950 overflow-hidden">
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

        {/* ── FOOTER ───────────────────────────────── */}
        <footer className="border-t border-zinc-100 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Newsletter */}
            <div className="mb-10 pb-10 border-b border-zinc-100">
              <NewsletterSection />
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StudioOSMark size={22} />
                  <span className="font-playfair font-semibold text-zinc-900">Studio<strong>OS</strong></span>
                </div>
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">
                  Die Tattoo-Buchungsplattform für Deutschland.
                </p>
              </div>

              {[
                { heading: "Produkt", links: [{ to: "/search", l: "Studios finden" }, { to: "/register", l: "Registrieren" }, { to: "/faq", l: "FAQ" }] },
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
