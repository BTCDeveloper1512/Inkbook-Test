import React, { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Star, MapPin, Check, Calendar, Zap, Shield, BarChart2 } from "lucide-react";
import SplashScreen from "../components/SplashScreen";
import { prefetchStudios } from "../utils/studiosCache";

/* ── Design-Tokens (Apple-inspiriert) ─────────────────── */
const FONT = "'Cooper Hewitt', 'Barlow', -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  bg:      "#ffffff",
  gray:    "#f5f5f7",   /* Apple's Seite-Grau           */
  line:    "#d2d2d7",   /* Apple's Trennlinie           */
  ink:     "#1d1d1f",   /* Apple's Schwarz              */
  mid:     "#6e6e73",   /* Apple's Grau-Text            */
  faint:   "#86868b",   /* Noch heller                  */
  button:  "#1d1d1f",
  btnTxt:  "#ffffff",
};

/* ── FadeIn ──────────────────────────────────────────── */
function FadeIn({ children, delay = 0, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ── MacBook 3-D ─────────────────────────────────────── */
function MacBook() {
  const [open,     setOpen]     = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [logoIn,   setLogoIn]   = useState(false);
  const [uiIn,     setUiIn]     = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setOpen(true),     350);
    const t2 = setTimeout(() => setScreenOn(true), 1750);
    const t3 = setTimeout(() => setLogoIn(true),   2100);
    const t4 = setTimeout(() => setUiIn(true),     2550);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const W      = 420;
  const H_LID  = 260;
  const H_BASE = 17;
  const BEZEL  = 12;

  return (
    <div style={{
      perspective: 1300, perspectiveOrigin: "50% 140%",
      width: W + 100, height: H_LID + H_BASE + 80,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{ position: "relative", width: W, transform: "rotateX(20deg)", transformStyle: "preserve-3d" }}>

        {/* DECKEL */}
        <motion.div
          initial={{ rotateX: -112 }}
          animate={{ rotateX: open ? -16 : -112 }}
          transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute", bottom: H_BASE, width: W, height: H_LID,
            transformOrigin: "bottom center", transformStyle: "preserve-3d",
            borderRadius: "12px 12px 3px 3px",
            background: "linear-gradient(165deg, #3a3a3c, #2a2a2c)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.06) inset",
          }}
        >
          {/* Displayrahmen */}
          <div style={{ position: "absolute", inset: BEZEL, borderRadius: "7px 7px 3px 3px", background: "#111", overflow: "hidden" }}>
            {/* Bildschirm */}
            <motion.div
              animate={{ opacity: screenOn ? 1 : 0, background: screenOn ? "#f8f8f8" : "#000" }}
              transition={{ duration: 0.55 }}
              style={{ position: "absolute", inset: 2, borderRadius: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, overflow: "hidden" }}
            >
              {/* Menüleiste */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", padding: "0 8px", gap: 4, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />)}
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {[36, 24, 28].map((w, i) => <div key={i} style={{ width: w, height: 3.5, borderRadius: 3, background: "rgba(0,0,0,0.1)" }} />)}
                </div>
              </div>

              {/* StudioOS Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: logoIn ? 1 : 0, scale: logoIn ? 1 : 0.86 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: "center" }}
              >
                <p style={{ fontSize: 26, fontWeight: 300, color: C.ink, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
                  Studio<span style={{ opacity: 0.3 }}>OS</span>
                </p>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: logoIn ? 1 : 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  style={{ fontSize: 7.5, letterSpacing: "0.2em", textTransform: "uppercase", color: C.mid, fontFamily: FONT, fontWeight: 300 }}
                >
                  Das Studio-Betriebssystem
                </motion.p>
              </motion.div>

              {/* Mini-App-Vorschau */}
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: uiIn ? 1 : 0, y: uiIn ? 0 : 6 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: "82%", background: "#f0f0f0", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 14px rgba(0,0,0,0.07)" }}
              >
                <div style={{ height: 14, background: "#e4e4e4", display: "flex", alignItems: "center", padding: "0 8px", gap: 3, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />)}
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  <div style={{ width: 48, height: 46, background: "linear-gradient(135deg,#3a3a3c,#111)" }} />
                  <div style={{ flex: 1, padding: "6px 8px" }}>
                    <div style={{ fontSize: 7.5, fontWeight: 600, color: C.ink, fontFamily: FONT, marginBottom: 2 }}>JohannINK</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                      <Star size={6} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 6, color: C.mid, fontFamily: FONT }}>5.0 · Fine Line</span>
                    </div>
                    <div style={{ width: 50, height: 9, background: C.ink, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 5, color: "#fff", fontFamily: FONT }}>Termin anfragen</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            {/* Kamera */}
            <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#333" }} />
          </div>
        </motion.div>

        {/* BASIS */}
        <div style={{ width: W, height: H_BASE, background: "linear-gradient(to bottom, #3a3a3c, #2c2c2e)", borderRadius: "0 0 12px 12px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 2, background: "rgba(0,0,0,0.3)", borderRadius: "0 0 2px 2px" }} />
          <div style={{ position: "absolute", top: 3, left: "7%", right: "7%", bottom: 4, background: "rgba(255,255,255,0.03)", borderRadius: 3 }}>
            <div style={{ position: "absolute", inset: 2, backgroundImage: "repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 10px),repeating-linear-gradient(rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 7px)" }} />
          </div>
          <div style={{ position: "absolute", bottom: 2, left: "38%", right: "38%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
        </div>

        {/* Schatten auf weißem Hintergrund */}
        <div style={{ position: "absolute", bottom: -40, left: "5%", right: "5%", height: 32, background: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.18), transparent 70%)", filter: "blur(14px)", pointerEvents: "none" }} />

        {/* Screen-Glow auf Keyboard */}
        <motion.div
          animate={{ opacity: screenOn ? 1 : 0 }} transition={{ duration: 0.6 }}
          style={{ position: "absolute", top: -4, left: "12%", right: "12%", height: 8, background: "radial-gradient(ellipse at 50% 100%, rgba(120,120,255,0.08), transparent 70%)", filter: "blur(4px)", pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}

/* ── App-Mockup Phasen ───────────────────────────────── */
const PHASE_DUR = 2800;
const Z = { 950:"#09090b",900:"#18181b",700:"#3f3f46",600:"#52525b",500:"#71717a",400:"#a1a1aa",200:"#e4e4e7",100:"#f4f4f5",50:"#fafafa" };
const MF   = "'Cooper Hewitt', 'Barlow', sans-serif";
const TEAL = "#2dd4bf";

function MNav() {
  return (
    <div style={{ height: 36, borderBottom: `1px solid ${Z[100]}`, background: "#fff", display: "flex", alignItems: "center", padding: "0 12px", gap: 6, flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: Z[950], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 4, height: 4, borderRadius: 1, background: Z[950] }} />
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 400, color: Z[950], fontFamily: MF, flex: 1, letterSpacing: "-0.01em" }}>StudioOS</span>
      <span style={{ fontSize: 7.5, color: Z[400], fontFamily: MF }}>Anmelden</span>
    </div>
  );
}

function PhaseSearch() {
  return (
    <motion.div key="search"
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, background: Z[50], padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}
    >
      <p style={{ fontSize: 6.5, letterSpacing: "0.22em", textTransform: "uppercase", color: Z[400], fontFamily: MF, marginBottom: 2 }}>Studios entdecken</p>
      <p style={{ fontSize: 18, fontWeight: 300, color: Z[950], fontFamily: MF, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 6 }}>Dein<br/>perfektes Studio.</p>
      <div style={{ border: `1.5px solid ${Z[950]}`, borderRadius: 9, padding: "6px 10px", background: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", border: `1.5px solid ${Z[500]}` }} />
        <span style={{ fontSize: 8, color: Z[400], fontFamily: MF, flex: 1 }}>Studioname, Stil oder Stadt …</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }}
        style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${Z[950]}`, boxShadow: "0 4px 18px rgba(0,0,0,0.08)", display: "flex", overflow: "hidden" }}
      >
        <div style={{ width: 64, flexShrink: 0, background: `linear-gradient(145deg, ${Z[950]}, ${Z[700]})`, position: "relative" }}>
          <img src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=200&h=200&fit=crop&q=70"
            alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.75 }}
          />
          <div style={{ position: "absolute", top: 5, left: 4, background: "rgba(9,9,11,0.85)", borderRadius: 3, padding: "1.5px 5px" }}>
            <span style={{ fontSize: 5, color: "#fff", fontFamily: MF }}>Verifiziert</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: Z[950], fontFamily: MF, lineHeight: 1.1 }}>JohannINK</span>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Star size={8} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 8, fontWeight: 600, color: Z[950], fontFamily: MF }}>5.0</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
            <MapPin size={7} color={Z[400]} strokeWidth={1.5} />
            <span style={{ fontSize: 7, color: Z[500], fontFamily: MF }}>Wardenburg</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 3 }}>
              {["Fine Line","Realism"].map(s => (
                <span key={s} style={{ fontSize: 6, padding: "1.5px 6px", borderRadius: 20, background: Z[100], color: Z[500], fontFamily: MF, border: `1px solid ${Z[200]}` }}>{s}</span>
              ))}
            </div>
            <motion.div
              animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }}
              style={{ padding: "3.5px 9px", borderRadius: 7, background: Z[950] }}
            >
              <span style={{ fontSize: 7, color: "#fff", fontFamily: MF }}>Termin anfragen</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.45, y: 0 }} transition={{ delay: 0.38 }}
        style={{ background: "#fff", borderRadius: 10, border: `1px solid ${Z[200]}`, display: "flex", overflow: "hidden", height: 48 }}
      >
        <div style={{ width: 48, flexShrink: 0, background: `linear-gradient(145deg, ${Z[700]}, ${Z[500]})` }} />
        <div style={{ flex: 1, padding: "8px 10px" }}>
          <span style={{ fontSize: 9, fontWeight: 500, color: Z[900], fontFamily: MF }}>Sacred Needles</span>
          <p style={{ fontSize: 7, color: Z[400], fontFamily: MF, marginTop: 2 }}>Hamburg · Traditional</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CAL  = [[null,1,2,3,4,5,6],[7,8,9,10,11,12,13],[14,15,16,17,18,19,20],[21,22,23,24,25,26,27],[28,29,30,null,null,null,null]];
const AV   = {1:"t",2:"t",3:"t",4:"y",5:"t",8:"t",9:"t",10:"r",11:"t",14:"t",15:"t",17:"t",18:"y",21:"t",22:"t",23:"y",24:"t",25:"r",28:"t",29:"t",30:"y"};
const AC   = { t: TEAL, y: "#facc15", r: "#fb7185" };
const HDR  = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const WDAY = ["So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di"];

function PhaseCalendar() {
  const [sel, setSel] = useState(null);
  useEffect(() => {
    const days = [15, 22, 18]; let i = 0;
    const iv = setInterval(() => { setSel(days[i % days.length]); i++; }, 700);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div key="cal"
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, background: "#fff", padding: "10px 12px", overflow: "hidden" }}
    >
      <p style={{ fontSize: 9, fontWeight: 500, color: Z[950], fontFamily: MF, marginBottom: 6 }}>Termin anfragen</p>
      <p style={{ fontSize: 6, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: MF, marginBottom: 5 }}>Wunschdatum</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 6, color: Z[400] }}>‹</span>
        <span style={{ fontSize: 7.5, fontWeight: 500, color: Z[900], fontFamily: MF }}>Juni 2026</span>
        <span style={{ fontSize: 6, color: Z[400] }}>›</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
        {HDR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 5, color: Z[400], paddingBottom: 3 }}>{d}</div>)}
      </div>
      {CAL.map((wk, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 1 }}>
          {wk.map((d, di) => {
            if (!d) return <div key={di} />;
            const isSel = d === sel, av = AV[d];
            return (
              <motion.div key={di}
                animate={isSel ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5px 0", borderRadius: 4, background: isSel ? Z[950] : "transparent" }}
              >
                <span style={{ fontSize: 6.5, color: isSel ? "#fff" : Z[700], fontWeight: isSel ? 500 : 400, lineHeight: 1 }}>{d}</span>
                {av && <div style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: isSel ? "#fff" : AC[av], marginTop: 1 }} />}
              </motion.div>
            );
          })}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 5 }}>
        {[[TEAL,"Verfügbar"],["#facc15","Begrenzt"],["#fb7185","Voll"]].map(([col, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: col }} />
            <span style={{ fontSize: 5.5, color: Z[400], fontFamily: MF }}>{l}</span>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div key={sel}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: 7, padding: "5px 8px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <p style={{ fontSize: 7, fontWeight: 500, color: "#15803d", fontFamily: MF }}>{WDAY[sel - 1]}, {sel}. Juni 2026</p>
            <p style={{ fontSize: 6, color: "#16a34a", fontFamily: MF }}>Gut verfügbar</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhaseForm() {
  const [sizeIdx, setSizeIdx] = useState(1);
  const sizes = ["Mini","Small","Medium","Large","XL"];
  useEffect(() => {
    let i = 1;
    const iv = setInterval(() => { i = (i + 1) % 5; setSizeIdx(i); }, 650);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div key="form"
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, background: "#fff", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}
    >
      <p style={{ fontSize: 9, fontWeight: 500, color: Z[950], fontFamily: MF }}>Termin anfragen</p>
      <div>
        <p style={{ fontSize: 6, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: MF, marginBottom: 4 }}>Terminart</p>
        <div style={{ display: "flex", gap: 4 }}>
          {["Beratung","Tattoo"].map((t, i) => (
            <div key={t} style={{ flex: 1, padding: "4px 0", textAlign: "center", borderRadius: 7, border: `1px solid ${i === 1 ? Z[950] : Z[200]}`, background: i === 1 ? Z[950] : "#fff" }}>
              <span style={{ fontSize: 7.5, fontWeight: i === 1 ? 500 : 400, color: i === 1 ? "#fff" : Z[500], fontFamily: MF }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 6, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: MF, marginBottom: 4 }}>Tattoo-Größe</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sizes.map((s, i) => (
            <motion.div key={s}
              animate={i === sizeIdx ? { scale: 1.02, x: 1 } : { scale: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${i === sizeIdx ? Z[950] : Z[100]}`, background: i === sizeIdx ? Z[950] : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontSize: 7.5, fontWeight: i === sizeIdx ? 500 : 400, color: i === sizeIdx ? "#fff" : Z[600], fontFamily: MF }}>{s}</span>
              <span style={{ fontSize: 6, color: i === sizeIdx ? "rgba(255,255,255,0.4)" : Z[400], fontFamily: MF }}>{[1,2,3,5,8][i]} Pkt.</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        style={{ padding: "5px 8px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 6 }}
      >
        <Calendar size={10} color="#16a34a" strokeWidth={1.5} />
        <span style={{ fontSize: 7.5, fontWeight: 500, color: "#15803d", fontFamily: MF }}>Mi, 22. Juni 2026</span>
      </motion.div>
    </motion.div>
  );
}

function PhaseSuccess() {
  return (
    <motion.div key="success"
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 14px", gap: 10 }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
        style={{ width: 54, height: 54, borderRadius: "50%", background: Z[950], display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Check size={24} color="#fff" strokeWidth={2} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: Z[950], fontFamily: MF, marginBottom: 5 }}>Termin angefragt!</p>
        <p style={{ fontSize: 7.5, color: Z[500], fontFamily: MF, lineHeight: 1.55 }}>JohannINK bestätigt deinen<br/>Termin in Kürze.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: `1px solid ${Z[100]}`, background: Z[50] }}
      >
        {[["Studio","JohannINK"],["Datum","Mi, 22. Juni 2026"],["Größe","Small · 2 Punkte"],["Anzahlung","€ 50 bezahlt"]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 7, color: Z[400], fontFamily: MF }}>{l}</span>
            <span style={{ fontSize: 7, fontWeight: 500, color: Z[700], fontFamily: MF }}>{v}</span>
          </div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ padding: "6px 16px", borderRadius: 20, background: Z[950], marginTop: 4 }}
      >
        <span style={{ fontSize: 8, color: "#fff", fontFamily: MF }}>In der App ansehen</span>
      </motion.div>
    </motion.div>
  );
}

function AppMockup() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhase(p => (p + 1) % 4), PHASE_DUR);
    return () => clearInterval(iv);
  }, []);
  const labels = ["Studios entdecken","Datum wählen","Details eingeben","Buchung bestätigt"];
  return (
    <div ref={ref} style={{ perspective: 1200 }}>
      <motion.div
        initial={{ opacity: 0, rotateY: 20, rotateX: 6, y: 44 }}
        animate={inView ? { opacity: 1, rotateY: -8, rotateX: 3, y: 0 } : {}}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ rotateY: -3, rotateX: 1, transition: { duration: 0.7 } }}
        style={{ transformStyle: "preserve-3d", maxWidth: 320, margin: "0 auto" }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)", background: "#fff" }}>
          <div style={{ height: 36, background: "#e8e8e8", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, height: 20, borderRadius: 5, background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: "#888", fontFamily: MF }}>app.studio-os.de</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", height: 520 }}>
            <MNav />
            <AnimatePresence mode="wait">
              {phase === 0 && <PhaseSearch key="s" />}
              {phase === 1 && <PhaseCalendar key="c" />}
              {phase === 2 && <PhaseForm key="f" />}
              {phase === 3 && <PhaseSuccess key="ok" />}
            </AnimatePresence>
          </div>
          <div style={{ padding: "8px 14px", background: "#f4f4f5", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{ width: i === phase ? 16 : 5, background: i === phase ? Z[950] : Z[400] }}
                  transition={{ duration: 0.35 }}
                  style={{ height: 5, borderRadius: 10 }}
                />
              ))}
            </div>
            <span style={{ fontSize: 8, color: Z[400], fontFamily: MF }}>{labels[phase]}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HAUPT-KOMPONENTE
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!done) return <SplashScreen onDone={() => setDone(true)} />;

  const px = isMobile ? "20px" : "44px";

  return (
    <div style={{ fontFamily: FONT, background: C.bg, overflowX: "hidden", color: C.ink, maxWidth: "100vw" }}>

      {/* ── Navigation ───────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 56, padding: `0 ${px}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${C.line}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <span style={{ fontSize: 17, fontWeight: 300, color: C.ink, letterSpacing: "-0.03em", fontFamily: FONT }}>
          Studio<span style={{ opacity: 0.32 }}>OS</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 32 }}>
          {!isMobile && <>
            <Link to="/search"    style={{ fontSize: 13, fontWeight: 300, color: C.mid, textDecoration: "none", fontFamily: FONT }}>Studios finden</Link>
            <Link to="/ueber-uns" style={{ fontSize: 13, fontWeight: 300, color: C.mid, textDecoration: "none", fontFamily: FONT }}>Über uns</Link>
            <Link to="/login"     style={{ fontSize: 13, fontWeight: 300, color: C.mid, textDecoration: "none", fontFamily: FONT }}>Anmelden</Link>
          </>}
          {isMobile && <Link to="/login" style={{ fontSize: 13, fontWeight: 300, color: C.mid, textDecoration: "none", fontFamily: FONT }}>Login</Link>}
          <Link to="/register?role=studio" style={{
            fontSize: 13, fontWeight: 400, color: C.btnTxt, background: C.button,
            padding: isMobile ? "7px 14px" : "8px 20px", borderRadius: 100, textDecoration: "none", fontFamily: FONT,
            whiteSpace: "nowrap",
          }}>
            {isMobile ? "Starten" : "Als Studio starten"}
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          SEKTION 1 — HERO
      ══════════════════════════════════════════════ */}
      <section style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: isMobile ? 80 : 92, overflow: "hidden", position: "relative" }}>

        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% 90%, rgba(0,0,0,0.03), transparent)", pointerEvents: "none" }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", maxWidth: 800, padding: `0 ${px}`, position: "relative", zIndex: 2, width: "100%" }}
        >
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.26em", textTransform: "uppercase", color: C.faint, marginBottom: isMobile ? 16 : 22, fontFamily: FONT }}
          >
            Das Studio-Betriebssystem
          </motion.p>

          <h1 style={{ fontSize: isMobile ? "clamp(38px, 11vw, 58px)" : "clamp(44px, 7vw, 86px)", fontWeight: 300, color: C.ink, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: isMobile ? 16 : 22, fontFamily: FONT }}>
            Tattoo-Buchungen.<br />
            <span style={{ color: "rgba(29,29,31,0.22)" }}>Endlich digital.</span>
          </h1>

          <p style={{ fontSize: isMobile ? 15 : "clamp(15px, 1.6vw, 18px)", color: C.mid, maxWidth: 480, margin: `0 auto ${isMobile ? 28 : 36}px`, lineHeight: 1.65, fontWeight: 300, fontFamily: FONT }}>
            Kunden buchen per Echtzeit-Kalender, zahlen per Stripe —
            kein WhatsApp-Chaos, keine verpassten Anfragen.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/search" onMouseEnter={prefetchStudios} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: isMobile ? "13px 22px" : "14px 28px", borderRadius: 100, background: C.button, color: C.btnTxt, fontSize: 14, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
              Studio finden <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
            <Link to="/register?role=studio" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: isMobile ? "13px 22px" : "14px 28px", borderRadius: 100, border: `1px solid ${C.line}`, color: C.mid, fontSize: 14, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
              {isMobile ? "Studio registrieren" : "Als Studio registrieren"}
            </Link>
          </div>
          <p style={{ fontSize: 12, color: C.faint, marginTop: 16, fontFamily: FONT, fontWeight: 300 }}>Kostenlos · Keine Kreditkarte erforderlich</p>
        </motion.div>

        {/* MacBook — skaliert auf Mobile */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 44, position: "relative", zIndex: 1 }}
          >
            <MacBook />
          </motion.div>
        )}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 36, width: "100%", overflow: "hidden", display: "flex", justifyContent: "center" }}
          >
            <div style={{ transform: "scale(0.62)", transformOrigin: "center top", marginBottom: -136 }}>
              <MacBook />
            </div>
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════════
          SEKTION 2 — STATS (Apple-Grau)
      ══════════════════════════════════════════════ */}
      <section style={{ background: C.gray, padding: isMobile ? "48px 20px" : "72px 44px", borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 32 : 0 }}>
          {[
            ["500+","Buchungen / Monat","und wachsend"],
            ["< 60 s","von Suche bis Buchung","vollständig digital"],
            ["100 %","sichere Zahlung","via Stripe, automatisch"],
          ].map(([num, title, sub], i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{ padding: isMobile ? "0" : "0 40px", borderRight: (!isMobile && i < 2) ? `1px solid ${C.line}` : "none", borderBottom: (isMobile && i < 2) ? `1px solid ${C.line}` : "none", paddingBottom: (isMobile && i < 2) ? 32 : 0 }}>
                <p style={{ fontSize: isMobile ? "clamp(36px,10vw,52px)" : "clamp(38px,5vw,60px)", fontWeight: 300, color: C.ink, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8 }}>{num}</p>
                <p style={{ fontSize: 15, fontWeight: 300, color: C.ink, fontFamily: FONT, marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 13, fontWeight: 300, color: C.faint, fontFamily: FONT }}>{sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SEKTION 3 — MOCKUP + TEXT (Weiß)
      ══════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: isMobile ? "64px 20px 72px" : "110px 44px 130px", borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems: "center" }}>
          <FadeIn>
            <p style={{ fontSize: 12, fontWeight: 300, letterSpacing: "0.26em", textTransform: "uppercase", color: C.faint, marginBottom: 20, fontFamily: FONT }}>Für Studios & Kunden</p>
            <h2 style={{ fontSize: "clamp(34px, 4vw, 56px)", fontWeight: 300, color: C.ink, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 22, fontFamily: FONT }}>
              Dein Studio.<br/>Professionell<br/>buchbar.
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: C.mid, lineHeight: 1.7, marginBottom: 40, fontFamily: FONT, maxWidth: 440 }}>
              Echter Echtzeit-Kalender, Artist-Auswahl und sichere Anzahlung —
              alles in einem einzigen Buchungsschritt.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
              {[
                "Echtzeit-Kalender farbcodiert nach Verfügbarkeit",
                "Größe, Körperstelle und Artist in einem Schritt",
                "Sichere Anzahlung via Stripe — automatisch verwaltet",
                "Alle Anfragen zentral im Studio-Dashboard",
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.09, duration: 0.5 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <CheckCircle size={15} strokeWidth={1.5} color={C.ink} style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontSize: 14, fontWeight: 300, color: C.mid, lineHeight: 1.55, fontFamily: FONT }}>{item}</span>
                </motion.div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/register?role=studio" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 100, background: C.button, color: C.btnTxt, fontSize: 14, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
                Kostenlos starten <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link to="/search" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 100, border: `1px solid ${C.line}`, color: C.mid, fontSize: 14, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
                Studio suchen
              </Link>
            </div>
          </FadeIn>

          {!isMobile && (
            <FadeIn delay={0.14}>
              <AppMockup />
            </FadeIn>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SEKTION 4 — FEATURES (Apple-Grau)
      ══════════════════════════════════════════════ */}
      <section style={{ background: C.gray, padding: isMobile ? "56px 20px" : "100px 44px", borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", maxWidth: 640, margin: isMobile ? "0 auto 40px" : "0 auto 64px" }}>
            <p style={{ fontSize: 12, fontWeight: 300, letterSpacing: "0.26em", textTransform: "uppercase", color: C.faint, marginBottom: 18, fontFamily: FONT }}>Warum StudioOS</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, color: C.ink, lineHeight: 1.05, letterSpacing: "-0.04em", fontFamily: FONT }}>
              Alles was dein Studio braucht
            </h2>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 14 : 20 }}>
            {[
              [Zap,       "Sofort-Buchung",  "Kunden buchen direkt — ohne DM oder Telefonanfragen. Dein Kalender füllt sich automatisch."],
              [Shield,    "Sichere Zahlung", "Anzahlungen über Stripe schützen vor No-Shows. Automatisch, rechtssicher, simpel."],
              [BarChart2, "Dashboard",       "Alle Buchungen, Kunden und Einnahmen auf einen Blick — von überall verwaltbar."],
            ].map(([Icon, title, text], i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ padding: 36, borderRadius: 20, background: C.bg, border: `1px solid ${C.line}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gray, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                    <Icon size={20} color={C.ink} strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 300, color: C.ink, fontFamily: FONT, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: C.mid, fontFamily: FONT, lineHeight: 1.65 }}>{text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SEKTION 5 — EDITORIAL CTA (Weiß, nicht-standard)
      ══════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: isMobile ? "64px 20px 72px" : "120px 44px 100px", borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{
              fontSize: isMobile ? "clamp(44px, 12vw, 72px)" : "clamp(56px, 10vw, 140px)", fontWeight: 300,
              color: C.ink, letterSpacing: "-0.05em", lineHeight: 0.92,
              fontFamily: FONT, marginBottom: isMobile ? 32 : 48,
            }}>
              Bereit, dein<br/>
              <span style={{ color: "rgba(29,29,31,0.18)" }}>Studio zu starten?</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 20 : 24, paddingTop: 36, borderTop: `1px solid ${C.line}` }}>
              <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 300, color: C.mid, fontFamily: FONT, maxWidth: 440, lineHeight: 1.6 }}>
                Registriere dein Studio kostenlos, richte deinen Kalender ein und nimm in wenigen Minuten Buchungen entgegen.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to="/register?role=studio" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: isMobile ? "14px 24px" : "16px 32px", borderRadius: 100, background: C.button, color: C.btnTxt, fontSize: isMobile ? 14 : 15, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
                  Jetzt registrieren <ArrowRight size={15} strokeWidth={1.5} />
                </Link>
                <Link to="/search" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: isMobile ? "14px 24px" : "16px 32px", borderRadius: 100, border: `1px solid ${C.line}`, color: C.mid, fontSize: isMobile ? 14 : 15, fontWeight: 300, textDecoration: "none", fontFamily: FONT }}>
                  Studios ansehen
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER — Editorial, nicht-standard
      ══════════════════════════════════════════════ */}
      <footer style={{ background: C.gray, borderTop: `1px solid ${C.line}`, padding: isMobile ? "48px 20px 36px" : "80px 44px 44px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Riesiger Logo-Text */}
          <FadeIn>
            <p style={{ fontSize: isMobile ? "clamp(44px, 14vw, 80px)" : "clamp(52px, 11vw, 144px)", fontWeight: 300, color: C.ink, letterSpacing: "-0.06em", lineHeight: 0.88, fontFamily: FONT, marginBottom: isMobile ? 36 : 56 }}>
              Studio<span style={{ opacity: 0.18 }}>OS</span>
            </p>
          </FadeIn>

          {/* Links */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 28 : 40, marginBottom: isMobile ? 40 : 64, paddingTop: 32, borderTop: `1px solid ${C.line}` }}>
            {!isMobile && (
              <div>
                <p style={{ fontSize: 14, fontWeight: 300, color: C.mid, fontFamily: FONT, lineHeight: 1.7, maxWidth: 260 }}>
                  Das Betriebssystem für moderne Tattoo-Studios — von der Buchung bis zur Bezahlung.
                </p>
              </div>
            )}

            {[
              ["Plattform", [["Studios finden","/search"],["Als Studio starten","/register?role=studio"],["Anmelden","/login"],["FAQ","/faq"]]],
              ["Unternehmen", [["Über uns","/ueber-uns"],["Kontakt","/ueber-uns"]]],
              ["Rechtliches", [["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]]],
            ].map(([heading, links]) => (
              <div key={heading}>
                <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, marginBottom: 14, fontFamily: FONT }}>
                  {heading}
                </p>
                {links.map(([l, h]) => (
                  <Link key={l} to={h} style={{ display: "block", fontSize: isMobile ? 13 : 14, fontWeight: 300, color: C.mid, textDecoration: "none", fontFamily: FONT, marginBottom: 9, letterSpacing: "-0.01em" }}>
                    {l}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Untere Zeile */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28, borderTop: `1px solid ${C.line}`, flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: C.faint, fontFamily: FONT }}>© 2026 StudioOS</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: C.faint, fontFamily: FONT }}>Made with ♥ in Deutschland</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
