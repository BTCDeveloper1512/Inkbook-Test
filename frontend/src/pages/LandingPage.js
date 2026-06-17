import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Star, MapPin, Check, Calendar } from "lucide-react";
import SplashScreen from "../components/SplashScreen";

const FONT = "'Outfit', sans-serif";

/* ─────────────────────────────────────────────────
   Hilfsmittel: FadeIn
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
   3-D Torus-Knoten (2 , 3) — Tattoo-Ästhetik
   Wirkt wie ein keltisches / geometrisches Tattoo
───────────────────────────────────────────────── */
function TattooKnot({ size = 650 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = size * DPR;
    canvas.height = size * DPR;
    ctx.scale(DPR, DPR);

    const cx = size / 2, cy = size / 2;
    const S  = size * 0.15;   /* Skalierungsfaktor            */
    const N  = 800;            /* Abtastpunkte                 */
    const R  = 2, r = 1;       /* Torusradien (2,3)-Knoten     */
    let rotY = 0;
    let raf;

    /* Punkte des (2,3)-Torus-Knotens generieren */
    const base = Array.from({ length: N + 1 }, (_, i) => {
      const t = (i / N) * Math.PI * 2;
      return [
        (R + r * Math.cos(3 * t)) * Math.cos(2 * t),
        (R + r * Math.cos(3 * t)) * Math.sin(2 * t),
        r * Math.sin(3 * t),
      ];
    });

    function rotY3D(pts, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return pts.map(([x, y, z]) => [x * c + z * s, y, -x * s + z * c]);
    }
    function proj([x, y, z]) {
      const fov = 6, sc = fov / (fov - z * 0.28);
      return [cx + x * S * sc, cy + y * S * sc, z];
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const pts = rotY3D(base, rotY).map(proj);

      /* Linienzug mit Tiefeneffekt */
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1, z1] = pts[i];
        const [x2, y2]     = pts[i + 1];
        const depth = (z1 + r + R) / (2 * (r + R));   /* 0 – 1 */
        const alpha = 0.04 + depth * 0.55;
        const lw    = 0.4  + depth * 1.4;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.lineWidth   = lw;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      /* Knoten-Punkte: leuchtende Dots */
      const step = Math.floor(N / 28);
      for (let i = 0; i < pts.length - 1; i += step) {
        const [x, y, z] = pts[i];
        const depth = (z + r + R) / (2 * (r + R));
        if (depth < 0.35) continue;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + depth * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(depth * 0.75).toFixed(3)})`;
        ctx.fill();
      }

      rotY += 0.0045;
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas ref={ref}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────────────
   Animiertes App-Mockup — 4 Phasen
   0: Suchergebnis  1: Kalender
   2: Buchungsform  3: Bestätigung
───────────────────────────────────────────────── */
const PHASES = [0, 1, 2, 3];
const PHASE_DUR = 2800; /* ms je Phase */

const Z   = { 950:"#09090b", 900:"#18181b", 700:"#3f3f46", 500:"#71717a", 400:"#a1a1aa", 200:"#e4e4e7", 100:"#f4f4f5", 50:"#fafafa" };
const MF  = "'Outfit', sans-serif";
const TEAL = "#2dd4bf";

/* Mini-Navbar im Mockup */
function MNav() {
  return (
    <div style={{ height: 36, borderBottom: `1px solid ${Z[100]}`, background:"#fff", display:"flex", alignItems:"center", padding:"0 12px", gap:6, flexShrink:0 }}>
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

/* PHASE 0: Suchergebnis */
function PhaseSearch() {
  return (
    <motion.div key="search"
      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }}
      transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:Z[50], padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}
    >
      <p style={{ fontSize:6.5, letterSpacing:"0.22em", textTransform:"uppercase", color:Z[400], fontFamily:MF, marginBottom:2 }}>Tattoo Studios Entdecken</p>
      <p style={{ fontSize:18, fontWeight:700, color:Z[950], fontFamily:MF, lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:6 }}>Dein<br/>perfektes Studio.</p>

      {/* Suchleiste */}
      <div style={{ border:`1.5px solid ${Z[950]}`, borderRadius:9, padding:"6px 10px", background:"#fff", display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", border:`1.5px solid ${Z[500]}` }} />
        <span style={{ fontSize:8, color:Z[400], fontFamily:MF, flex:1 }}>Studioname, Stil oder Stadt …</span>
      </div>

      {/* Studio-Karte — animiert herein */}
      <motion.div
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22, duration:0.45 }}
        style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${Z[950]}`, boxShadow:"0 4px 18px rgba(0,0,0,0.08)", display:"flex", overflow:"hidden" }}
      >
        {/* Bild */}
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

      {/* Zweite Karte (gedimmt) */}
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

/* PHASE 1: Kalender-Auswahl */
const CAL = [[null,1,2,3,4,5,6],[7,8,9,10,11,12,13],[14,15,16,17,18,19,20],[21,22,23,24,25,26,27],[28,29,30,null,null,null,null]];
const AV  = {1:"t",2:"t",3:"t",4:"y",5:"t",8:"t",9:"t",10:"r",11:"t",14:"t",15:"t",17:"t",18:"y",21:"t",22:"t",23:"y",24:"t",25:"r",28:"t",29:"t",30:"y"};
const AC  = { t:TEAL, y:"#facc15", r:"#fb7185" };
const HDR = ["Mo","Di","Mi","Do","Fr","Sa","So"];

function PhaseCalendar() {
  const [sel, setSel] = useState(null);

  useEffect(() => {
    const days = [15, 22, 18];
    let i = 0;
    const iv = setInterval(() => { setSel(days[i % days.length]); i++; }, 700);
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
            const isSel = d === sel;
            const av    = AV[d];
            return (
              <motion.div key={di}
                animate={isSel ? { scale:1.2 } : { scale:1 }}
                transition={{ type:"spring", stiffness:500, damping:24 }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5px 0", borderRadius:4, background: isSel ? Z[950] : "transparent" }}
              >
                <span style={{ fontSize:6.5, color: isSel ? "#fff" : Z[700], fontWeight: isSel ? 700 : 400, lineHeight:1 }}>{d}</span>
                {av && <div style={{ width:2.5, height:2.5, borderRadius:"50%", background: isSel ? "#fff" : AC[av], marginTop:1 }} />}
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
            <p style={{ fontSize:7, fontWeight:600, color:"#15803d", fontFamily:MF }}>
              {["So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di","Mi","Do","Fr","Sa","Mo","Di","Mi","Do","Fr","Sa","So","Mo","Di"][sel - 1]}, {sel}. Juni 2026
            </p>
            <p style={{ fontSize:6, color:"#16a34a", fontFamily:MF }}>Gut verfügbar</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* PHASE 2: Buchungsformular */
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
      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }}
      transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}
      style={{ flex:1, background:"#fff", padding:"10px 12px", display:"flex", flexDirection:"column", gap:7, overflow:"hidden" }}
    >
      <p style={{ fontSize:9, fontWeight:700, color:Z[950], fontFamily:MF, letterSpacing:"-0.02em" }}>Termin anfragen</p>

      {/* Terminart */}
      <div>
        <p style={{ fontSize:6, letterSpacing:"0.15em", textTransform:"uppercase", color:Z[400], fontFamily:MF, fontWeight:600, marginBottom:4 }}>Terminart</p>
        <div style={{ display:"flex", gap:4 }}>
          {["Beratung","Tattoo"].map((t,i) => (
            <div key={t} style={{ flex:1, padding:"4px 0", textAlign:"center", borderRadius:7, border:`1px solid ${i===1?Z[950]:Z[200]}`, background: i===1 ? Z[950] : "#fff" }}>
              <span style={{ fontSize:7.5, fontWeight: i===1?700:400, color: i===1?"#fff":Z[500], fontFamily:MF }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Größe */}
      <div>
        <p style={{ fontSize:6, letterSpacing:"0.15em", textTransform:"uppercase", color:Z[400], fontFamily:MF, fontWeight:600, marginBottom:4 }}>Tattoo-Größe</p>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {sizes.map((s,i) => (
            <motion.div key={s}
              animate={i===sizeIdx ? { scale:1.02, x:1 } : { scale:1, x:0 }}
              transition={{ type:"spring", stiffness:400, damping:22 }}
              style={{ padding:"4px 8px", borderRadius:7, border:`1px solid ${i===sizeIdx?Z[950]:Z[100]}`, background: i===sizeIdx?Z[950]:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}
            >
              <span style={{ fontSize:7.5, fontWeight: i===sizeIdx?700:400, color: i===sizeIdx?"#fff":Z[600], fontFamily:MF }}>{s}</span>
              <span style={{ fontSize:6, color: i===sizeIdx?"rgba(255,255,255,0.4)":Z[400], fontFamily:MF }}>{[1,2,3,5,8][i]} Pkt.</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Datum-Chip */}
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

/* PHASE 3: Bestätigung */
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

      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
        style={{ textAlign:"center" }}
      >
        <p style={{ fontSize:13, fontWeight:700, color:Z[950], fontFamily:MF, marginBottom:5, letterSpacing:"-0.03em" }}>Termin angefragt!</p>
        <p style={{ fontSize:7.5, color:Z[500], fontFamily:MF, lineHeight:1.55 }}>
          JohannINK bestätigt deinen<br/>Termin in Kürze.
        </p>
      </motion.div>

      {/* Buchungsdetails */}
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

/* Browser-Chrome Wrapper */
function AppMockup() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [phase, setPhase] = useState(0);

  /* Phase-Zyklus */
  useEffect(() => {
    const iv = setInterval(() => setPhase(p => (p + 1) % 4), PHASE_DUR);
    return () => clearInterval(iv);
  }, []);

  const phaseLabels = ["Studios entdecken", "Datum wählen", "Details eingeben", "Buchung bestätigt"];

  return (
    <div ref={ref} style={{ perspective: 1200 }}>
      <motion.div
        initial={{ opacity:0, rotateY:22, rotateX:6, y:48 }}
        animate={inView ? { opacity:1, rotateY:-8, rotateX:3, y:0 } : {}}
        transition={{ duration:1.1, ease:[0.22,1,0.36,1] }}
        whileHover={{ rotateY:-3, rotateX:1, transition:{ duration:0.7 } }}
        style={{ transformStyle:"preserve-3d", maxWidth:320, margin:"0 auto" }}
      >
        {/* Browser-Rahmen */}
        <div style={{ borderRadius:16, overflow:"hidden", boxShadow:"0 60px 120px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.07)", background:"#fff" }}>
          {/* Chrome-Leiste */}
          <div style={{ height:36, background:"#e8e8e8", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
            <div style={{ display:"flex", gap:5 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
            </div>
            <div style={{ flex:1, height:20, borderRadius:5, background:"rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, color:"#888", fontFamily:MF }}>app.studio-os.de</span>
            </div>
          </div>

          {/* App-Inhalt */}
          <div style={{ display:"flex", flexDirection:"column", height:520 }}>
            <MNav />
            <AnimatePresence mode="wait">
              {phase === 0 && <PhaseSearch key="s" />}
              {phase === 1 && <PhaseCalendar key="c" />}
              {phase === 2 && <PhaseForm key="f" />}
              {phase === 3 && <PhaseSuccess key="ok" />}
            </AnimatePresence>
          </div>

          {/* Phasen-Indikator */}
          <div style={{ padding:"8px 14px", background:"#f4f4f5", borderTop:"1px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{ width: i === phase ? 16 : 5, background: i === phase ? Z[950] : Z[400] }}
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
    <div style={{ fontFamily: FONT, background: "#000", overflowX: "hidden" }}>

      {/* ─── Navigation ─────────────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        padding:"0 40px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(0,0,0,0.78)", backdropFilter:"blur(24px) saturate(160%)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize:17, fontWeight:700, color:"#fff", letterSpacing:"-0.04em", fontFamily:FONT }}>
          Studio<span style={{ color:"rgba(255,255,255,0.28)" }}>OS</span>
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          <Link to="/search"         style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Studios finden</Link>
          <Link to="/ueber-uns"      style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Über uns</Link>
          <Link to="/login"          style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT }}>Anmelden</Link>
          <Link to="/register?role=studio" style={{ fontSize:13, fontWeight:700, color:"#000", background:"#fff", padding:"8px 20px", borderRadius:100, textDecoration:"none", fontFamily:FONT }}>
            Als Studio starten
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          SEKTION 1 — HERO (Schwarz)
      ══════════════════════════════════════════════ */}
      <section style={{
        minHeight:"100vh", background:"#000",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        position:"relative", overflow:"hidden",
        padding:"140px 24px 100px",
      }}>
        {/* Torus-Knoten im Hintergrund */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}>
          <TattooKnot size={720} />
        </div>
        {/* Radial-Verlauf */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 52% 60% at 50% 50%, transparent 18%, #000 70%)" }} />

        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:840 }}>
          <motion.p
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.5 }}
            style={{ fontSize:11, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", marginBottom:30, fontFamily:FONT }}
          >
            Das Studio-Betriebssystem
          </motion.p>

          <motion.h1
            initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.18, duration:0.9, ease:[0.22,1,0.36,1] }}
            style={{ fontSize:"clamp(52px, 8.5vw, 100px)", fontWeight:700, color:"#fff", lineHeight:0.97, letterSpacing:"-0.05em", marginBottom:30, fontFamily:FONT }}
          >
            Tattoo-Buchungen.<br/>
            <span style={{ color:"rgba(255,255,255,0.22)" }}>Endlich digital.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.65 }}
            style={{ fontSize:"clamp(15px, 1.8vw, 19px)", color:"rgba(255,255,255,0.4)", maxWidth:520, margin:"0 auto 46px", lineHeight:1.65, fontWeight:400, fontFamily:FONT }}
          >
            Kunden finden ihr Studio, buchen per Echtzeit-Kalender und zahlen
            sicher per Stripe — kein WhatsApp-Chaos, keine verpassten Anfragen.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.55 }}
            style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}
          >
            <Link to="/search" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"15px 30px", borderRadius:100, background:"#fff", color:"#000", fontSize:14, fontWeight:700, textDecoration:"none", fontFamily:FONT, letterSpacing:"-0.02em" }}>
              Studio finden <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/register?role=studio" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"15px 30px", borderRadius:100, background:"transparent", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.14)", fontSize:14, fontWeight:500, textDecoration:"none", fontFamily:FONT, letterSpacing:"-0.02em" }}>
              Als Studio registrieren
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.58 }}
            style={{ fontSize:12, color:"rgba(255,255,255,0.18)", marginTop:22, fontFamily:FONT }}
          >
            Kostenlos · Keine Kreditkarte erforderlich
          </motion.p>
        </div>

        {/* Scroll-Indikator */}
        <motion.div animate={{ y:[0,10,0] }} transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)" }}
        >
          <div style={{ width:1, height:50, background:"linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)" }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          SEKTION 2 — MOCKUP (Weiß)
      ══════════════════════════════════════════════ */}
      <section style={{ background:"#fff", padding:"120px 40px 140px", position:"relative", overflow:"hidden" }}>
        {/* Dezentes Grid */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(0,0,0,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.028) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:1120, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>

          <FadeIn>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(0,0,0,0.28)", marginBottom:22, fontFamily:FONT }}>
              Für Studios & Kunden
            </p>
            <h2 style={{ fontSize:"clamp(36px, 4.5vw, 60px)", fontWeight:700, color:"#000", lineHeight:1.0, letterSpacing:"-0.05em", marginBottom:22, fontFamily:FONT }}>
              Dein Studio.<br/>Professionell<br/>buchbar.
            </h2>
            <p style={{ fontSize:16, color:"rgba(0,0,0,0.42)", lineHeight:1.7, marginBottom:42, fontWeight:400, fontFamily:FONT, maxWidth:440 }}>
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
                  transition={{ delay: i*0.09, duration:0.5, ease:[0.22,1,0.36,1] }}
                  style={{ display:"flex", alignItems:"flex-start", gap:12 }}
                >
                  <CheckCircle size={16} strokeWidth={2.5} color="#000" style={{ flexShrink:0, marginTop:3 }} />
                  <span style={{ fontSize:14, color:"rgba(0,0,0,0.5)", lineHeight:1.55, fontFamily:FONT }}>{item}</span>
                </motion.div>
              ))}
            </div>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <Link to="/register?role=studio" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:"#000", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", fontFamily:FONT, letterSpacing:"-0.02em" }}>
                Kostenlos starten <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link to="/search" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"14px 28px", borderRadius:100, background:"transparent", color:"rgba(0,0,0,0.5)", border:"1px solid rgba(0,0,0,0.14)", fontSize:14, fontWeight:500, textDecoration:"none", fontFamily:FONT, letterSpacing:"-0.02em" }}>
                Studio suchen
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <AppMockup />
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────── */}
      <footer style={{ background:"#000", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"52px 40px 40px" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>

          {/* Obere Zeile */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:40, marginBottom:44 }}>
            <div>
              <span style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-0.04em", fontFamily:FONT, display:"block", marginBottom:10 }}>
                Studio<span style={{ color:"rgba(255,255,255,0.25)" }}>OS</span>
              </span>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontFamily:FONT, lineHeight:1.6, maxWidth:240 }}>
                Das Betriebssystem für<br/>moderne Tattoo-Studios.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 140px)", gap:"32px 48px" }}>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Plattform</p>
                {[["Studios finden","/search"],["Als Studio starten","/register?role=studio"],["Anmelden","/login"],["FAQ","/faq"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9, letterSpacing:"-0.01em" }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Unternehmen</p>
                {[["Über uns","/ueber-uns"],["Kontakt","/ueber-uns"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9, letterSpacing:"-0.01em" }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:FONT }}>Rechtliches</p>
                {[["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h]) => (
                  <Link key={l} to={h} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:FONT, marginBottom:9, letterSpacing:"-0.01em" }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* Untere Zeile */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.18)", fontFamily:FONT }}>
              © 2026 StudioOS · Das Studio-Betriebssystem
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.14)", fontFamily:FONT }}>
              Made with ♥ in Deutschland
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
