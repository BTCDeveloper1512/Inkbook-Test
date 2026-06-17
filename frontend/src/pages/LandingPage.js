import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Search, CalendarCheck, MessageCircle,
  Shield, Zap, Star, CheckCircle, BarChart2, Clock,
  Send, MapPin, ChevronRight, Inbox
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
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Browser / MacBook frame wrapper
──────────────────────────────────────────────────────────── */
function BrowserFrame({ children, dark = false }) {
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: dark
        ? "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
        : "0 32px 72px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.06)",
      background: dark ? "#111113" : "#fff",
      fontFamily: F.inter,
    }}>
      {/* Chrome bar */}
      <div style={{
        height: 36,
        background: dark ? "#1c1c1e" : "#f4f4f5",
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e4e4e7"}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, height: 19, borderRadius: 5,
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, color: dark ? "rgba(255,255,255,0.25)" : "#a1a1aa", fontFamily: F.inter }}>
            app.studio-os.de
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 1 — Search / Discover
──────────────────────────────────────────────────────────── */
function SearchMockup() {
  const studios = [
    { name: "Dark Ink Studio", city: "Berlin", style: "Fine Line · Realism", rating: "4.9", reviews: 82, color: "#d4d4d8" },
    { name: "Sacred Needles",  city: "Hamburg", style: "Traditional · Neo Trad", rating: "4.8", reviews: 56, color: "#a1a1aa" },
    { name: "Noir Collective", city: "Muenchen", style: "Blackwork · Dotwork", rating: "4.7", reviews: 41, color: "#71717a" },
  ];
  return (
    <BrowserFrame>
      <div style={{ background: "#fafafa", minHeight: 380 }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f4f5", borderRadius: 10, padding: "6px 12px", marginBottom: 10 }}>
            <Search size={11} color="#a1a1aa" />
            <span style={{ fontSize: 10, color: "#71717a", flex: 1 }}>Tattoo Studio in Berlin suchen…</span>
            <div style={{ padding: "3px 10px", borderRadius: 6, background: "#09090b" }}>
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 600 }}>Suchen</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["Alle Stile", "Fine Line", "Realism", "Traditional", "Blackwork"].map((t, i) => (
              <div key={t} style={{
                padding: "3px 9px", borderRadius: 20, fontSize: 8, fontWeight: 600,
                background: i === 0 ? "#09090b" : "#f4f4f5",
                color: i === 0 ? "#fff" : "#71717a",
                border: i === 0 ? "none" : "1px solid #e4e4e7",
              }}>{t}</div>
            ))}
          </div>
        </div>
        {/* Results */}
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: "#a1a1aa" }}>3 Studios gefunden</span>
            <span style={{ fontSize: 9, color: "#09090b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={9} />Berlin
            </span>
          </div>
          {studios.map((s, i) => (
            <div key={s.name} style={{
              background: "#fff",
              borderRadius: 12,
              border: i === 0 ? "1.5px solid #09090b" : "1px solid #ececec",
              boxShadow: i === 0 ? "0 0 0 3px rgba(9,9,11,0.05)" : "0 1px 4px rgba(0,0,0,0.04)",
              display: "flex",
              overflow: "hidden",
            }}>
              <div style={{ width: 64, background: `linear-gradient(160deg, ${s.color}, #888)`, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: "9px 11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#18181b" }}>{s.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>&#9733; {s.rating}</span>
                </div>
                <div style={{ fontSize: 8, color: "#71717a", marginBottom: 5 }}>{s.city} &middot; {s.style}</div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <div style={{ padding: "3px 9px", borderRadius: 6, background: i === 0 ? "#09090b" : "#f4f4f5", display: "inline-block" }}>
                    <span style={{ fontSize: 7.5, fontWeight: 600, color: i === 0 ? "#fff" : "#71717a" }}>Termin buchen</span>
                  </div>
                  <span style={{ fontSize: 7.5, color: "#a1a1aa" }}>{s.reviews} Bewertungen</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 2 — Booking / Calendar
──────────────────────────────────────────────────────────── */
const CAL_DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const CAL_WEEKS = [[1,2,3,4,5,6,7],[8,9,10,11,12,13,14],[15,16,17,18,19,20,21],[22,23,24,25,26,27,28],[29,30,null,null,null,null,null]];
const DOT = {17:"#22c55e",18:"#22c55e",19:"#f59e0b",20:"#22c55e",21:"#22c55e",22:"#f59e0b",23:"#ef4444",24:"#22c55e",25:"#ef4444",26:"#f59e0b",27:"#22c55e",28:"#22c55e",29:"#22c55e",30:"#f59e0b"};
const SEL = 22;

function BookingMockup() {
  return (
    <BrowserFrame>
      <div style={{ background: "#fafafa", display: "flex", minHeight: 380 }}>
        {/* Left: studio header + calendar */}
        <div style={{ flex: 1.2, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#fff", padding: "12px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: F.play }}>D</span>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#18181b" }}>Dark Ink Studio</div>
                <div style={{ fontSize: 8, color: "#71717a" }}>Berlin &middot; Fine Line · Realism</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 8, fontWeight: 700, color: "#18181b" }}>&#9733; 4.9</div>
            </div>
          </div>
          <div style={{ padding: "10px 14px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 8, color: "#71717a" }}>&#8249;</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>Juni 2026</span>
              <span style={{ fontSize: 8, color: "#71717a" }}>&#8250;</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 3 }}>
              {CAL_DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 6.5, color: "#a1a1aa", fontWeight: 600 }}>{d}</div>)}
            </div>
            {CAL_WEEKS.map((wk, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1.5 }}>
                {wk.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const isPast = day <= 16;
                  const isSel = day === SEL;
                  return (
                    <div key={di} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 1px", borderRadius: 5, background: isSel ? "#09090b" : "transparent" }}>
                      <span style={{ fontSize: 8, fontWeight: isSel ? 700 : 400, color: isSel ? "#fff" : isPast ? "#d4d4d8" : "#18181b", lineHeight: 1 }}>{day}</span>
                      {DOT[day] && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "#fff" : DOT[day], marginTop: 1 }} />}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 7, justifyContent: "center" }}>
              {[["#22c55e","Frei"],["#f59e0b","Begrenzt"],["#ef4444","Voll"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 6.5, color: "#a1a1aa" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right: booking form */}
        <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#18181b" }}>Termin anfragen</div>
          <div style={{ padding: "7px 10px", background: "#f4f4f5", borderRadius: 8 }}>
            <div style={{ fontSize: 7, color: "#71717a", marginBottom: 1 }}>Gewaehlter Termin</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "#18181b" }}>Mo, 22. Juni 2026</div>
          </div>
          {[
            { label: "Motiv / Stil", placeholder: "Fine Line, Blume, Unterarm…" },
            { label: "Groesse", placeholder: "ca. 10x8 cm" },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: "#52525b", marginBottom: 3 }}>{label}</div>
              <div style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e4e4e7", background: "#fff" }}>
                <span style={{ fontSize: 8, color: "#a1a1aa" }}>{placeholder}</span>
              </div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: "#52525b", marginBottom: 3 }}>Anzahlung</div>
            <div style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e4e4e7", background: "#fff", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 8, color: "#18181b", fontWeight: 600 }}>EUR 50,00</span>
              <span style={{ fontSize: 7, color: "#22c55e", fontWeight: 600 }}>Stripe gesichert</span>
            </div>
          </div>
          <div style={{ marginTop: "auto", padding: "9px 0", background: "#09090b", borderRadius: 9, textAlign: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Anfrage absenden</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 3 — Messages / Chat
──────────────────────────────────────────────────────────── */
function ChatMockup() {
  const msgs = [
    { from: "studio", text: "Hallo! Dein Motiv klingt super, ich hatte mir das genauso vorgestellt." },
    { from: "me", text: "Perfekt! Kannst du mir noch sagen wie lang die Session ungefaehr dauert?" },
    { from: "studio", text: "Ca. 2,5 Stunden. Ich schicke dir gleich ein Angebot." },
  ];
  return (
    <BrowserFrame>
      <div style={{ display: "flex", minHeight: 380, background: "#fff" }}>
        {/* Sidebar */}
        <div style={{ width: 160, borderRight: "1px solid #f0f0f0", background: "#fafafa", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#18181b" }}>Nachrichten</span>
          </div>
          {[
            { name: "Dark Ink Studio", preview: "Ich schicke dir gleich…", time: "12:34", unread: true },
            { name: "Sacred Needles",  preview: "Termin bestaetigt!",     time: "Di",    unread: false },
          ].map((c, i) => (
            <div key={c.name} style={{
              padding: "8px 12px",
              background: i === 0 ? "#fff" : "transparent",
              borderBottom: "1px solid #f4f4f5",
              cursor: "default",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: i === 0 ? 700 : 500, color: "#18181b" }}>{c.name}</span>
                <span style={{ fontSize: 7.5, color: "#a1a1aa" }}>{c.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 8, color: "#71717a", flex: 1 }}>{c.preview}</span>
                {c.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />}
              </div>
            </div>
          ))}
        </div>
        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "9px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: F.play }}>D</span>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#18181b" }}>Dark Ink Studio</div>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 7, color: "#22c55e" }}>Online</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "70%", padding: "6px 9px", borderRadius: m.from === "me" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                  background: m.from === "me" ? "#09090b" : "#f4f4f5",
                  color: m.from === "me" ? "#fff" : "#18181b",
                  fontSize: 8, lineHeight: 1.5,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {/* Offer card */}
            <div style={{ border: "1.5px solid #09090b", borderRadius: 10, padding: "8px 10px", background: "#fafafa", marginTop: 4 }}>
              <div style={{ fontSize: 7.5, color: "#71717a", marginBottom: 3 }}>Angebot von Dark Ink Studio</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#18181b" }}>Montag, 22. Juni · 14:00 Uhr</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, padding: "4px 8px", borderRadius: 7, background: "#09090b", textAlign: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#fff" }}>Annehmen</span>
                </div>
                <div style={{ flex: 1, padding: "4px 8px", borderRadius: 7, border: "1px solid #e4e4e7", textAlign: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#71717a" }}>Ablehnen</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "8px 12px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 7, alignItems: "center" }}>
            <div style={{ flex: 1, padding: "5px 10px", borderRadius: 20, background: "#f4f4f5", fontSize: 8, color: "#a1a1aa" }}>
              Nachricht schreiben…
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={10} color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 4 — Studio Dashboard
──────────────────────────────────────────────────────────── */
function DashboardMockup() {
  const bookings = [
    { name: "Lena M.",   date: "22. Juni",  style: "Fine Line",    status: "confirmed", amount: "EUR 50" },
    { name: "Jonas K.",  date: "24. Juni",  style: "Realism",      status: "pending",   amount: "EUR 80" },
    { name: "Sara B.",   date: "27. Juni",  style: "Blackwork",    status: "confirmed", amount: "EUR 60" },
  ];
  const statusStyle = {
    confirmed: { bg: "#dcfce7", color: "#16a34a", label: "Bestaetigt" },
    pending:   { bg: "#fef9c3", color: "#a16207", label: "Ausstehend" },
  };
  return (
    <BrowserFrame dark>
      <div style={{ display: "flex", minHeight: 380, background: "#09090b" }}>
        {/* Sidebar */}
        <div style={{ width: 130, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "10px 0", display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ padding: "4px 14px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#09090b" }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: F.play }}>StudioOS</span>
          </div>
          {[
            { icon: BarChart2,     label: "Uebersicht",   active: true },
            { icon: Inbox,         label: "Anfragen",     active: false, badge: 2 },
            { icon: CalendarCheck, label: "Kalender",     active: false },
            { icon: MessageCircle, label: "Nachrichten",  active: false },
          ].map(({ icon: Icon, label, active, badge }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 0,
              background: active ? "rgba(255,255,255,0.07)" : "transparent",
              borderLeft: active ? "2px solid #fff" : "2px solid transparent",
            }}>
              <Icon size={11} color={active ? "#fff" : "rgba(255,255,255,0.35)"} strokeWidth={1.5} />
              <span style={{ fontSize: 8.5, color: active ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: active ? 600 : 400 }}>{label}</span>
              {badge && <div style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>{badge}</span>
              </div>}
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F.play, marginBottom: 1 }}>Uebersicht</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Juni 2026</div>
          </div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Anfragen",    value: "12", trend: "+3" },
              { label: "Bestaetigt", value: "8",  trend: "+1" },
              { label: "Einnahmen",  value: "EUR 640", trend: "+EUR 80" },
            ].map(({ label, value, trend }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: 7, color: "#22c55e" }}>{trend} diese Woche</div>
              </div>
            ))}
          </div>
          {/* Bookings */}
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.12em" }}>Naechste Termine</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {bookings.map((b) => {
                const st = statusStyle[b.status];
                return (
                  <div key={b.name} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 9, padding: "6px 10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{b.name[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#fff" }}>{b.name}</div>
                      <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)" }}>{b.date} &middot; {b.style}</div>
                    </div>
                    <div style={{ padding: "2px 7px", borderRadius: 6, background: st.bg }}>
                      <span style={{ fontSize: 7, fontWeight: 600, color: st.color }}>{st.label}</span>
                    </div>
                    <span style={{ fontSize: 8.5, fontWeight: 600, color: "#fff" }}>{b.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   Newsletter
──────────────────────────────────────────────────────────── */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const handle = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const { data } = await axios.post(`${API}/newsletter/subscribe`, { email });
      setStatus(data.status === "already_subscribed" ? "already" : "success");
      setMsg(data.message);
    } catch { setStatus("error"); setMsg("Fehler. Bitte versuche es erneut."); }
  };
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-1 font-inter">Newsletter</p>
        <p className="font-playfair text-lg text-zinc-900">Bleib auf dem Laufenden.</p>
      </div>
      <div className="w-full sm:w-auto sm:min-w-[300px]">
        {status === "success" ? (
          <p className="text-sm font-inter text-zinc-500">&#10003; {msg}</p>
        ) : (
          <form onSubmit={handle} className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de" required disabled={status === "loading"}
              className="flex-1 px-4 py-2.5 rounded-full text-sm font-inter bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors disabled:opacity-50" />
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

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <SplashScreen />
      <div className="bg-white min-h-screen font-inter">

        {/* ══ HERO ═══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-24 pb-0 px-6 lg:px-10">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.032) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-12">
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}
                className="text-[10px] tracking-[.3em] uppercase text-zinc-400 mb-5 font-inter">
                Premium Tattoo Booking Platform
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="font-playfair text-5xl sm:text-6xl lg:text-7xl text-zinc-950 leading-[1.06] tracking-tight mb-6">
                Dein Tattoo-Termin.<br />
                <em style={{ fontStyle: "italic", color: "#52525b" }}>Einfach. Digital.</em>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }}
                className="text-base sm:text-lg text-zinc-500 leading-relaxed mb-8 font-inter max-w-xl mx-auto">
                Finde kuratierte Studios, buche per Echtzeit-Kalender und kommuniziere direkt im Chat — ohne Umwege, ohne WhatsApp-Chaos.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }}
                className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Link to="/search"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all group font-inter">
                  Studio finden
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link to="/register?role=studio"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-medium border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-all font-inter">
                  Als Studio registrieren
                </Link>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-xs text-zinc-400 font-inter">
                Kostenlos &middot; Kein Account zum Stoebern noetig
              </motion.p>
            </div>

            {/* Hero mockup — full-width browser */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Soft gradient fade at bottom so it flows into next section */}
              <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10"
                style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />
              <SearchMockup />
            </motion.div>
          </div>
        </section>

        {/* ══ FEATURE 1: TERMIN ANFRAGEN ═══════════════════════════ */}
        <section className="py-24 px-6 lg:px-10 border-t border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <FadeUp>
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-4 font-inter">01 — Buchen</p>
                <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950 leading-[1.1] mb-5">
                  Termin anfragen.<br />In zwei Minuten.
                </h2>
                <p className="text-zinc-500 font-inter leading-relaxed mb-7 text-sm">
                  Sieh in Echtzeit welche Tage beim Studio frei sind — farbcodiert nach Auslastung. Kein Anrufen, kein Warten auf Instagram-DMs. Einfach Datum waehlen, Motiv beschreiben und absenden.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: CalendarCheck, text: "Echtzeit-Verfuegbarkeit — sofort sehen was frei ist" },
                    { icon: Shield,        text: "Anzahlung via Stripe — dein Geld ist geschuetzt" },
                    { icon: Zap,           text: "Buchung in unter 2 Minuten abgeschlossen" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={12} strokeWidth={2} className="text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-600 font-inter">{text}</p>
                    </div>
                  ))}
                </div>
                <Link to="/search"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 font-inter group hover:gap-3 transition-all">
                  Jetzt ein Studio finden
                  <ChevronRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </FadeUp>
              <FadeUp delay={0.12}>
                <BookingMockup />
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══ FEATURE 2: NACHRICHTEN & ANGEBOTE ═══════════════════ */}
        <section className="py-24 px-6 lg:px-10 bg-zinc-50 border-t border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <FadeUp delay={0.12} className="order-2 lg:order-1">
                <ChatMockup />
              </FadeUp>
              <FadeUp className="order-1 lg:order-2">
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-4 font-inter">02 — Kommunizieren</p>
                <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950 leading-[1.1] mb-5">
                  Direkt chatten.<br />Angebot annehmen.
                </h2>
                <p className="text-zinc-500 font-inter leading-relaxed mb-7 text-sm">
                  Schreib dem Studio direkt im integrierten Chat, klaere Details, teile Referenzbilder. Das Studio schickt dir ein verbindliches Angebot mit Datum und Preis — du nimmst es mit einem Klick an.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: MessageCircle, text: "Integrierter Chat — kein WhatsApp oder Drittanbieter noetig" },
                    { icon: CalendarCheck, text: "Verbindliche Angebote mit Termin, Preis und Anzahlung" },
                    { icon: Star,          text: "Nach dem Termin: Bewertung direkt in der App abgeben" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={12} strokeWidth={2} className="text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-600 font-inter">{text}</p>
                    </div>
                  ))}
                </div>
                <Link to="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 font-inter group hover:gap-3 transition-all">
                  Kostenlos registrieren
                  <ChevronRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══ FEATURE 3: STUDIO DASHBOARD ══════════════════════════ */}
        <section className="bg-zinc-950 py-24 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <FadeUp>
                <p className="text-[10px] tracking-[.28em] uppercase text-zinc-500 mb-4 font-inter">03 — Fuer Studios</p>
                <h2 className="font-playfair text-4xl sm:text-5xl text-white leading-[1.1] mb-5">
                  Mehr Buchungen.<br />Weniger Chaos.
                </h2>
                <p className="text-white/50 font-inter leading-relaxed mb-7 text-sm">
                  Beende das Chaos aus DMs, WhatsApp-Gruppen und verpassten Anfragen. StudioOS gibt dir ein professionelles Buchungssystem — Kalender, Kundenchat und Zahlungsabwicklung, alles an einem Ort.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Eigenes Studio-Profil mit Kapazitaetskalender",
                    "Alle Buchungsanfragen im zentralen Dashboard",
                    "Kunden-Chat und Termin-Angebote direkt aus dem System",
                    "Einnahmen-Uebersicht und Auslastungsstatistiken",
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
              <FadeUp delay={0.12}>
                <DashboardMockup />
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══ VERTRAUEN ════════════════════════════════════════════ */}
        <section className="py-24 px-6 border-t border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <FadeUp className="text-center mb-14">
              <p className="text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-3 font-inter">Unser Versprechen</p>
              <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950">Gebaut fuer Vertrauen.</h2>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield,    title: "Sichere Zahlungen",  desc: "Alle Transaktionen laufen ueber Stripe — denselben Anbieter hinter Shopify und Amazon. Dein Geld ist jederzeit geschuetzt." },
                { icon: Star,      title: "Echte Bewertungen",  desc: "Nur Kunden die wirklich gebucht haben koennen bewerten. Keine gekauften Reviews — nur transparente, echte Erfahrungen." },
                { icon: Clock,     title: "Keine Wartezeiten",  desc: "Echtzeit-Verfuegbarkeit bedeutet: du siehst sofort ob ein Studio frei ist. Buchung in unter zwei Minuten abschliessen." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.08}>
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

        {/* ══ FINAL CTA ════════════════════════════════════════════ */}
        <FadeUp>
          <div className="mx-4 sm:mx-6 mb-20 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)" }}>
            <div className="max-w-4xl mx-auto px-8 py-16 text-center">
              <p className="text-[10px] tracking-[.28em] uppercase text-zinc-500 mb-4 font-inter">Jetzt loslegen</p>
              <h3 className="font-playfair text-3xl sm:text-4xl text-white leading-tight mb-4">
                Bereit fuer dein<br />naechstes Tattoo?
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

        {/* ══ FOOTER ═══════════════════════════════════════════════ */}
        <footer className="border-t border-zinc-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="mb-10 pb-10 border-b border-zinc-100">
              <NewsletterSection />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StudioOSMark size={22} />
                  <span className="font-playfair font-semibold text-zinc-900">Studio<strong>OS</strong></span>
                </div>
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">Die Tattoo-Buchungsplattform fuer Deutschland.</p>
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
