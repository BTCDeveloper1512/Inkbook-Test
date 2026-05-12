import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, Globe, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import BlurText from "../components/BlurText/BlurText";

gsap.registerPlugin(ScrollTrigger);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-[11px] transition-colors"
      style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.26)" }}
      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.26)"}
    >
      {children}
    </Link>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error" | "already"
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pb-12">
      <div>
        <p className="text-[10px] tracking-widest uppercase mb-2" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>Newsletter</p>
        <p className="font-playfair text-xl text-white mb-1">Bleib auf dem Laufenden.</p>
        <p className="text-[12px]" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.32)" }}>
          Neue Studios, Angebote und Updates direkt in dein Postfach.
        </p>
      </div>
      <div className="w-full sm:w-auto sm:min-w-[340px]">
        {status === "success" ? (
          <p className="text-[12px] font-inter" style={{ color: "rgba(255,255,255,.6)" }}>
            ✓ {msg}
          </p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              disabled={status === "loading"}
              className="flex-1 px-4 py-2.5 rounded-full text-[13px] font-inter bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
              data-testid="newsletter-email-input"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2.5 rounded-full text-[12px] font-inter font-semibold bg-white text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50 whitespace-nowrap"
              data-testid="newsletter-submit-btn"
            >
              {status === "loading" ? "..." : "Anmelden"}
            </button>
          </form>
        )}
        {(status === "error" || status === "already") && (
          <p className="text-[11px] mt-2 font-inter" style={{ color: status === "error" ? "rgba(255,100,100,.8)" : "rgba(255,255,255,.4)" }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Custom UI Mockups (no screenshots needed)
══════════════════════════════════════════════════════ */
const F = { inter: "'Inter',sans-serif", play: "'Playfair Display',serif" };

/** Phone – Studio-Suche / Discovery */
function MockupSearch() {
  const studios = [
    { name: "Dark Ink Studio", city: "Berlin · Mitte", rating: "4.9", img: "#d4d4d8" },
    { name: "Sacred Needles",  city: "Berlin · Prenzlberg", rating: "4.8", img: "#e4e4e7" },
    { name: "Noir Collective", city: "Berlin · Kreuzberg",  rating: "4.7", img: "#cacaca" },
  ];
  return (
    <div style={{ flex: 1, background: "#fafafa", paddingTop: 28, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F.inter }}>
      <div style={{ padding: "0 12px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#18181b", marginBottom: 8 }}>Studios entdecken</div>
        <div style={{ background: "white", borderRadius: 10, padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, border: "1px solid #e4e4e7", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #a1a1aa" }} />
          <div style={{ height: 6, width: "55%", borderRadius: 3, background: "#e4e4e7" }} />
          <div style={{ marginLeft: "auto", height: 6, width: "18%", borderRadius: 3, background: "#f0f0f0" }} />
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
          {["Tattoo", "Fine Line", "Realism"].map((t, i) => (
            <div key={i} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 7, fontWeight: 600, background: i === 0 ? "#18181b" : "#f4f4f5", color: i === 0 ? "white" : "#71717a", border: i === 0 ? "none" : "1px solid #e4e4e7" }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {studios.map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ height: 56, background: `linear-gradient(135deg, ${s.img}, #f8f8f8)`, position: "relative" }}>
              <div style={{ position: "absolute", bottom: 5, right: 7, background: "white", borderRadius: 6, padding: "2px 6px", fontSize: 7, fontWeight: 700, color: "#18181b" }}>★ {s.rating}</div>
            </div>
            <div style={{ padding: "6px 8px" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#18181b", marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 7, color: "#71717a" }}>{s.city}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Phone – Buchungs-Flow (dark) */
function MockupBooking() {
  return (
    <div style={{ flex: 1, background: "#09090b", paddingTop: 28, display: "flex", flexDirection: "column", padding: "28px 12px 12px", gap: 11, fontFamily: F.inter }}>
      <div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>Termin buchen</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: F.play, letterSpacing: "-0.01em" }}>Dark Ink Studio</div>
      </div>
      {/* Wochentage */}
      <div style={{ display: "flex", gap: 4 }}>
        {[["Mo","12"],["Di","13"],["Mi","14"],["Do","15"],["Fr","16"]].map(([d,n], i) => (
          <div key={i} style={{ flex: 1, padding: "5px 2px", borderRadius: 8, textAlign: "center", background: i === 2 ? "white" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 2 ? "white" : "rgba(255,255,255,0.07)"}` }}>
            <div style={{ fontSize: 6, color: i === 2 ? "#71717a" : "rgba(255,255,255,0.3)" }}>{d}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: i === 2 ? "#18181b" : "rgba(255,255,255,0.7)", marginTop: 2 }}>{n}</div>
          </div>
        ))}
      </div>
      {/* Slots */}
      <div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Verfügbare Zeiten</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
          {[["10:00",true],["11:30",false],["13:00",false],["14:30",false],["16:00",true],["17:30",false]].map(([t, booked], i) => (
            <div key={i} style={{ padding: "7px 3px", borderRadius: 8, textAlign: "center", background: i === 1 ? "white" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 1 ? "white" : "rgba(255,255,255,0.06)"}`, opacity: booked ? 0.25 : 1 }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: i === 1 ? "#18181b" : "rgba(255,255,255,0.75)" }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Artist card */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 5, width: 55, background: "rgba(255,255,255,0.22)", borderRadius: 3 }} />
          <div style={{ height: 4, width: 35, background: "rgba(255,255,255,0.09)", borderRadius: 3, marginTop: 4 }} />
        </div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>★ 4.9</div>
      </div>
      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "11px 0", background: "white", borderRadius: 11, textAlign: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#18181b", fontFamily: F.inter }}>Jetzt buchen →</span>
      </div>
    </div>
  );
}

/** Phone – Chat */
function MockupChat() {
  return (
    <div style={{ flex: 1, background: "white", paddingTop: 24, display: "flex", flexDirection: "column", fontFamily: F.inter }}>
      <div style={{ padding: "0 10px 10px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#18181b", flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "2px solid white" }} />
        </div>
        <div>
          <div style={{ height: 5, width: 52, background: "#18181b", borderRadius: 3 }} />
          <div style={{ height: 4, width: 28, background: "#e4e4e7", borderRadius: 3, marginTop: 3 }} />
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 9, overflow: "hidden" }}>
        {/* Incoming */}
        <div style={{ alignSelf: "flex-start", maxWidth: "72%" }}>
          <div style={{ background: "#f4f4f5", borderRadius: "11px 11px 11px 3px", padding: "7px 9px" }}>
            <div style={{ height: 5, width: 72, background: "#d4d4d8", borderRadius: 3, marginBottom: 3 }} />
            <div style={{ height: 5, width: 50, background: "#d4d4d8", borderRadius: 3 }} />
          </div>
        </div>
        {/* Outgoing */}
        <div style={{ alignSelf: "flex-end", maxWidth: "72%" }}>
          <div style={{ background: "#18181b", borderRadius: "11px 11px 3px 11px", padding: "7px 9px" }}>
            <div style={{ height: 5, width: 58, background: "rgba(255,255,255,0.28)", borderRadius: 3, marginBottom: 3 }} />
            <div style={{ height: 5, width: 38, background: "rgba(255,255,255,0.14)", borderRadius: 3 }} />
          </div>
        </div>
        {/* Incoming */}
        <div style={{ alignSelf: "flex-start", maxWidth: "72%" }}>
          <div style={{ background: "#f4f4f5", borderRadius: "11px 11px 11px 3px", padding: "7px 9px" }}>
            <div style={{ height: 5, width: 62, background: "#d4d4d8", borderRadius: 3 }} />
          </div>
        </div>
        {/* Timestamp */}
        <div style={{ alignSelf: "center", fontSize: 7, color: "#a1a1aa" }}>Heute · 14:32</div>
        {/* Outgoing 2 */}
        <div style={{ alignSelf: "flex-end", maxWidth: "72%" }}>
          <div style={{ background: "#18181b", borderRadius: "11px 11px 3px 11px", padding: "7px 9px" }}>
            <div style={{ height: 5, width: 45, background: "rgba(255,255,255,0.28)", borderRadius: 3 }} />
          </div>
        </div>
      </div>
      {/* Input */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid #f4f4f5", display: "flex", gap: 5, alignItems: "center" }}>
        <div style={{ flex: 1, height: 24, borderRadius: 12, background: "#f4f4f5", border: "1px solid #e4e4e7" }} />
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#18181b", flexShrink: 0 }} />
      </div>
    </div>
  );
}

/** MacBook – Studio Dashboard */
function MockupDashboard() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#f5f5f5", display: "flex", fontFamily: F.inter, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 120, background: "#09090b", height: "100%", padding: "14px 9px", display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "white", fontFamily: F.play, marginBottom: 14, padding: "0 5px", letterSpacing: "-0.01em" }}>InkBook</div>
        {[["Übersicht", true],["Buchungen", false],["Nachrichten", false],["Kalender", false],["Einstellungen", false]].map(([item, active], i) => (
          <div key={i} style={{ padding: "6px 8px", borderRadius: 7, fontSize: 8.5, background: active ? "rgba(255,255,255,0.1)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.35)" }}>{item}</div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "14px 13px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ height: 7, width: 90, background: "#18181b", borderRadius: 3, marginBottom: 4 }} />
            <div style={{ height: 5, width: 130, background: "#d4d4d8", borderRadius: 3 }} />
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ height: 5, width: 60, background: "#e4e4e7", borderRadius: 3 }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#18181b" }} />
          </div>
        </div>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 7 }}>
          {[["12","Buchungen"],["4","Heute"],["8","Bestätigt"],["★ 4.9","Bewertung"]].map(([v,l], i) => (
            <div key={i} style={{ background: "white", borderRadius: 9, padding: "9px 8px", border: "1px solid #ececec" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b", marginBottom: 3 }}>{v}</div>
              <div style={{ fontSize: 7, color: "#a1a1aa" }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Revenue row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          {[["Tagesumsatz","€ 320",true],["Monatsumsatz","€ 2.840",false],["Gesamtumsatz","€ 11.200",false]].map(([l,v,dark], i) => (
            <div key={i} style={{ background: dark ? "#18181b" : "white", borderRadius: 9, padding: "8px 9px", border: dark ? "none" : "1px solid #ececec" }}>
              <div style={{ fontSize: 6.5, color: dark ? "rgba(255,255,255,0.4)" : "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "white" : "#18181b" }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Booking list */}
        <div style={{ background: "white", borderRadius: 10, border: "1px solid #ececec", overflow: "hidden", flex: 1 }}>
          <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 5, width: 80, background: "#18181b", borderRadius: 3 }} />
            <div style={{ height: 5, width: 40, background: "#e4e4e7", borderRadius: 3 }} />
          </div>
          {[["Lena M.","14:00"],["Max K.","15:30"],["Jana S.","17:00"]].map(([n,t], i) => (
            <div key={i} style={{ padding: "7px 10px", borderBottom: i < 2 ? "1px solid #f9f9f9" : "none", display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f4f4f5", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 5, width: 55, background: "#18181b", borderRadius: 3, marginBottom: 3 }} />
                <div style={{ height: 4, width: 38, background: "#e4e4e7", borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 8, color: "#71717a" }}>{t}</div>
              <div style={{ padding: "2px 7px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 7, color: "#16a34a" }}>Bestätigt</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** MacBook – InkBook Logo Showcase (dark) */
function MockupLogo() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#060606", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, position: "relative", overflow: "hidden" }}>
      {/* Radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Grid dots decoration */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      {/* Logo */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: "white", fontFamily: F.play, letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 10 }}>InkBook</div>
        <div style={{ width: 36, height: 1, background: "rgba(255,255,255,0.15)", margin: "0 auto 10px" }} />
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: F.inter }}>Premium Tattoo Booking</div>
      </div>
      {/* 3 feature pills */}
      <div style={{ display: "flex", gap: 8, marginTop: 24, position: "relative", zIndex: 1 }}>
        {["Studios finden", "Sofort buchen", "Direkt chatten"].map((t, i) => (
          <div key={i} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", fontSize: 8, color: "rgba(255,255,255,0.45)", fontFamily: F.inter }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

/** MacBook – Studio-Profil Ansicht (dark) */
function MockupStudioProfile() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#09090b", display: "flex", flexDirection: "column", fontFamily: F.inter, overflow: "hidden" }}>
      {/* Nav */}
      <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "white", fontFamily: F.play }}>InkBook</div>
        <div style={{ display: "flex", gap: 5 }}>
          {["Studios","Nachrichten","Account"].map((n,i) => <div key={i} style={{ fontSize: 7.5, color: "rgba(255,255,255,0.3)", padding: "3px 8px" }}>{n}</div>)}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Studio profile content */}
        <div style={{ flex: 1, padding: "14px" }}>
          {/* Hero image */}
          <div style={{ height: 80, borderRadius: 10, background: "linear-gradient(135deg,#1e1e1e,#2d2d2d)", marginBottom: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />
            <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#18181b", border: "2px solid rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ height: 6, width: 80, background: "white", borderRadius: 3, marginBottom: 3, opacity: 0.9 }} />
                <div style={{ height: 4, width: 50, background: "rgba(255,255,255,0.4)", borderRadius: 3 }} />
              </div>
            </div>
          </div>
          {/* Gallery row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[55,70,65,60].map((w,i) => (
              <div key={i} style={{ flex: 1, height: 55, borderRadius: 8, background: `hsl(0,0%,${14+i*3}%)`, border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
          {/* Info row */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 7, color: "rgba(255,255,255,0.5)" }}>★ 4.9 (128)</div>
            <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 7, color: "rgba(255,255,255,0.5)" }}>Berlin · Mitte</div>
            <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 7, color: "rgba(255,255,255,0.5)" }}>Tattoo · Fine Line</div>
          </div>
        </div>
        {/* Booking panel */}
        <div style={{ width: 130, background: "rgba(255,255,255,0.03)", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Termin buchen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {["10:00","11:30","13:00","15:00"].map((t,i) => (
              <div key={i} style={{ padding: "5px 3px", borderRadius: 7, textAlign: "center", background: i===1 ? "white" : "rgba(255,255,255,0.05)", border: `1px solid ${i===1 ? "white" : "rgba(255,255,255,0.06)"}` }}>
                <span style={{ fontSize: 7.5, fontWeight: 600, color: i===1 ? "#18181b" : "rgba(255,255,255,0.6)" }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", padding: "8px 0", background: "white", borderRadius: 8, textAlign: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#18181b" }}>Buchen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** MacBook – Chat Desktop */
function MockupChatDesktop() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#fafafa", display: "flex", fontFamily: F.inter, overflow: "hidden" }}>
      {/* Conversation list */}
      <div style={{ width: 130, background: "white", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", padding: "12px 0" }}>
        <div style={{ padding: "0 10px 10px", fontSize: 10, fontWeight: 700, color: "#18181b" }}>Nachrichten</div>
        {[["Dark Ink Studio","Bis bald!",true],["Sacred Needles","Termin bestätigt",""],["Noir Collective","Dankeschön",""]].map(([name,preview,online],i) => (
          <div key={i} style={{ padding: "8px 10px", background: i===0 ? "#f5f5f5" : "transparent", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: i===0 ? "#18181b" : "#e4e4e7", flexShrink: 0, position: "relative" }}>
              {i===0 && <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid white" }} />}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 8, fontWeight: i===0 ? 700 : 400, color: "#18181b", marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 7, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#18181b", position: "relative" }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid white" }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>Dark Ink Studio</div>
            <div style={{ fontSize: 7, color: "#22c55e" }}>Online</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[[false,"Hallo! Hier meldet sich Dark Ink Studio zu deiner Buchung."],[true,"Super, ich freue mich auf den Termin!"],[false,"Wir sehen uns am Mittwoch um 14:00 Uhr. Bis dann!"]].map(([out,msg],i) => (
            <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "65%" }}>
              <div style={{ background: out ? "#18181b" : "white", border: out ? "none" : "1px solid #f0f0f0", borderRadius: out ? "12px 12px 3px 12px" : "12px 12px 12px 3px", padding: "8px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 8, color: out ? "rgba(255,255,255,0.85)" : "#374151", lineHeight: 1.5 }}>{msg}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 7, alignItems: "center" }}>
          <div style={{ flex: 1, height: 28, borderRadius: 14, background: "white", border: "1px solid #e4e4e7" }} />
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#18181b" }} />
        </div>
      </div>
    </div>
  );
}


function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const dashboardPath = user?.role === "studio_owner" ? "/studio-dashboard"
    : user?.role === "admin" ? "/admin" : "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 55);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <nav
      data-testid="landing-nav"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 60,
        transition: "background 0.5s ease, border-color 0.5s ease, backdrop-filter 0.5s ease",
        background: scrolled ? "rgba(7,7,7,0.78)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }} data-testid="landing-nav-logo">
          <BlurText
            text="InkBook"
            animateBy="characters"
            direction="top"
            delay={55}
            stepDuration={0.30}
            className="font-playfair font-semibold select-none"
            style={{ fontSize: 20, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}
          />
        </Link>

        {/* Center links – Desktop only */}
        <div className="hidden md:flex" style={{ gap: 4 }}>
          {[
            { to: "/search", label: "Studios finden" },
          ].map(({ to, label }) => (
            <Link
              key={to} to={to}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13,
                fontFamily: "Inter, sans-serif",
                color: "rgba(255,255,255,0.46)",
                textDecoration: "none",
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.88)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.46)"; e.currentTarget.style.background = "transparent"; }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: auth + language + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "de" ? "en" : "de")}
            className="hidden sm:flex items-center"
            style={{
              gap: 5, padding: "6px 12px", borderRadius: 20, border: "none",
              background: "transparent", cursor: "pointer",
              fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.78)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <Globe size={12} strokeWidth={1.5} style={{ color: "inherit" }} />
            {i18n.language.toUpperCase()}
          </button>

          {user ? (
            <Link to={dashboardPath} className="hidden sm:block"
              style={{
                padding: "8px 18px", borderRadius: 20, fontSize: 13,
                fontFamily: "Inter, sans-serif",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.88)",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block"
                style={{
                  padding: "8px 16px", fontSize: 13, fontFamily: "Inter, sans-serif",
                  color: "rgba(255,255,255,0.5)", textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.88)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                Anmelden
              </Link>
              <Link to="/register" className="hidden sm:block"
                style={{
                  padding: "8px 20px", borderRadius: 20, fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.88)",
                  textDecoration: "none",
                  backdropFilter: "blur(12px)",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
              >
                Registrieren
              </Link>
            </>
          )}

          {/* Hamburger – Mobile only */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.1)", transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            data-testid="landing-mobile-menu-btn"
            aria-label="Menü öffnen"
          >
            {mobileOpen
              ? <X size={17} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.88)" }} />
              : <Menu size={17} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.88)" }} />
            }
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    {mobileOpen && (
      <div
        data-testid="landing-mobile-menu"
        style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
          background: "rgba(7,7,7,0.97)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 20px 24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { to: "/search", label: "Studios finden" },
            ...(user
              ? [{ to: dashboardPath, label: "Dashboard" }]
              : [
                  { to: "/login",    label: "Anmelden" },
                  { to: "/register", label: "Kostenlos registrieren" },
                ]
            ),
          ].map(({ to, label }) => (
            <Link
              key={to} to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "13px 16px", borderRadius: 12, fontSize: 15,
                fontFamily: "Inter, sans-serif", fontWeight: 500,
                color: "rgba(255,255,255,0.82)", textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {label}
            </Link>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 4px" }} />
          <button
            onClick={() => { i18n.changeLanguage(i18n.language === "de" ? "en" : "de"); setMobileOpen(false); }}
            style={{
              padding: "10px 16px", borderRadius: 12, fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "Inter, sans-serif", fontWeight: 500,
              color: "rgba(255,255,255,0.38)", background: "none", border: "none", cursor: "pointer",
            }}
          >
            <Globe size={14} strokeWidth={1.5} style={{ color: "inherit" }} />
            {i18n.language === "de" ? "English" : "Deutsch"}
          </button>
        </div>
      </div>
    )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   iPhone Mockup  (src OR children)
══════════════════════════════════════════════════════ */
function Phone({ src, children, width = 220, className = "", style = {} }) {
  const h = Math.round(width * 2.165);
  const r = Math.round(width * 0.13);
  return (
    <div className={className} style={{
      width, height: h, borderRadius: r,
      background: "linear-gradient(160deg, #2a2a2a 0%, #111 60%, #0d0d0d 100%)",
      padding: "3px",
      boxShadow: "0 0 0 1px #1e1e1e, inset 0 0 0 1px rgba(255,255,255,.07), 0 60px 120px rgba(0,0,0,.65), 0 20px 40px rgba(0,0,0,.4)",
      position: "relative", flexShrink: 0, ...style,
    }}>
      {[
        { l: true,  top: "20%", h: "5.5%" },
        { l: true,  top: "27%", h: "7.5%" },
        { l: true,  top: "37%", h: "7.5%" },
        { l: false, top: "26%", h: "11%" },
      ].map((b, i) => (
        <div key={i} style={{
          position: "absolute", top: b.top, width: 3, height: b.h, borderRadius: 2,
          background: "#1a1a1a",
          left: b.l ? -3 : undefined, right: b.l ? undefined : -3,
        }} />
      ))}
      <div style={{
        width: "100%", height: "100%", borderRadius: r - 3,
        overflow: "hidden", background: "#0a0a0a", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: "28%", height: 11, background: "#000", borderRadius: 6, zIndex: 10,
        }} />
        {src
          ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>{children}</div>
        }
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 45%)",
          pointerEvents: "none", borderRadius: r - 3,
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MacBook Mockup  (src OR children)
══════════════════════════════════════════════════════ */
function MacBook({ src, children, width = 520, className = "", style = {} }) {
  const screenW   = Math.round(width * 0.84);
  const screenH   = Math.round(screenW / 1.6);
  const bezelT    = Math.round(width * 0.04);
  const bezelSide = Math.round(width * 0.022);
  const bezelB    = Math.round(width * 0.022);
  const frameR    = Math.round(width * 0.022);
  const lidW      = width;
  const lidH      = bezelT + screenH + bezelB;
  const baseW     = Math.round(width * 1.05);
  const baseH     = Math.round(width * 0.062);

  return (
    <div className={className} style={{ width: baseW, display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      <div style={{
        width: lidW, height: lidH,
        borderRadius: `${frameR}px ${frameR}px ${Math.round(frameR / 2)}px ${Math.round(frameR / 2)}px`,
        background: "linear-gradient(165deg, #3c3c3c 0%, #1e1e1e 55%, #181818 100%)",
        padding: `${bezelT}px ${bezelSide}px ${bezelB}px`,
        boxShadow: "0 40px 90px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.09)",
        position: "relative", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute",
          top: Math.round(bezelT * 0.42),
          left: "50%", transform: "translateX(-50%)",
          width: 6, height: 6, borderRadius: "50%",
          background: "#1c1c1c",
          boxShadow: "0 0 0 1.5px rgba(0,0,0,.6), inset 0 1px 2px rgba(0,0,0,.8)",
        }} />
        <div style={{
          width: "100%", height: "100%", borderRadius: 3,
          overflow: "hidden", background: "#050505", position: "relative",
        }}>
          {src
            ? <>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(140deg, rgba(255,255,255,.055) 0%, transparent 42%)", pointerEvents: "none" }} />
              </>
            : children
          }
        </div>
      </div>
      <div style={{
        width: lidW, height: 3,
        background: "linear-gradient(to right, #090909, #282828 15%, #323232 50%, #282828 85%, #090909)",
      }} />
      <div style={{
        width: baseW, height: baseH,
        borderRadius: `0 0 ${Math.round(width * 0.018)}px ${Math.round(width * 0.018)}px`,
        background: "linear-gradient(180deg, #2e2e2e 0%, #1e1e1e 55%, #161616 100%)",
        boxShadow: "0 18px 45px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        <div style={{
          width: Math.round(baseW * 0.19), height: Math.round(baseH * 0.52),
          borderRadius: 3, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
        }} />
        {[0.055, 0.945].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", bottom: 2, left: `${pos * 100}%`, transform: "translateX(-50%)",
            width: Math.round(baseW * 0.055), height: 2, borderRadius: 1, background: "rgba(0,0,0,.45)",
          }} />
        ))}
      </div>
      <div style={{
        width: Math.round(baseW * 0.72), height: 7, marginTop: 1, borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.07) 0%, transparent 70%)",
        filter: "blur(4px)",
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Smoke / Cloud layers
══════════════════════════════════════════════════════ */
function Smoke({ dark = true }) {
  const c = dark
    ? ["rgba(255,255,255,.05)", "rgba(255,255,255,.04)", "rgba(255,255,255,.035)", "rgba(200,200,200,.025)"]
    : ["rgba(0,0,0,.04)", "rgba(0,0,0,.03)", "rgba(0,0,0,.025)", "rgba(30,30,30,.02)"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes s1{0%,100%{transform:translate(0,0)scale(1)}40%{transform:translate(60px,-40px)scale(1.1)}70%{transform:translate(-40px,30px)scale(.96)}}
        @keyframes s2{0%,100%{transform:translate(0,0)scale(1.04)}35%{transform:translate(-70px,55px)scale(.9)}65%{transform:translate(50px,-50px)scale(1.07)}}
        @keyframes s3{0%,100%{transform:translate(0,0)scale(.96)}50%{transform:translate(40px,65px)scale(1.1)}}
        @keyframes s4{0%,100%{transform:translate(0,0)}30%{transform:translate(-45px,-28px)}70%{transform:translate(28px,45px)}}
        .sm1{animation:s1 22s ease-in-out infinite}
        .sm2{animation:s2 17s ease-in-out infinite .8s}
        .sm3{animation:s3 25s ease-in-out infinite 1.5s}
        .sm4{animation:s4 13s ease-in-out infinite 3s}
      `}</style>
      {[
        [700,700,-200,-150,c[0],80,"sm1"],
        [600,600,200,-200,c[1],90,"sm2"],
        [500,500,-100,"25%",c[2],70,"sm3"],
        [400,400,"40%","40%",c[3],60,"sm4"],
      ].map(([w,h,t,l,bg,bl,cl], i) => (
        <div key={i} className={cl} style={{
          position: "absolute", width: w, height: h, top: t, left: l,
          background: `radial-gradient(circle,${bg} 0%,transparent 65%)`,
          filter: `blur(${bl}px)`, borderRadius: "50%",
        }} />
      ))}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: dark ? .055 : .03 }} preserveAspectRatio="xMidYMid slice">
        <filter id={dark ? "sd" : "sl"}>
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.007" numOctaves="4" seed={dark ? 2 : 5} />
          <feColorMatrix type="matrix" values={dark
            ? "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0"
            : "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0"} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${dark ? "sd" : "sl"})`} />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Weather Transition
══════════════════════════════════════════════════════ */
function WeatherTransition({ fromDark = true }) {
  const stops = fromDark
    ? ["#090909","#131313","#2a2a2a","#4a4a4a","#888","#c0c0c0","#e8e8e8","#ffffff"]
    : ["#ffffff","#e8e8e8","#c0c0c0","#888","#4a4a4a","#2a2a2a","#131313","#090909"];
  return (
    <div style={{
      height: 320,
      background: `linear-gradient(to bottom, ${stops.join(",")})`,
      position: "relative", zIndex: 5, overflow: "hidden",
    }}>
      <Smoke dark={fromDark} />
      <div style={{
        position: "absolute", top: "30%", left: 0, right: 0, height: "40%",
        background: fromDark
          ? "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(255,255,255,.08) 0%, transparent 50%)"
          : "radial-gradient(ellipse at 35% 50%, rgba(0,0,0,.06) 0%, transparent 55%), radial-gradient(ellipse at 65% 45%, rgba(0,0,0,.04) 0%, transparent 50%)",
        filter: "blur(18px)", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const wrapRef    = useRef(null);
  const heroRef    = useRef(null);
  const titleRef   = useRef(null);
  const devicesRef = useRef(null);
  const tagRef     = useRef(null);
  const ctaHeroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Title chars tumble in ── */
      const chars = titleRef.current?.querySelectorAll(".ch");
      if (chars?.length) {
        gsap.set(chars, { transformPerspective: 500, transformOrigin: "50% 100% -20px" });
        gsap.from(chars, {
          rotateX: -90, y: 50, opacity: 0, duration: 1.2,
          stagger: 0.055, ease: "back.out(1.4)", delay: 0.2,
        });
      }

      /* ── MacBook rises into place ── */
      const macbook = devicesRef.current?.querySelector(".hero-macbook");
      if (macbook) {
        gsap.set(macbook, { rotateX: 6, transformPerspective: 1200 });
        gsap.from(macbook, { y: 110, scale: 0.86, opacity: 0, rotateX: 22, duration: 1.6, ease: "expo.out", delay: 0.28 });
      }

      /* ── iPhones spring in ── */
      const phones = [...(devicesRef.current?.querySelectorAll(".hero-phone") ?? [])];
      if (phones[0]) gsap.from(phones[0], { x: -430, rotateY: -62, opacity: 0, duration: 1.5, ease: "expo.out", delay: 0.45 });
      if (phones[1]) gsap.from(phones[1], { y: -460, scale: .55, opacity: 0, duration: 1.6, ease: "expo.out", delay: 0.62 });
      if (phones[2]) gsap.from(phones[2], { x: 430, rotateY: 62, opacity: 0, duration: 1.5, ease: "expo.out", delay: 0.52 });

      /* ── Hero text fade out ── */
      gsap.to([tagRef.current, ctaHeroRef.current], {
        opacity: 0, y: -40, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "8% top", end: "45% top", scrub: 1 },
      });
      gsap.from(tagRef.current,     { opacity: 0, y: 20, duration: 1,  ease: "power3.out",  delay: 1.25 });
      gsap.from(ctaHeroRef.current, { opacity: 0, y: 14, scale: .94, duration: .9, ease: "back.out(1.4)", delay: 1.55 });

      /* ── Feature sections: barrel-roll laptop + text reveal ── */
      wrapRef.current?.querySelectorAll(".feat-sec").forEach((sec, i) => {
        const device = sec.querySelector(".f-device");
        const lines  = sec.querySelectorAll(".f-line");
        const dir    = i % 2 === 0 ? 1 : -1;

        if (device) {
          gsap.fromTo(device,
            { x: dir * 220, rotateY: dir * 35, opacity: 0 },
            { x: 0, rotateY: dir * 4, opacity: 1,
              duration: 1.4, ease: "expo.out",
              scrollTrigger: { trigger: sec, start: "top 78%", toggleActions: "play none none reverse" },
            }
          );
          gsap.to(device, {
            rotateY: dir * -2,
            scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 1.4 },
          });
        }

        if (lines?.length) {
          gsap.fromTo(lines,
            { y: 50, opacity: 0, clipPath: "inset(0 0 100% 0)" },
            { y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)",
              stagger: .11, duration: .85, ease: "expo.out",
              scrollTrigger: { trigger: sec, start: "top 72%", toggleActions: "play none none reverse" },
            }
          );
        }
      });

      /* ── Stats bounce in ── */
      wrapRef.current?.querySelectorAll(".stat-i").forEach((el, i) => {
        gsap.fromTo(el,
          { y: 45, opacity: 0, scale: .8 },
          { y: 0, opacity: 1, scale: 1, duration: .8, ease: "back.out(1.7)", delay: i * .13,
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          }
        );
      });

    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const titleChars = "InkBook".split("").map((c, i) => (
    <span key={i} className="ch" style={{ display: "inline-block", willChange: "transform,opacity" }}>{c}</span>
  ));

  return (
    <div ref={wrapRef} style={{ background: "#090909", overflowX: "hidden" }}>
      <LandingNav />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-end pb-4 overflow-hidden"
        style={{ background: "#090909" }}>
        <Smoke dark />

        {/* Devices stage – hidden on mobile, visible sm+ */}
        <div ref={devicesRef}
          className="absolute inset-0 hidden sm:flex items-center justify-center"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 44%" }}>

          {/* MacBook – Dashboard */}
          <div className="hero-macbook absolute" style={{
            left: "50%", top: "50%", transform: "translateX(-50%)",
            marginTop: -190, transformStyle: "preserve-3d", zIndex: 1,
          }}>
            <MacBook width={520}><MockupDashboard /></MacBook>
          </div>

          {/* Phone 1 – left (Search) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% - 334px)", top: "50%", marginTop: -158,
            transformStyle: "preserve-3d", zIndex: 2,
          }}>
            <Phone width={152}><MockupSearch /></Phone>
          </div>

          {/* Phone 2 – center (Booking, tallest) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% + 18px)", top: "50%", marginTop: -206,
            transformStyle: "preserve-3d", zIndex: 3,
          }}>
            <Phone width={192}><MockupBooking /></Phone>
          </div>

          {/* Phone 3 – right (Chat) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% + 240px)", top: "50%", marginTop: -152,
            transformStyle: "preserve-3d", zIndex: 2,
          }}>
            <Phone width={152}><MockupChat /></Phone>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 text-center px-4 sm:px-6">
          <h1 ref={titleRef}
            className="font-playfair font-bold text-white leading-none tracking-tight mb-3"
            style={{ fontSize: "clamp(64px,11vw,124px)", transformPerspective: 800 }}>
            {titleChars}
          </h1>
          <p ref={tagRef}
            className="text-[11px] tracking-[.28em] uppercase mb-8"
            style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.32)" }}>
            Premium Tattoo Buchungsplattform
          </p>
          <div ref={ctaHeroRef}>
            <Link to="/search"
              className="inline-flex items-center gap-3 px-9 py-3.5 rounded-full text-[13px] font-medium transition-all duration-300 hover:gap-5 group"
              style={{
                fontFamily: "'Inter',sans-serif",
                background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.16)",
                color: "rgba(255,255,255,.88)", backdropFilter: "blur(14px)",
              }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom,transparent,#090909)" }} />
      </section>

      {/* ════════ DARK → LIGHT ════════ */}
      <WeatherTransition fromDark={true} />

      {/* ═══ FEATURE 1 – Search (White) ═══════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-4 sm:px-6 py-16 sm:py-24 lg:py-28 overflow-hidden bg-white">
        <Smoke dark={false} />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <div>
            <p className="f-line text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily: "'Inter',sans-serif" }}>01 — Discover</p>
            <div className="f-line w-10 h-[1px] bg-zinc-200 mb-7" />
            <h2 className="f-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Finde dein<br />perfektes Studio.
            </h2>
            <p className="f-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Hunderte kuratierter Studios. Echte Bewertungen. Klare Preise.
              Stile filtern, vergleichen und direkt buchen.
            </p>
            <Link to="/search"
              className="f-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900 border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Jetzt suchen
              <ArrowRight size={13} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="f-device hidden sm:flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook width={440} style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.16))" }}><MockupStudioProfile /></MacBook>
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK ════════ */}
      <WeatherTransition fromDark={false} />

      {/* ═══ FEATURE 2 – Booking (Dark) ═══════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-4 sm:px-6 py-16 sm:py-24 lg:py-28 overflow-hidden"
        style={{ background: "#0d0d0d" }}>
        <Smoke dark />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <div className="f-device order-2 lg:order-1 hidden sm:flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook width={440}><MockupLogo /></MacBook>
          </div>
          <div className="order-1 lg:order-2">
            <p className="f-line text-[10px] tracking-[.28em] uppercase mb-5"
              style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>02 — Book</p>
            <div className="f-line w-10 h-[1px] mb-7" style={{ background: "rgba(255,255,255,.1)" }} />
            <h2 className="f-line font-playfair text-4xl sm:text-5xl leading-tight mb-6"
              style={{ color: "rgba(255,255,255,.94)" }}>
              Buche direkt.<br />Ohne Wartezeit.
            </h2>
            <p className="f-line text-base leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.42)" }}>
              Verfügbare Slots in Echtzeit. Ein Klick, ein Termin.
              Kein Telefonieren, kein Warten auf Rückmeldung.
            </p>
            <Link to="/search"
              className="f-line inline-flex items-center gap-2 text-sm font-medium transition-colors group"
              style={{
                fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.65)",
                borderBottom: "1px solid rgba(255,255,255,.18)", paddingBottom: 2,
              }}>
              Termin buchen
              <ArrowRight size={13} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ DARK → LIGHT ════════ */}
      <WeatherTransition fromDark={true} />

      {/* ═══ FEATURE 3 – Chat (White) ══════════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-4 sm:px-6 py-16 sm:py-24 lg:py-28 overflow-hidden bg-white">
        <Smoke dark={false} />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <div>
            <p className="f-line text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily: "'Inter',sans-serif" }}>03 — Connect</p>
            <div className="f-line w-10 h-[1px] bg-zinc-200 mb-7" />
            <h2 className="f-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Kommuniziere.<br />Direkt im Chat.
            </h2>
            <p className="f-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Schreibe dem Studio direkt. Teile Referenzbilder, besprich
              Details – klar, schnell, ohne Umwege.
            </p>
            <Link to="/register"
              className="f-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900 border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Kostenlos starten
              <ArrowRight size={13} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="f-device hidden sm:flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook width={440} style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.16))" }}><MockupChatDesktop /></MacBook>
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK ════════ */}
      <WeatherTransition fromDark={false} />

      {/* ═══ CTA FINALE ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 sm:py-32 px-4 sm:px-6 overflow-hidden"
        style={{ background: "#050505" }}>
        <Smoke dark />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.035) 0%,transparent 58%)" }} />
        <div className="relative z-10 text-center max-w-3xl">
          <p className="stat-i text-[10px] tracking-[.3em] uppercase mb-8"
            style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.22)" }}>
            Zahlen die überzeugen
          </p>
          <h2 className="stat-i font-playfair text-4xl sm:text-6xl leading-tight mb-16"
            style={{ color: "rgba(255,255,255,.94)" }}>
            Tausende Buchungen.<br />Ein Ziel.
          </h2>
          <div className="grid grid-cols-3 gap-6 sm:gap-16 mb-14 sm:mb-20">
            {[["500+","Studios"],["10k+","Buchungen"],["4.9★","Bewertung"]].map(([v,l]) => (
              <div key={l} className="stat-i">
                <p className="font-playfair text-4xl sm:text-5xl font-bold" style={{ color: "rgba(255,255,255,.94)" }}>{v}</p>
                <p className="text-xs mt-2 tracking-wide" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="stat-i flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-[13px] font-medium hover:opacity-90 transition-all hover:gap-5 group"
              style={{ fontFamily: "'Inter',sans-serif", background: "#fff", color: "#111" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full text-[13px] font-medium transition-all"
              style={{ fontFamily: "'Inter',sans-serif", border: "1px solid rgba(255,255,255,.16)", color: "rgba(255,255,255,.6)" }}>
              Kostenlos registrieren
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,.05)" }} className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Newsletter */}
          <NewsletterSection />

          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12 pt-12 border-t border-white/[0.05]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <p className="font-playfair text-white font-semibold text-base">InkBook</p>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>
                Die Premium Tattoo-Buchungsplattform für Deutschland.
              </p>
            </div>

            {/* Produkt */}
            <div>
              <p className="text-[10px] tracking-widest uppercase mb-4" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>Produkt</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { to: "/search",   l: "Studios finden" },
                  { to: "/register", l: "Jetzt registrieren" },
                  { to: "/faq",      l: "FAQ" },
                ].map(({ to, l }) => (
                  <FooterLink key={to} to={to}>{l}</FooterLink>
                ))}
              </div>
            </div>

            {/* Unternehmen */}
            <div>
              <p className="text-[10px] tracking-widest uppercase mb-4" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>Unternehmen</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { to: "/ueber-uns",  l: "Über uns" },
                  { to: "/faq",        l: "Hilfe & Support" },
                ].map(({ to, l }) => (
                  <FooterLink key={to} to={to}>{l}</FooterLink>
                ))}
              </div>
            </div>

            {/* Rechtliches */}
            <div>
              <p className="text-[10px] tracking-widest uppercase mb-4" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}>Rechtliches</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { to: "/impressum",  l: "Impressum" },
                  { to: "/datenschutz",l: "Datenschutz" },
                  { to: "/agb",        l: "AGB" },
                ].map(({ to, l }) => (
                  <FooterLink key={to} to={to}>{l}</FooterLink>
                ))}
                <button
                  onClick={() => window.dispatchEvent(new Event("inkbook:open-cookie-settings"))}
                  className="text-[11px] text-left transition-colors"
                  style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.26)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.26)"}
                  data-testid="footer-cookie-settings-btn"
                >
                  Cookie-Einstellungen
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-white/[0.05]">
            <p className="text-[11px]" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.2)" }}>
              © 2026 InkBook · Alle Rechte vorbehalten
            </p>
            <p className="text-[11px]" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.14)" }}>
              Made with love in Germany
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
