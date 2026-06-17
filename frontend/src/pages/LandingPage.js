import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Search, CalendarCheck, MessageCircle,
  Shield, Zap, Star, CheckCircle, BarChart2, Clock,
  Send, MapPin, ChevronRight, Inbox, SlidersHorizontal,
  ChevronDown, TrendingUp, Calendar
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
   Simple screenshot wrapper
──────────────────────────────────────────────────────────── */
function ScreenshotFrame({ src, alt = "", dark = false, cropBottom = 0 }) {
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: dark
        ? "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
        : "0 32px 72px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.06)",
    }}>
      {/* Chrome bar */}
      <div style={{
        height: 36,
        background: dark ? "#1c1c1e" : "#f4f4f5",
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e4e4e7"}`,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, flexShrink: 0,
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
          <span style={{ fontSize: 9, color: dark ? "rgba(255,255,255,0.25)" : "#a1a1aa", fontFamily: "'Inter',sans-serif" }}>
            app.studio-os.de
          </span>
        </div>
      </div>
      <div style={{ overflow: "hidden", maxHeight: cropBottom ? `calc(100% - ${cropBottom}px)` : undefined }}>
        <img src={src} alt={alt} style={{ width: "100%", display: "block", objectFit: "cover" }} />
      </div>
    </div>
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


/* ─── Shared zinc palette for all mockups ─── */
const Z = {
  950:"#09090b", 900:"#18181b", 800:"#27272a", 700:"#3f3f46", 600:"#52525b",
  500:"#71717a", 400:"#a1a1aa", 300:"#d4d4d8", 200:"#e4e4e7", 100:"#f4f4f5", 50:"#fafafa",
};

/* Mini navbar — matches the real Navbar component exactly */
function MNav({ dark = false }) {
  const bg    = dark ? Z[950] : "#fff";
  const bd    = dark ? "rgba(255,255,255,0.06)" : "#f0f0f0";
  const fg    = dark ? "rgba(255,255,255,0.45)" : Z[500];
  const brand = dark ? "#fff" : Z[950];
  return (
    <div style={{ background: bg, borderBottom: `1px solid ${bd}`, height: 34, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
        <div style={{ width: 15, height: 15, borderRadius: 4, background: brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: dark ? Z[950] : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 4, height: 4, borderRadius: 1, background: brand }} />
          </div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: brand, fontFamily: F.play }}>StudioOS</span>
      </div>
      <span style={{ fontSize: 7.5, color: fg, fontFamily: F.inter, marginRight: 10 }}>Studios finden</span>
      <div style={{ display: "flex", gap: 4 }}>
        <span style={{ fontSize: 7, color: fg, fontFamily: F.inter }}>Anmelden</span>
        <div style={{ background: brand, borderRadius: 20, padding: "2px 7px" }}>
          <span style={{ fontSize: 6.5, fontWeight: 700, color: dark ? Z[950] : "#fff", fontFamily: F.inter }}>Als Studio</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 1 — Search / Discover
──────────────────────────────────────────────────────────── */
const SEARCH_QUERIES = ["Fine Line in Berlin...", "Realism Hamburg...", "Blackwork Frankfurt..."];

function SearchMockup() {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(0);
  const qIdx  = useRef(0);
  const cIdx  = useRef(0);
  const fwd   = useRef(true);
  const timer = useRef(null);

  useEffect(() => {
    function tick() {
      const q = SEARCH_QUERIES[qIdx.current];
      if (fwd.current) {
        cIdx.current = Math.min(cIdx.current + 1, q.length);
        setQuery(q.slice(0, cIdx.current));
        timer.current = setTimeout(tick, cIdx.current === q.length ? 1500 : 50 + Math.random() * 35);
        if (cIdx.current === q.length) fwd.current = false;
      } else {
        cIdx.current = Math.max(cIdx.current - 1, 0);
        setQuery(q.slice(0, cIdx.current));
        timer.current = setTimeout(tick, cIdx.current === 0 ? 300 : 26);
        if (cIdx.current === 0) { fwd.current = true; qIdx.current = (qIdx.current + 1) % SEARCH_QUERIES.length; }
      }
    }
    timer.current = setTimeout(tick, 900);
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const ts = [350, 640, 920].map((d, i) => setTimeout(() => setShown(i + 1), d));
    return () => ts.forEach(clearTimeout);
  }, []);

  const studios = [
    { name:"JohannINK",          city:"Wardenburg", styles:["Fine Line","Realism"],    rating:"5.0", rev:1,   price:"EEE", photo:"https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=300&fit=crop&q=80", verified:true  },
    { name:"Sacred Needles",     city:"Hamburg",    styles:["Traditional","Neo Trad"], rating:"4.8", rev:56,  price:"EEE", col:"#52525b", verified:true  },
    { name:"Blut & Tinte",       city:"Frankfurt",  styles:["Blackwork","Dotwork"],    rating:"4.7", rev:41,  price:"EE",  col:"#71717a", verified:false },
  ];

  return (
    <BrowserFrame>
      <div style={{ background: Z[50] }}>
        <MNav />
        <div style={{ background: "#fff", padding: "14px 16px 12px", borderBottom: `1px solid ${Z[100]}` }}>
          <p style={{ fontSize: 6.5, letterSpacing: "0.22em", textTransform: "uppercase", color: Z[400], fontFamily: F.inter, marginBottom: 5 }}>Tattoo Studios Entdecken</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: Z[950], fontFamily: F.play, lineHeight: 1.1, marginBottom: 10 }}>Dein perfektes<br/>Studio.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${Z[950]}`, borderRadius: 10, padding: "7px 12px", background: "#fff", boxShadow: "0 0 0 3px rgba(9,9,11,0.06)", marginBottom: 8 }}>
            <Search size={11} color={Z[950]} strokeWidth={2} />
            <span style={{ fontSize: 9, color: query ? Z[900] : Z[400], flex: 1, fontFamily: F.inter }}>
              {query || "Studioname, Stil oder Stadt..."}
              {query && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "steps(1)" }}
                  style={{ display: "inline-block", width: 1.5, height: 11, background: Z[900], marginLeft: 1, verticalAlign: "text-bottom" }}
                />
              )}
            </span>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {["Stadt","Stil","Preis","Bewertung","Verfugbarkeit"].map(label => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3.5px 9px", borderRadius: 20, border: `1px solid ${Z[200]}`, background: "#fff" }}>
                <span style={{ fontSize: 7.5, color: Z[600], fontFamily: F.inter, fontWeight: 500 }}>{label}</span>
                <ChevronDown size={8} color={Z[400]} strokeWidth={2} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3.5px 9px", borderRadius: 20, border: `1px solid ${Z[200]}`, background: "#fff" }}>
              <SlidersHorizontal size={8} color={Z[600]} strokeWidth={2} />
              <span style={{ fontSize: 7.5, color: Z[600], fontFamily: F.inter, fontWeight: 500 }}>Alle Filter</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: 8, color: Z[500], fontFamily: F.inter }}>
              <strong style={{ color: Z[900], fontWeight: 700 }}>3</strong> Studios gefunden
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={8} color={Z[400]} strokeWidth={1.5} />
              <span style={{ fontSize: 7.5, color: Z[400], fontFamily: F.inter }}>Deutschland</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {studios.map((s, i) => (
              <motion.div key={s.name}
                initial={{ opacity: 0, y: 10 }}
                animate={shown > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.38, ease: [0.22,1,0.36,1] }}
                style={{ background: "#fff", borderRadius: 13, border: i === 0 ? `1.5px solid ${Z[950]}` : `1px solid ${Z[200]}`, boxShadow: i === 0 ? "0 2px 14px rgba(9,9,11,0.08)" : "0 1px 5px rgba(0,0,0,0.04)", display: "flex", overflow: "hidden" }}
              >
                <div style={{ width: 58, flexShrink: 0, position: "relative", overflow: "hidden", background: s.photo ? "transparent" : `linear-gradient(150deg, ${s.col} 0%, ${Z[400]} 100%)` }}>
                  {s.photo && <img src={s.photo} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  {i === 0 && (
                    <div style={{ position: "absolute", top: 5, left: 4, background: "rgba(9,9,11,0.82)", borderRadius: 4, padding: "1.5px 4px" }}>
                      <span style={{ fontSize: 5.5, color: "#fff", fontFamily: F.inter, fontWeight: 700 }}>Verifiziert</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: Z[900], fontFamily: F.play, lineHeight: 1.2 }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: 4 }}>
                      <Star size={8} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 8, fontWeight: 700, color: Z[900], fontFamily: F.inter }}>{s.rating}</span>
                      <span style={{ fontSize: 7, color: Z[400], fontFamily: F.inter }}>· {s.rev}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <MapPin size={7} color={Z[400]} strokeWidth={1.5} />
                      <span style={{ fontSize: 7.5, color: Z[500], fontFamily: F.inter }}>{s.city}</span>
                    </div>
                    <span style={{ color: Z[300], fontSize: 9 }}>·</span>
                    <span style={{ fontSize: 7.5, color: Z[500], fontFamily: F.inter }}>{s.price}</span>
                    {s.verified && (
                      <><span style={{ color: Z[300], fontSize: 9 }}>·</span>
                        <CheckCircle size={7} color="#3b82f6" fill="#3b82f6" />
                        <span style={{ fontSize: 7, color: "#3b82f6", fontFamily: F.inter }}>Verifiziert</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.styles.map(st => (
                        <span key={st} style={{ fontSize: 6.5, padding: "1.5px 6px", borderRadius: 20, background: Z[100], color: Z[600], fontFamily: F.inter, fontWeight: 500, border: `1px solid ${Z[200]}` }}>{st}</span>
                      ))}
                    </div>
                    <div style={{ padding: "3px 8px", borderRadius: 7, background: i === 0 ? Z[950] : Z[100], flexShrink: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 600, color: i === 0 ? "#fff" : Z[600], fontFamily: F.inter }}>Termin anfragen</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 2 — Studio Profile + Booking sidebar
──────────────────────────────────────────────────────────── */
const CAL_WEEKS_DATA = [
  [null,null,1,2,3,4,5],
  [6,7,8,9,10,11,12],
  [13,14,15,16,17,18,19],
  [20,21,22,23,24,25,26],
  [27,28,29,30,null,null,null],
];
const DAY_AV  = {2:"t",3:"t",4:"t",5:"t",6:"t",7:"t",8:"t",9:"t",10:"t",11:"t",12:"y",13:"y",14:"t",15:"t",16:"r",17:"r",18:"t",19:"t",20:"t",21:"y",22:"t",23:"t",24:"t",25:"t",26:"y",27:"t",28:"t",29:"t",30:"y"};
const AV_COL  = { t:"#2dd4bf", y:"#facc15", r:"#fb7185" };
const CAL_HDR = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const SEL_CYC = [22,24,18,27,20];

function BookingMockup() {
  const [selDay,  setSelDay]  = useState(22);
  const [sizeIdx, setSizeIdx] = useState(2);
  const sizes = ["Mini","Small","Medium","Large","XL"];
  const weekdays = ["Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di"];

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % SEL_CYC.length; setSelDay(SEL_CYC[i]); }, 1800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let si = 2;
    const iv = setInterval(() => { si = (si + 1) % 5; setSizeIdx(si); }, 2200);
    return () => clearInterval(iv);
  }, []);

  const STUDIO_TABS   = ["Uber uns","Artists","Fotos","Bewertungen"];
  const STUDIO_STYLES = ["Fine Line","Realism","Blackwork","Minimalist"];

  return (
    <BrowserFrame>
      <div style={{ background: Z[50] }}>
        <MNav />
        <div style={{ background: "#fff", padding: "10px 14px 0", borderBottom: `1px solid ${Z[100]}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 4, height: 70, marginBottom: 10, overflow: "hidden", borderRadius: 8 }}>
            <div style={{ background: `linear-gradient(140deg, ${Z[800]}, ${Z[500]})` }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ flex: 1, background: `linear-gradient(140deg, ${Z[600]}, ${Z[400]})` }} />
              <div style={{ flex: 1, background: `linear-gradient(140deg, ${Z[700]}, ${Z[500]})` }} />
            </div>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: Z[950], fontFamily: F.play, lineHeight: 1.1, marginBottom: 3 }}>Noir Tattoo Berlin</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
            <Star size={8} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontSize: 8, fontWeight: 700, color: Z[900], fontFamily: F.inter }}>4.9</span>
            <span style={{ fontSize: 7, color: Z[400], fontFamily: F.inter }}>· 82 Bew.</span>
            <span style={{ color: Z[300] }}>·</span>
            <CheckCircle size={7} color="#3b82f6" fill="#3b82f6" />
            <span style={{ fontSize: 7, color: "#3b82f6", fontFamily: F.inter }}>Verifiziert</span>
            <span style={{ color: Z[300] }}>·</span>
            <MapPin size={7} color={Z[400]} strokeWidth={1.5} />
            <span style={{ fontSize: 7, color: Z[500], fontFamily: F.inter }}>Berlin Mitte</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            {STUDIO_STYLES.map(s => (
              <span key={s} style={{ fontSize: 6.5, padding: "2px 7px", borderRadius: 20, background: Z[50], border: `1px solid ${Z[200]}`, color: Z[600], fontFamily: F.inter }}>{s}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {STUDIO_TABS.map((t, i) => (
              <div key={t} style={{ padding: "4px 9px", borderRadius: "8px 8px 0 0", background: i === 0 ? Z[950] : "transparent" }}>
                <span style={{ fontSize: 7.5, fontWeight: 500, color: i === 0 ? "#fff" : Z[500], fontFamily: F.inter }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 144px", gap: 8, padding: "10px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${Z[100]}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "8px 10px" }}>
              <p style={{ fontSize: 7, color: Z[600], fontFamily: F.inter, lineHeight: 1.55 }}>
                Willkommen bei Noir Tattoo Berlin. Wir spezialisieren uns auf Fine Line, Realism und Blackwork. Unser Team schafft Kunstwerke, die ein Leben lang halten.
              </p>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${Z[100]}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "8px 10px" }}>
              <p style={{ fontSize: 6.5, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: F.inter, fontWeight: 600, marginBottom: 6 }}>Stile</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["Fine Line","Realism","Blackwork","Dotwork","Minimalist","Geometric"].map(s => (
                  <span key={s} style={{ fontSize: 6.5, padding: "2px 7px", borderRadius: 20, background: Z[50], border: `1px solid ${Z[200]}`, color: Z[600], fontFamily: F.inter }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${Z[100]}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "8px 10px" }}>
              <p style={{ fontSize: 6.5, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: F.inter, fontWeight: 600, marginBottom: 6 }}>Kontakt</p>
              {["Rosenthaler Str. 12, Berlin","Di-Sa · 10:00 - 19:00","noirinktattoo.de"].map(val => (
                <div key={val} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <MapPin size={7} color={Z[400]} strokeWidth={1.5} />
                  <span style={{ fontSize: 7, color: Z[600], fontFamily: F.inter }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${Z[200]}`, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", padding: "8px", display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: Z[950], fontFamily: F.play }}>Termin anfragen</p>
            <div>
              <p style={{ fontSize: 5.5, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: F.inter, fontWeight: 600, marginBottom: 4 }}>Grosse</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {sizes.map((s, i) => (
                  <motion.div key={s}
                    animate={i === sizeIdx ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    style={{ padding: "2px 5px", borderRadius: 6, background: i === sizeIdx ? Z[950] : Z[50], border: `1px solid ${i === sizeIdx ? Z[950] : Z[200]}` }}
                  >
                    <span style={{ fontSize: 6, fontWeight: i === sizeIdx ? 700 : 400, color: i === sizeIdx ? "#fff" : Z[600], fontFamily: F.inter }}>{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 5.5, letterSpacing: "0.15em", textTransform: "uppercase", color: Z[400], fontFamily: F.inter, fontWeight: 600, marginBottom: 4 }}>Wunschdatum</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 6.5, color: Z[400] }}>&#8249;</span>
                <span style={{ fontSize: 7, fontWeight: 600, color: Z[900], fontFamily: F.inter }}>Juni 2026</span>
                <span style={{ fontSize: 6.5, color: Z[400] }}>&#8250;</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
                {CAL_HDR.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 5, color: Z[400], fontWeight: 600, paddingBottom: 2 }}>{d}</div>
                ))}
              </div>
              {CAL_WEEKS_DATA.map((wk, wi) => (
                <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 1 }}>
                  {wk.map((day, di) => {
                    if (!day) return <div key={di} />;
                    const isSel = day === selDay;
                    const av    = DAY_AV[day];
                    return (
                      <motion.div key={di}
                        animate={isSel ? { scale: 1.18 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0", borderRadius: 5, background: isSel ? Z[950] : "transparent" }}
                      >
                        <span style={{ fontSize: 6.5, color: isSel ? "#fff" : Z[700], fontWeight: isSel ? 700 : 400, lineHeight: 1 }}>{day}</span>
                        {av && <div style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: isSel ? "#fff" : AV_COL[av], marginTop: 1 }} />}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 3 }}>
                {[["#2dd4bf","Frei"],["#facc15","Begrenzt"],["#fb7185","Voll"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 5.5, color: Z[400], fontFamily: F.inter }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selDay}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "4px 6px", borderRadius: 7, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <p style={{ fontSize: 6.5, fontWeight: 600, color: "#15803d", fontFamily: F.inter }}>
                  {weekdays[(selDay - 1) % 7]}, {selDay}. Juni 2026
                </p>
                <p style={{ fontSize: 5.5, color: "#16a34a", fontFamily: F.inter }}>Gut verfugbar</p>
              </motion.div>
            </AnimatePresence>
            <div style={{ padding: "4px 6px", borderRadius: 7, border: `1px solid ${Z[200]}`, background: Z[50], height: 24 }}>
              <span style={{ fontSize: 6.5, color: Z[400], fontFamily: F.inter }}>Motiv beschreiben...</span>
            </div>
            <div style={{ padding: "4px 6px", borderRadius: 7, border: `1px solid ${Z[200]}`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 7, fontWeight: 600, color: Z[900], fontFamily: F.inter }}>EUR 50</span>
              <span style={{ fontSize: 6, color: "#22c55e", fontWeight: 600, fontFamily: F.inter }}>Stripe</span>
            </div>
            <div style={{ padding: "7px 0", background: Z[950], borderRadius: 9, textAlign: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: F.inter }}>Anfrage absenden</span>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ────────────────────────────────────────────────────────────
   MOCKUP 3 — Messages / Chat
──────────────────────────────────────────────────────────── */
function TypingDot({ delay }) {
  return (
    <motion.div
      style={{ width: 4, height: 4, borderRadius: "50%", background: Z[400] }}
      animate={{ y: [0,-4,0] }}
      transition={{ duration: 0.65, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function ChatMockup() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let active = true;
    async function run() {
      while (active) {
        await new Promise(r => setTimeout(r, 1800)); if (!active) break; setPhase(1);
        await new Promise(r => setTimeout(r, 1800)); if (!active) break; setPhase(2);
        await new Promise(r => setTimeout(r, 1600)); if (!active) break; setPhase(3);
        await new Promise(r => setTimeout(r, 3500)); if (!active) break; setPhase(0);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    run();
    return () => { active = false; };
  }, []);

  const avBg = (name) => {
    const cs = ["#7c3aed","#0369a1","#0f766e","#b45309","#be185d","#1d4ed8"];
    let h = 0; for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
    return cs[Math.abs(h) % cs.length];
  };

  const baseMsgs = [
    { from:"studio", text:"Hallo! Dein Motiv klingt super, sehr gute Wahl." },
    { from:"me",     text:"Wie lang dauert die Session ungefahr?" },
    { from:"studio", text:"Ca. 2,5 Stunden. Ich schicke dir gleich einen Terminvorschlag." },
  ];
  const extraMsg = { from:"studio", text:"Schau mal, ich habe einen Termin fur dich!" };

  const AvatarBubble = ({ name, sz = 18 }) => (
    <div style={{ width: sz, height: sz, borderRadius: "50%", background: avBg(name), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: sz * 0.37, fontWeight: 700, color: "#fff", fontFamily: F.inter }}>{name.split(" ").slice(0,2).map(w=>w[0]).join("")}</span>
    </div>
  );

  return (
    <BrowserFrame>
      <div style={{ display: "flex", height: 420, background: "#fff" }}>
        <div style={{ width: 152, borderRight: `1px solid ${Z[100]}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "9px 12px", borderBottom: `1px solid ${Z[100]}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: Z[900], fontFamily: F.play }}>Nachrichten</span>
          </div>
          {[
            { name:"Noir Tattoo Berlin", preview:"Ich schicke dir gleich...", time:"12:34", unread:1, active:true  },
            { name:"Sacred Needles",     preview:"Termin bestatigt!",         time:"Di",   unread:0, active:false },
          ].map(c => (
            <div key={c.name} style={{ padding: "8px 10px", borderBottom: `1px solid ${Z[50]}`, background: c.active ? Z[100] : "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ position: "relative" }}>
                  <AvatarBubble name={c.name} sz={28} />
                  {c.active && <span style={{ position:"absolute", bottom:-1, right:-1, width:8, height:8, borderRadius:"50%", background:"#22c55e", border:"1.5px solid #fff" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                    <span style={{ fontSize: 8, fontWeight: c.unread ? 700 : 600, color: Z[900], fontFamily: F.inter, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: 68 }}>{c.name}</span>
                    <span style={{ fontSize: 7, color: Z[400], fontFamily: F.inter, flexShrink: 0 }}>{c.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 7.5, color: c.unread ? Z[600] : Z[400], fontFamily: F.inter, fontWeight: c.unread ? 500 : 400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: 72 }}>{c.preview}</span>
                    {c.unread > 0 && (
                      <span style={{ minWidth:14, height:14, padding:"0 3px", borderRadius:7, background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:7, color:"#fff", fontWeight:700, fontFamily: F.inter }}>{c.unread}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(249,249,249,1)" }}>
          <div style={{ padding: "8px 12px", background: "#fff", borderBottom: `1px solid ${Z[100]}`, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <AvatarBubble name="Noir Tattoo Berlin" sz={28} />
              <span style={{ position:"absolute", bottom:0, right:0, width:8, height:8, borderRadius:"50%", background:"#22c55e", border:"1.5px solid #fff" }} />
            </div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, color: Z[900], fontFamily: F.inter, lineHeight: 1 }}>Noir Tattoo Berlin</p>
              <AnimatePresence mode="wait">
                {phase === 1 ? (
                  <motion.p key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 7, color: "#22c55e", fontFamily: F.inter, fontWeight: 500 }}>tippt...</motion.p>
                ) : (
                  <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 7, color: "#22c55e", fontFamily: F.inter }}>Online</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5, overflow: "hidden" }}>
            {baseMsgs.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.25 }}
                style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 5 }}>
                {m.from !== "me" && <AvatarBubble name="NT" sz={18} />}
                <div style={{ maxWidth: "70%", padding: "6px 9px", borderRadius: m.from === "me" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.from === "me" ? Z[950] : "#fff", border: m.from === "me" ? "none" : `1px solid ${Z[100]}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <p style={{ fontSize: 8, color: m.from === "me" ? "#fff" : Z[900], fontFamily: F.inter, lineHeight: 1.5, margin: 0 }}>{m.text}</p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, marginTop: 2, alignItems: "center" }}>
                    <span style={{ fontSize: 6.5, color: m.from === "me" ? "rgba(255,255,255,0.38)" : Z[400], fontFamily: F.inter }}>12:3{i}</span>
                    {m.from === "me" && <CheckCircle size={8} color="rgba(255,255,255,0.38)" />}
                  </div>
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {phase >= 2 && (
                <motion.div key="extra" initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                  <AvatarBubble name="NT" sz={18} />
                  <div style={{ maxWidth: "70%", padding: "6px 9px", borderRadius: "12px 12px 12px 2px", background: "#fff", border: `1px solid ${Z[100]}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <p style={{ fontSize: 8, color: Z[900], fontFamily: F.inter, lineHeight: 1.5, margin: 0 }}>{extraMsg.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === 1 && (
                <motion.div key="dots" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                  <AvatarBubble name="NT" sz={18} />
                  <div style={{ display: "flex", gap: 3, padding: "7px 10px", background: "#fff", borderRadius: "12px 12px 12px 2px", border: `1px solid ${Z[100]}` }}>
                    <TypingDot delay={0} /><TypingDot delay={0.15} /><TypingDot delay={0.3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase >= 3 && (
                <motion.div key="slot" initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22,1,0.36,1] }}
                  style={{ marginLeft: 23 }}>
                  <div style={{ width: 185, borderRadius: 12, overflow: "hidden", border: `1px solid ${Z[100]}`, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <div style={{ padding: "7px 10px", borderBottom: `1px solid ${Z[100]}`, display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: Z[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Calendar size={11} color={Z[600]} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{ fontSize: 8, fontWeight: 600, color: Z[900], fontFamily: F.inter, lineHeight: 1 }}>Terminvorschlag</p>
                        <p style={{ fontSize: 7, color: Z[400], fontFamily: F.inter }}>Mittwoch, 22. Juni 2026</p>
                      </div>
                    </div>
                    <div style={{ padding: "7px 10px 4px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: Z[900], fontFamily: F.inter, marginBottom: 1 }}>14:00 - 16:30</p>
                      <p style={{ fontSize: 7, color: Z[500], fontFamily: F.inter, marginBottom: 6 }}>Tattoo-Session</p>
                      <div style={{ padding: "5px 0", background: Z[950], borderRadius: 8, textAlign: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: F.inter }}>Jetzt buchen</span>
                      </div>
                      <p style={{ fontSize: 6.5, color: Z[400], fontFamily: F.inter }}>12:36</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ padding: "7px 10px", borderTop: `1px solid ${Z[100]}`, display: "flex", gap: 6, alignItems: "center", background: "#fff", flexShrink: 0 }}>
            <div style={{ flex: 1, padding: "5px 10px", borderRadius: 20, background: Z[100], fontSize: 8, color: Z[400], fontFamily: F.inter }}>
              Nachricht schreiben...
            </div>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: Z[950], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={10} color="#fff" strokeWidth={2} />
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
  const targets = [12, 3, 8, 24];
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const start = Date.now();
    const dur   = 1100;
    let raf;
    const frame = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCounts(targets.map(t => Math.round(t * e)));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const navItems = [
    { icon: BarChart2,     label:"Ubersicht",   active:true,  badge:0 },
    { icon: Inbox,         label:"Anfragen",    active:false, badge:2 },
    { icon: CalendarCheck, label:"Kalender",    active:false, badge:0 },
    { icon: MessageCircle, label:"Nachrichten", active:false, badge:0 },
    { icon: Clock,         label:"Rechnungen",  active:false, badge:0 },
  ];
  const stats = [
    { label:"Buchungen",     icon:Calendar    },
    { label:"Ausstehend",    icon:Clock       },
    { label:"Bestatigt",     icon:CheckCircle },
    { label:"Abgeschlossen", icon:TrendingUp  },
  ];
  const bookings = [
    { name:"Lena M.",  date:"22. Juni", style:"Fine Line", status:"confirmed", amount:"EUR 50" },
    { name:"Jonas K.", date:"24. Juni", style:"Realism",   status:"pending",   amount:"EUR 80" },
    { name:"Sara B.",  date:"27. Juni", style:"Blackwork", status:"confirmed", amount:"EUR 60" },
  ];
  const stSt = {
    confirmed:{ bg:"#dcfce7", color:"#16a34a", label:"Bestatigt" },
    pending:  { bg:"#fef9c3", color:"#a16207", label:"Ausstehend" },
  };
  const avColors = ["#7c3aed","#0369a1","#0f766e"];

  return (
    <BrowserFrame dark>
      <div style={{ display: "flex", minHeight: 400, background: Z[50] }}>
        <div style={{ width: 118, flexShrink: 0, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ borderRadius: 12, background: Z[950], padding: "8px", position: "relative", overflow: "hidden" }}>
            <motion.div
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }}
              animate={{ x: ["-100%","200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
            />
            <p style={{ fontSize: 5.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", fontFamily: F.inter, marginBottom: 3 }}>Studio Dashboard</p>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", fontFamily: F.play, lineHeight: 1.1, marginBottom: 1 }}>Noir Tattoo<br/>Berlin</p>
            <p style={{ fontSize: 6, color: "rgba(255,255,255,0.4)", fontFamily: F.inter, marginBottom: 5 }}>● Verifiziert</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              {[["12","Buchungen"],["3","Ausstehend"]].map(([v,l]) => (
                <div key={l} style={{ borderRadius: 7, padding: 4, background: "rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: F.play, lineHeight: 1 }}>{v}</p>
                  <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.35)", fontFamily: F.inter, marginTop: 1 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 12, background: "#fff", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: 4 }}>
            {navItems.map(({ icon: Icon, label, active, badge }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 6px", borderRadius: 8, background: active ? Z[950] : "transparent", marginBottom: 1 }}>
                <Icon size={10} color={active ? "#fff" : Z[400]} strokeWidth={1.5} />
                <span style={{ flex: 1, fontSize: 7, fontWeight: 500, color: active ? "#fff" : Z[500], fontFamily: F.inter }}>{label}</span>
                {badge > 0 && (
                  <span style={{ minWidth:14, height:14, borderRadius:7, background: active ? "rgba(255,255,255,0.2)" : Z[950], display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                    <span style={{ fontSize: 6.5, color: "#fff", fontWeight: 700 }}>{badge}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 12, border: "1px solid #ede9fe", background: "linear-gradient(135deg,#f5f3ff,#fff)", padding: "6px 7px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={7} color="#7c3aed" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 6, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F.inter }}>Beta</span>
            </div>
            <p style={{ fontSize: 6.5, color: Z[600], fontFamily: F.inter, lineHeight: 1.45 }}>Alle Features kostenlos in der Beta-Phase.</p>
          </div>
        </div>

        <div style={{ flex: 1, padding: "10px 10px", overflow: "hidden" }}>
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: Z[950], fontFamily: F.play, marginBottom: 1 }}>Ubersicht</p>
            <p style={{ fontSize: 7.5, color: Z[400], fontFamily: F.inter }}>Juni 2026</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
            {stats.map(({ label, icon: Icon }, idx) => (
              <div key={label} style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "6px 8px" }}>
                <Icon size={10} color={Z[400]} strokeWidth={1.5} style={{ marginBottom: 4 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: Z[900], fontFamily: F.play, lineHeight: 1 }}>{counts[idx]}</p>
                <p style={{ fontSize: 6.5, color: Z[500], fontFamily: F.inter, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ background: Z[950], borderRadius: 12, padding: "8px 10px", marginBottom: 8, position: "relative", overflow: "hidden" }}>
            <motion.div
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }}
              animate={{ x: ["-100%","200%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 18, height: 18, borderRadius: 6, background: Z[800], display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={9} color="#fff" strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: 7.5, fontWeight: 600, color: "#fff", fontFamily: F.inter }}>Umsatz & Zahlungen</span>
              </div>
              <span style={{ fontSize: 6, color: "rgba(255,255,255,0.3)", fontFamily: F.inter, background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 20 }}>Live</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: F.play, textAlign: "center", marginBottom: 1 }}>Euro 3.480,00</p>
            <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.28)", fontFamily: F.inter, textAlign: "center", marginBottom: 6 }}>abgeschlossene Termine</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              {[["Bar","1.200"],["Stripe","2.280"],["Gesamt","3.480"]].map(([l,v], i) => (
                <div key={l} style={{ borderRadius: 8, padding: "5px 6px", background: i === 2 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 5.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: F.inter, fontWeight: 600, marginBottom: 2 }}>{l}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: F.play }}>Euro {v}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "6px 10px", borderBottom: `1px solid ${Z[100]}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 7.5, fontWeight: 600, color: Z[900], fontFamily: F.inter }}>Heutige Termine</span>
              <span style={{ fontSize: 6.5, color: Z[400], fontFamily: F.inter }}>3 Buchungen</span>
            </div>
            {bookings.map((b, i) => {
              const st = stSt[b.status];
              return (
                <motion.div key={b.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.1, duration: 0.3, ease: [0.22,1,0.36,1] }}
                  style={{ padding: "5px 10px", borderBottom: i < 2 ? `1px solid ${Z[50]}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: avColors[i], display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 6.5, fontWeight: 700, color: "#fff", fontFamily: F.inter }}>{b.name[0]}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 7.5, fontWeight: 600, color: Z[900], fontFamily: F.inter }}>{b.name}</p>
                      <p style={{ fontSize: 6.5, color: Z[400], fontFamily: F.inter }}>{b.date} · {b.style}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 7, fontWeight: 700, color: Z[900], fontFamily: F.inter }}>{b.amount}</span>
                    <span style={{ fontSize: 6.5, padding: "2px 5px", borderRadius: 20, background: st.bg, color: st.color, fontFamily: F.inter, fontWeight: 600 }}>{st.label}</span>
                  </div>
                </motion.div>
              );
            })}
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

            {/* Hero mockup — animated search UI */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
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
                <ScreenshotFrame src="/screens/mockup-buchung.png" alt="Buchungsformular" />
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
                <ScreenshotFrame src="/screens/mockup-dashboard.png" alt="Studio Dashboard" dark />
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
