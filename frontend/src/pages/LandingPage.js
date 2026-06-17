import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Star, MapPin, Check, Calendar, Zap, Shield, BarChart2 } from "lucide-react";
import SplashScreen from "../components/SplashScreen";

const FONT  = "'Outfit', sans-serif";
const BLACK = "#09090b";
const WHITE = "#fff";

/* ─────────────────────────────────────────────────
   FadeIn
───────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, style }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div ref={ref} style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ─────────────────────────────────────────────────
   MacBook 3-D — öffnet sich, zeigt StudioOS-Logo
───────────────────────────────────────────────── */
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
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, []);

  const W      = 420;   /* Laptop-Breite          */
  const H_LID  = 260;   /* Deckel-Höhe            */
  const H_BASE = 17;    /* Boden-Dicke (Tastatur) */
  const BEZEL  = 12;    /* Displayrand            */

  return (
    <div style={{
      perspective:       1300,
      perspectiveOrigin: "50% 140%",
      width:  W + 100,
      height: H_LID + H_BASE + 80,
      display:        "flex",
      alignItems:     "flex-end",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      {/* Macbook-Körper (preserve-3d + leichte Neigung) */}
      <div style={{ position:"relative", width:W, transform:"rotateX(22deg)", transformStyle:"preserve-3d" }}>

        {/* ── DECKEL ─────────────────────────────────── */}
        <motion.div
          initial={{ rotateX: -112 }}
          animate={{ rotateX: open ? -16 : -112 }}
          transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position:        "absolute",
            bottom:          H_BASE,
            width:           W,
            height:          H_LID,
            transformOrigin: "bottom center",
            transformStyle:  "preserve-3d",
            borderRadius:    "14px 14px 4px 4px",
            background:      "linear-gradient(170deg, #d4d4d4, #b8b8b8)",
            boxShadow:       "inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* Displayrahmen (innen) */}
          <div style={{
            position:     "absolute",
            inset:        BEZEL,
            borderRadius: "8px 8px 4px 4px",
            background:   "#141414",
            overflow:     "hidden",
          }}>
            {/* Bildschirm-Inhalt */}
            <motion.div
              animate={{ opacity: screenOn ? 1 : 0, background: screenOn ? "#f8f9fa" : "#000" }}
              transition={{ duration: 0.55 }}
              style={{
                position:       "absolute",
                inset:          3,
                borderRadius:   6,
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                gap:            10,
                overflow:       "hidden",
              }}
            >
              {/* ─ Fake Desktop-Menüleiste ─ */}
              <div style={{
                position:    "absolute",
                top:0, left:0, right:0,
                height:      14,
                background:  "rgba(0,0,0,0.06)",
                display:     "flex",
                alignItems:  "center",
                padding:     "0 8px",
                gap:         6,
                borderBottom:"1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff5f57" }} />
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#febc2e" }} />
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#28c840" }} />
                <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
                  {[40,28,36].map((w,i) => (
                    <div key={i} style={{ width:w, height:4, borderRadius:3, background:"rgba(0,0,0,0.12)" }} />
                  ))}
                </div>
              </div>

              {/* ─ StudioOS Logo ─ */}
              <motion.div
                initial={{ opacity:0, scale:0.82 }}
                animate={{ opacity: logoIn ? 1 : 0, scale: logoIn ? 1 : 0.82 }}
                transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
                style={{ textAlign:"center" }}
              >
                <p style={{
                  fontSize:      28,
                  fontWeight:    700,
                  color:         BLACK,
                  fontFamily:    FONT,
                  letterSpacing: "-0.05em",
                  lineHeight:    1,
                  marginBottom:  4,
                }}>
                  Studio<span style={{ color:"rgba(0,0,0,0.22)" }}>OS</span>
                </p>
                <motion.p
                  initial={{ opacity:0 }}
                  animate={{ opacity: logoIn ? 1 : 0 }}
                  transition={{ delay:0.25, duration:0.4 }}
                  style={{ fontSize:8, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(0,0,0,0.32)", fontFamily:FONT }}
                >
                  Das Studio-Betriebssystem
                </motion.p>
              </motion.div>

              {/* ─ Miniatur-App-Vorschau ─ */}
              <motion.div
                initial={{ opacity:0, y:8 }}
                animate={{ opacity: uiIn ? 1 : 0, y: uiIn ? 0 : 8 }}
                transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
                style={{
                  width:          "80%",
                  background:     "#f0f0f0",
                  borderRadius:   7,
                  overflow:       "hidden",
                  border:         "1px solid rgba(0,0,0,0.07)",
                  boxShadow:      "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                {/* Mini Navbar */}
                <div style={{ height:16, background:"#e8e8e8", borderBottom:"1px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", padding:"0 8px", gap:12 }}>
                  <span style={{ fontSize:7, fontWeight:700, color:BLACK, fontFamily:FONT }}>StudioOS</span>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    {["Studios","Anmelden"].map(l => (
                      <span key={l} style={{ fontSize:6, color:"rgba(0,0,0,0.35)", fontFamily:FONT }}>{l}</span>
                    ))}
                  </div>
                </div>
                {/* Mini-Karte */}
                <div style={{ display:"flex", gap:0 }}>
                  <div style={{ width:52, height:48, background:"linear-gradient(135deg,#374151,#111)" }} />
                  <div style={{ flex:1, padding:"6px 8px" }}>
                    <div style={{ fontSize:7.5, fontWeight:700, color:BLACK, fontFamily:FONT, marginBottom:2 }}>JohannINK</div>
                    <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:4 }}>
                      <Star size={6} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize:6, color:"rgba(0,0,0,0.45)", fontFamily:FONT }}>5.0 · Fine Line</span>
                    </div>
                    <div style={{ width:52, height:9, background:BLACK, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:5, color:WHITE, fontFamily:FONT }}>Termin anfragen</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Screen-Glow wenn Logo erscheint */}
              <motion.div
                animate={{ opacity: logoIn ? 0.06 : 0 }}
                transition={{ duration:0.8 }}
                style={{ position:"absolute", inset:-20, background:"radial-gradient(ellipse at 50% 50%, rgba(0,0,200,0.15), transparent 60%)", pointerEvents:"none" }}
              />
            </motion.div>

            {/* Kamera-Punkt */}
            <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#333" }} />
          </div>

          {/* Apple-Logo Andeutung (Rückseite – beim Öffnen kurz sichtbar) */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%) rotateY(180deg) scale(0.9)",
            backfaceVisibility:"visible",
            fontSize:18, color:"rgba(150,150,150,0.25)", userSelect:"none",
          }}>
            
          </div>
        </motion.div>

        {/* ── BASIS / TASTATUR ───────────────────────── */}
        <div style={{
          width:           W,
          height:          H_BASE,
          background:      "linear-gradient(to bottom, #c4c4c4, #b0b0b0)",
          borderRadius:    "0 0 14px 14px",
          position:        "relative",
        }}>
          {/* Scharnier-Linie */}
          <div style={{ position:"absolute", top:0, left:"8%", right:"8%", height:2, background:"rgba(0,0,0,0.12)", borderRadius:"0 0 3px 3px" }} />
          {/* Tastaturbereich */}
          <div style={{ position:"absolute", top:4, left:"7%", right:"7%", bottom:4, background:"rgba(0,0,0,0.06)", borderRadius:4 }}>
            {/* Mini Tasten-Rasterlinien */}
            <div style={{ position:"absolute", inset:3, backgroundImage:"repeating-linear-gradient(90deg,rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 8px)" }} />
          </div>
          {/* Trackpad */}
          <div style={{ position:"absolute", bottom:2, left:"38%", right:"38%", height:5, background:"rgba(0,0,0,0.08)", borderRadius:3 }} />
        </div>

        {/* Schatten */}
        <div style={{
          position:"absolute", bottom:-36,
          left:"5%", right:"5%",
          height:28,
          background:"radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.18), transparent 65%)",
          filter:"blur(12px)",
          pointerEvents:"none",
        }} />

        {/* Screen-Licht auf Tastatur wenn an */}
        <motion.div
          animate={{ opacity: screenOn ? 1 : 0 }}
          transition={{ duration:0.6 }}
          style={{
            position:"absolute", top:-6, left:"10%", right:"10%",
            height:10,
            background:"radial-gradient(ellipse at 50% 100%, rgba(220,230,255,0.25), transparent 70%)",
            filter:"blur(6px)",
            pointerEvents:"none",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Animiertes App-Mockup — 4 Phasen (unverändert)
───────────────────────────────────────────────── */
const PHASE_DUR = 2800;
const Z   = { 950:"#09090b", 900:"#18181b", 700:"#3f3f46", 500:"#71717a", 400:"#a1a1aa", 200:"#e4e4e7", 100:"#f4f4f5", 50:"#fafafa" };
const MF  = "'Outfit', sans-serif";
const TEAL = "#2dd4bf";

function MNav() {
  return (
    <div style={{ height:36, borderBottom:`1px solid ${Z[100]}`, background:"#fff", display:"flex", alignItems:"center", padding:"0 12px", gap:6, flexShrink:0 }}>
      <div style={{ width:14, height:14, borderRadius:3, background:Z[950], display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:2, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:4, height:4, borderRadius:1, background:Z[950] }} />
        </div>
      </div>
      <span style={{ fontSize:9, fontWeight:700, color:Z[950], fontFamily:MF, flex:1, letterSpacing:"-0.02em" }}>StudioOS</span>
      <span style={{ fontSize:7.5, color:Z[400], fontFamily:MF }}>Anmelden</span>
    </div>
  );
}

function PhaseSearch() {
  return (
    <motion.div key="search"
      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }}
      transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:Z[50], padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}
    >
      <p style={{ fontSize:6.5, letterSpacing:"0.22em", textTransform:"uppercase", color:Z[400], fontFamily:MF, marginBottom:2 }}>Tattoo Studios Entdecken</p>
      <p style={{ fontSize:18, fontWeight:700, color:Z[950], fontFamily:MF, lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:6 }}>Dein<br/>perfektes Studio.</p>
      <div style={{ border:`1.5px solid ${Z[950]}`, borderRadius:9, padding:"6px 10px", background:"#fff", display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", border:`1.5px solid ${Z[500]}` }} />
        <span style={{ fontSize:8, color:Z[400], fontFamily:MF, flex:1 }}>Studioname, Stil oder Stadt …</span>
      </div>
      <motion.div
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22, duration:0.45 }}
        style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${Z[950]}`, boxShadow:"0 4px 18px rgba(0,0,0,0.08)", display:"flex", overflow:"hidden" }}
      >
        <div style={{ width:64, flexShrink:0, background:`linear-gradient(145deg, ${Z[950]}, ${Z[700]})`, position:"relative" }}>
          <img src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=200&h=200&fit=crop&q=70"
            alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.75 }}
          />
          <div style={{ position:"absolute", top:5, left:4, background:"rgba(9,9,11,0.85)", borderRadius:3, padding:"1.5px 5px" }}>
            <span style={{ fontSize:5, color:"#fff", fontFamily:MF, fontWeight:700 }}>Verifiziert</span>
          </div>
        </div>
        <div style={{ flex:1, padding:"8px 10px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:2 }}>
            <span style={{ fontSize:10, fontWeight:700, color:Z[950], fontFamily:MF, lineHeight:1.1 }}>JohannINK</span>
            <div style={{ display:"flex", alignItems:"center", gap:2 }}>
              <Star size={8} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize:8, fontWeight:700, color:Z[950], fontFamily:MF }}>5.0</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:6 }}>
            <MapPin size={7} color={Z[400]} strokeWidth={1.5} />
            <span style={{ fontSize:7, color:Z[500], fontFamily:MF }}>Wardenburg</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", gap:3 }}>
              {["Fine Line","Realism"].map(s => (
                <span key={s} style={{ fontSize:6, padding:"1.5px 6px", borderRadius:20, background:Z[100], color:Z[500], fontFamily:MF, border:`1px solid ${Z[200]}` }}>{s}</span>
              ))}
            </div>
            <motion.div
              animate={{ scale:[1,1.06,1] }} transition={{ duration:1.6, repeat:Infinity, delay:0.8 }}
              style={{ padding:"3.5px 9px", borderRadius:7, background:Z[950] }}
            >
              <span style={{ fontSize:7, fontWeight:700, color:"#fff", fontFamily:MF }}>Termin anfragen</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:0.45, y:0 }} transition={{ delay:0.38 }}
        style={{ background:"#fff", borderRadius:10, border:`1px solid ${Z[200]}`, display:"flex", overflow:"hidden", height:48 }}
      >
        <div style={{ width:48, flexShrink:0, background:`linear-gradient(145deg, ${Z[700]}, ${Z[500]})` }} />
        <div style={{ flex:1, padding:"8px 10px" }}>
          <span style={{ fontSize:9, fontWeight:600, color:Z[900], fontFamily:MF }}>Sacred Needles</span>
          <p style={{ fontSize:7, color:Z[400], fontFamily:MF, marginTop:2 }}>Hamburg · Traditional</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CAL = [[null,1,2,3,4,5,6],[7,8,9,10,11,12,13],[14,15,16,17,18,19,20],[21,22,23,24,25,26,27],[28,29,30,null,null,null,null]];
const AV  = {1:"t",2:"t",3:"t",4:"y",5:"t",8:"t",9:"t",10:"r",11:"t",14:"t",15:"t",17:"t",18:"y",21:"t",22:"t",23:"y",24:"t",25:"r",28:"t",29:"t",30:"y"};
const AC  = { t:TEAL, y:"#facc15", r:"#fb7185" };
const HDR = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const WDAY = ["So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di"];

function PhaseCalendar() {
  const [sel, setSel] = useState(null);
  useEffect(() => {
    const days=[15,22,18]; let i=0;
    const iv = setInterval(() => { setSel(days[i%days.length]); i++; }, 700);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div key="cal"
      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }}
      transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:"#fff", padding:"10px 12px", overflow:"hidden" }}
    >
      <p style={{ fontSize:9, fontWeight:700, color:Z[950], fontFamily:MF, marginBottom:6, letterSpacing:"-0.02em" }}>Termin anfragen</p>
      <p style={{ fontSize:6, letterSpacing:"0.15em", textTransform:"uppercase", color:Z[400], fontFamily:MF, fontWeight:600, marginBottom:5 }}>Wunschdatum</p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:6, color:Z[400] }}>‹</span>
        <span style={{ fontSize:7.5, fontWeight:600, color:Z[900], fontFamily:MF }}>Juni 2026</span>
        <span style={{ fontSize:6, color:Z[400] }}>›</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:2 }}>
        {HDR.map(d => <div key={d} style={{ textAlign:"center", fontSize:5, color:Z[400], fontWeight:600, paddingBottom:3 }}>{d}</div>)}
      </div>
      {CAL.map((wk, wi) => (
        <div key={wi} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:1 }}>
          {wk.map((d, di) => {
            if (!d) return <div key={di} />;
            const isSel=d===sel, av=AV[d];
            return (
              <motion.div key={di}
                animate={isSel ? { scale:1.2 } : { scale:1 }}
                transition={{ type:"spring", stiffness:500, damping:24 }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5px 0", borderRadius:4, background:isSel?Z[950]:"transparent" }}
              >
                <span style={{ fontSize:6.5, color:isSel?"#fff":Z[700], fontWeight:isSel?700:400, lineHeight:1 }}>{d}</span>
                {av && <div style={{ width:2.5, height:2.5, borderRadius:"50%", background:isSel?"#fff":AC[av], marginTop:1 }} />}
              </motion.div>
            );
          })}
        </div>
      ))}
      <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:5 }}>
        {[[TEAL,"Verfügbar"],["#facc15","Begrenzt"],["#fb7185","Voll"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:2 }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:c }} />
            <span style={{ fontSize:5.5, color:Z[400], fontFamily:MF }}>{l}</span>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div key={sel}
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ marginTop:7, padding:"5px 8px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0" }}
          >
            <p style={{ fontSize:7, fontWeight:600, color:"#15803d", fontFamily:MF }}>{WDAY[sel-1]}, {sel}. Juni 2026</p>
            <p style={{ fontSize:6, color:"#16a34a", fontFamily:MF }}>Gut verfügbar</p>
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
    let i=1;
    const iv = setInterval(() => { i=(i+1)%5; setSizeIdx(i); }, 650);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div key="form"
      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }}
      transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:"#fff", padding:"10px 12px", display:"flex", flexDirection:"column", gap:7, overflow:"hidden" }}
    >
      <p style={{ fontSize:9, fontWeight:700, color:Z[950], fontFamily:MF, letterSpacing:"-0.02em" }}>Termin anfragen</p>
      <div>
        <p style={{ fontSize:6, letterSpacing:"0.15em", textTransform:"uppercase", color:Z[400], fontFamily:MF, fontWeight:600, marginBottom:4 }}>Terminart</p>
        <div style={{ display:"flex", gap:4 }}>
          {["Beratung","Tattoo"].map((t,i) => (
            <div key={t} style={{ flex:1, padding:"4px 0", textAlign:"center", borderRadius:7, border:`1px solid ${i===1?Z[950]:Z[200]}`, background:i===1?Z[950]:"#fff" }}>
              <span style={{ fontSize:7.5, fontWeight:i===1?700:400, color:i===1?"#fff":Z[500], fontFamily:MF }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize:6, letterSpacing:"0.15em", textTransform:"uppercase", color:Z[400], fontFamily:MF, fontWeight:600, marginBottom:4 }}>Tattoo-Größe</p>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {sizes.map((s,i) => (
            <motion.div key={s}
              animate={i===sizeIdx?{scale:1.02,x:1}:{scale:1,x:0}}
              transition={{ type:"spring", stiffness:400, damping:22 }}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${i===sizeIdx?Z[950]:Z[100]}`, background:i===sizeIdx?Z[950]:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}
            >
              <span style={{ fontSize:7.5, fontWeight:i===sizeIdx?700:400, color:i===sizeIdx?"#fff":Z[600], fontFamily:MF }}>{s}</span>
              <span style={{ fontSize:6, color:i===sizeIdx?"rgba(255,255,255,0.4)":Z[400], fontFamily:MF }}>{[1,2,3,5,8][i]} Pkt.</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3 }}
        style={{ padding:"5px 8px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", gap:6 }}
      >
        <Calendar size={10} color="#16a34a" strokeWidth={1.5} />
        <span style={{ fontSize:7.5, fontWeight:600, color:"#15803d", fontFamily:MF }}>Mi, 22. Juni 2026</span>
      </motion.div>
    </motion.div>
  );
}

function PhaseSuccess() {
  return (
    <motion.div key="success"
      initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.94 }}
      transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 14px", gap:10 }}
    >
      <motion.div
        initial={{ scale:0, rotate:-30 }} animate={{ scale:1, rotate:0 }}
        transition={{ type:"spring", stiffness:300, damping:18, delay:0.15 }}
        style={{ width:54, height:54, borderRadius:"50%", background:Z[950], display:"flex", alignItems:"center", justifyContent:"center" }}
      >
        <Check size={24} color="#fff" strokeWidth={2.5} />
      </motion.div>
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }} style={{ textAlign:"center" }}>
        <p style={{ fontSize:13, fontWeight:700, color:Z[950], fontFamily:MF, marginBottom:5, letterSpacing:"-0.03em" }}>Termin angefragt!</p>
        <p style={{ fontSize:7.5, color:Z[500], fontFamily:MF, lineHeight:1.55 }}>JohannINK bestätigt deinen<br/>Termin in Kürze.</p>
      </motion.div>
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
        style={{ width:"100%", padding:"8px 10px", borderRadius:10, border:`1px solid ${Z[100]}`, background:Z[50] }}
      >
        {[["Studio","JohannINK"],["Datum","Mi, 22. Juni 2026"],["Größe","Small · 2 Punkte"],["Anzahlung","€ 50 bezahlt"]].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:7, color:Z[400], fontFamily:MF }}>{l}</span>
            <span style={{ fontSize:7, fontWeight:600, color:Z[700], fontFamily:MF }}>{v}</span>
          </div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
        style={{ padding:"6px 16px", borderRadius:20, background:Z[950], marginTop:4 }}
      >
        <span style={{ fontSize:8, fontWeight:700, color:"#fff", fontFamily:MF }}>In der App ansehen</span>
      </motion.div>
    </motion.div>
  );
}

function AppMockup() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhase(p => (p+1)%4), PHASE_DUR);
    return () => clearInterval(iv);
  }, []);
  const phaseLabels = ["Studios entdecken","Datum wählen","Details eingeben","Buchung bestätigt"];
  return (
    <div ref={ref} style={{ perspective:1200 }}>
      <motion.div
        initial={{ opacity:0, rotateY:22, rotateX:6, y:48 }}
        animate={inView?{opacity:1,rotateY:-8,rotateX:3,y:0}:{}}
        transition={{ duration:1.1, ease:[0.22,1,0.36,1] }}
        whileHover={{ rotateY:-3, rotateX:1, transition:{ duration:0.7 } }}
        style={{ transformStyle:"preserve-3d", maxWidth:320, margin:"0 auto" }}
      >
        <div style={{ borderRadius:16, overflow:"hidden", boxShadow:"0 60px 120px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.07)", background:"#fff" }}>
          <div style={{ height:36, background:"#e8e8e8", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
            <div style={{ display:"flex", gap:5 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
            </div>
            <div style={{ flex:1, height:20, borderRadius:5, background:"rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, color:"#888", fontFamily:MF }}>app.studio-os.de</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", height:520 }}>
            <MNav />
            <AnimatePresence mode="wait">
              {phase===0 && <PhaseSearch key="s" />}
              {phase===1 && <PhaseCalendar key="c" />}
              {phase===2 && <PhaseForm key="f" />}
              {phase===3 && <PhaseSuccess key="ok" />}
            </AnimatePresence>
          </div>
          <div style={{ padding:"8px 14px", background:"#f4f4f5", borderTop:"1px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{ width:i===phase?16:5, background:i===phase?Z[950]:Z[400] }}
                  transition={{ duration:0.35 }}
                  style={{ height:5, borderRadius:10 }}
                />
              ))}
            </div>
            <span style={{ fontSize:8, color:Z[400], fontFamily:MF }}>{phaseLabels[phase]}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Haupt-Komponente
───────────────────────────────────────────────── */
export default function LandingPage() {
  const [done, setDone] = useState(false);
  if (!done) return <SplashScreen onDone={() => setDone(true)} />;

  return (
    <div style={{ fontFamily:FONT, background:BLACK, overflowX:"hidden" }}>

      {/* ─── Navigation ─────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        padding:"0 40px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(9,9,11,0.8)", backdropFilter:"blur(24px) saturate(160%)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize:17, fontWeight:700, color:WHITE, letterSpacing:"-0.04em", fontFamily:FONT }}>
          Studio<span style={{ color:"rgba(255,255,255,0.28)" }}>OS</span>
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          <Link to="/search"              style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Studios finden</Link>
          <Link to="/ueber-uns"           style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Über uns</Link>
          <Link to="/login"               style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Anmelden</Link>
          <Link to="/register?role=studio" style={{ fontSize:13, fontWeight:700, color:BLACK, background:WHITE, padding:"8px 20px", borderRadius:100, textDecoration:"none", fontFamily:FONT }}>
            Als Studio starten
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SEKTION 1 — HERO (Text + MacBook)
      ══════════════════════════════════════════ */}
      <section style={{
        minHeight:"100vh", background:BLACK,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"flex-start",
        paddingTop:96, paddingBottom:0,
        overflow:"hidden", position:"relative",
      }}>
        {/* Subtiler Hintergrund-Verlauf */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 80%, rgba(255,255,255,0.025), transparent)", pointerEvents:"none" }} />

        {/* ── Text-Block ── */}
        <motion.div
          initial={{ opacity:0, y:22 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1, duration:0.8, ease:[0.22,1,0.36,1] }}
          style={{ textAlign:"center", maxWidth:780, padding:"0 24px", position:"relative", zIndex:2 }}
        >
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.15 }}
            style={{ fontSize:11, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", marginBottom:20, fontFamily:FONT }}
          >
            Das Studio-Betriebssystem
          </motion.p>

          <h1 style={{
            fontSize:"clamp(42px, 6.5vw, 82px)", fontWeight:700,
            color:WHITE, lineHeight:0.97, letterSpacing:"-0.05em",
            marginBottom:22, fontFamily:FONT,
          }}>
            Tattoo-Buchungen.<br/>
            <span style={{ color:"rgba(255,255,255,0.22)" }}>Endlich digital.</span>
          </h1>

          <p style={{ fontSize:"clamp(14px, 1.5vw, 17px)", color:"rgba(255,255,255,0.4)", maxWidth:480, margin:"0 auto 36px", lineHeight:1.65, fontFamily:FONT }}>
            Kunden buchen per Echtzeit-Kalender, zahlen per Stripe —
            kein WhatsApp-Chaos, keine verpassten Anfragen.
          </p>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/search" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:WHITE, color:BLACK, fontSize:14, fontWeight:700, textDecoration:"none", fontFamily:FONT }}>
              Studio finden <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/register?role=studio" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:"transparent", color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.14)", fontSize:14, fontWeight:500, textDecoration:"none", fontFamily:FONT }}>
              Als Studio registrieren
            </Link>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.16)", marginTop:18, fontFamily:FONT }}>
            Kostenlos · Keine Kreditkarte erforderlich
          </p>
        </motion.div>

        {/* ── MacBook (öffnet sich darunter) ── */}
        <motion.div
          initial={{ opacity:0, y:40 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.3, duration:0.9, ease:[0.22,1,0.36,1] }}
          style={{ marginTop:48, position:"relative", zIndex:1 }}
        >
          <MacBook />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          SEKTION 2 — ZAHLEN / STATS (Schwarz)
      ══════════════════════════════════════════ */}
      <section style={{ background:BLACK, padding:"64px 40px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:32 }}>
          {[
            ["500+","Buchungen pro Monat","Wachsendes Netzwerk an Studios und Kunden"],
            ["< 60 s","Buchungszeit","Von der Suche bis zur Bestätigung"],
            ["100 %","Digitale Abwicklung","Kalender, Anfrage und Zahlung in einem"],
          ].map(([num, title, sub], i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div style={{ borderLeft:"1px solid rgba(255,255,255,0.1)", paddingLeft:28 }}>
                <p style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, color:WHITE, fontFamily:FONT, letterSpacing:"-0.04em", lineHeight:1, marginBottom:6 }}>{num}</p>
                <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.7)", fontFamily:FONT, marginBottom:6 }}>{title}</p>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontFamily:FONT, lineHeight:1.5 }}>{sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEKTION 3 — MOCKUP + FEATURES (Weiß)
      ══════════════════════════════════════════ */}
      <section style={{ background:WHITE, padding:"120px 40px 140px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(0,0,0,0.026) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.026) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:1120, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
          <FadeIn>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(0,0,0,0.28)", marginBottom:22, fontFamily:FONT }}>
              Für Studios & Kunden
            </p>
            <h2 style={{ fontSize:"clamp(36px,4.5vw,60px)", fontWeight:700, color:BLACK, lineHeight:1.0, letterSpacing:"-0.05em", marginBottom:22, fontFamily:FONT }}>
              Dein Studio.<br/>Professionell<br/>buchbar.
            </h2>
            <p style={{ fontSize:16, color:"rgba(0,0,0,0.42)", lineHeight:1.7, marginBottom:42, fontFamily:FONT, maxWidth:440 }}>
              Echter Echtzeit-Kalender, Artist-Auswahl, Körperstellen-Selektor
              und sichere Anzahlung — alles in einem einzigen Buchungsschritt.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:46 }}>
              {[
                "Echtzeit-Kalender farbcodiert nach Verfügbarkeit",
                "Größe, Körperstelle und Artist in einem Schritt wählbar",
                "Sichere Anzahlung via Stripe — automatisch verwaltet",
                "Alle Anfragen zentral im Studio-Dashboard",
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, x:-18 }}
                  whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }}
                  transition={{ delay:i*0.09, duration:0.5, ease:[0.22,1,0.36,1] }}
                  style={{ display:"flex", alignItems:"flex-start", gap:12 }}
                >
                  <CheckCircle size={16} strokeWidth={2.5} color={BLACK} style={{ flexShrink:0, marginTop:3 }} />
                  <span style={{ fontSize:14, color:"rgba(0,0,0,0.5)", lineHeight:1.55, fontFamily:FONT }}>{item}</span>
                </motion.div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <Link to="/register?role=studio" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:BLACK, color:WHITE, fontSize:14, fontWeight:700, textDecoration:"none", fontFamily:FONT }}>
                Kostenlos starten <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link to="/search" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:"transparent", color:"rgba(0,0,0,0.5)", border:"1px solid rgba(0,0,0,0.14)", fontSize:14, fontWeight:500, textDecoration:"none", fontFamily:FONT }}>
                Studio suchen
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <AppMockup />
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEKTION 4 — FÜR STUDIOS (Schwarz)
      ══════════════════════════════════════════ */}
      <section style={{ background:BLACK, padding:"100px 40px" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <FadeIn style={{ textAlign:"center", maxWidth:680, margin:"0 auto 64px" }}>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", marginBottom:18, fontFamily:FONT }}>Warum StudioOS</p>
            <h2 style={{ fontSize:"clamp(34px,4vw,56px)", fontWeight:700, color:WHITE, lineHeight:1.05, letterSpacing:"-0.05em", fontFamily:FONT }}>
              Alles was dein Studio braucht
            </h2>
          </FadeIn>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {[
              [Zap,"Sofort-Buchung","Kunden buchen direkt — ohne Anfragen per DM oder Telefon. Dein Kalender füllt sich automatisch."],
              [Shield,"Sichere Zahlung","Anzahlungen über Stripe schützen dich vor No-Shows. Automatisch, rechtssicher, einfach."],
              [BarChart2,"Studio-Dashboard","Alle Buchungen, Kunden und Einnahmen auf einen Blick. Verwalte dein Studio von überall."],
            ].map(([Icon, title, text], i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ padding:32, borderRadius:18, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)" }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                    <Icon size={20} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize:17, fontWeight:700, color:WHITE, fontFamily:FONT, marginBottom:10, letterSpacing:"-0.03em" }}>{title}</p>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.35)", fontFamily:FONT, lineHeight:1.65 }}>{text}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* CTA-Banner */}
          <FadeIn delay={0.3} style={{ marginTop:56 }}>
            <div style={{ padding:"44px 48px", borderRadius:22, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
              <div>
                <h3 style={{ fontSize:"clamp(24px,3vw,38px)", fontWeight:700, color:WHITE, fontFamily:FONT, letterSpacing:"-0.04em", marginBottom:8 }}>
                  Bereit loszulegen?
                </h3>
                <p style={{ fontSize:15, color:"rgba(255,255,255,0.38)", fontFamily:FONT }}>Kostenlos registrieren, Studio einrichten, fertig.</p>
              </div>
              <Link to="/register?role=studio" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"16px 32px", borderRadius:100, background:WHITE, color:BLACK, fontSize:15, fontWeight:700, textDecoration:"none", fontFamily:FONT, flexShrink:0 }}>
                Jetzt kostenlos starten <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer style={{ background:BLACK, borderTop:"1px solid rgba(255,255,255,0.06)", padding:"52px 40px 40px" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:40, marginBottom:44 }}>
            <div>
              <span style={{ fontSize:18, fontWeight:700, color:WHITE, letterSpacing:"-0.04em", fontFamily:FONT, display:"block", marginBottom:10 }}>
                Studio<span style={{ color:"rgba(255,255,255,0.25)" }}>OS</span>
              </span>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontFamily:FONT, lineHeight:1.6, maxWidth:220 }}>
                Das Betriebssystem für<br/>moderne Tattoo-Studios.
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 140px)", gap:"32px 48px" }}>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Plattform</p>
                {[["Studios finden","/search"],["Als Studio starten","/register?role=studio"],["Anmelden","/login"],["FAQ","/faq"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9 }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Unternehmen</p>
                {[["Über uns","/ueber-uns"],["Kontakt","/ueber-uns"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9 }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Rechtliches</p>
                {[["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9 }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.18)", fontFamily:FONT }}>© 2026 StudioOS · Das Studio-Betriebssystem</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.14)", fontFamily:FONT }}>Made with ♥ in Deutschland</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
