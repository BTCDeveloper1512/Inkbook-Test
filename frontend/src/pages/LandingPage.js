import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight, ChevronDown } from "lucide-react";

/* ─────────────────────────────────────────────
   Abstract orbital object – pure SVG / CSS
   Receives a framer-motion MotionValue (0→1)
───────────────────────────────────────────── */
function OrbitalCore({ progress }) {
  const rotate      = useTransform(progress, [0, 1], [0, 210]);
  const innerRotate = useTransform(progress, [0, 1], [0, -140]);
  const outerRotate = useTransform(progress, [0, 1], [0,  290]);
  const scl         = useTransform(progress, [0, 0.3, 0.7, 1], [0.82, 1.06, 1.0, 0.65]);

  return (
    <motion.div style={{ rotate, scale: scl }} className="pointer-events-none">
      <svg width="580" height="580" viewBox="0 0 580 580" fill="none">
        <defs>
          <radialGradient id="coreRg" cx="36%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#282828"/>
            <stop offset="100%" stopColor="#040404"/>
          </radialGradient>
          <radialGradient id="coreSheen" cx="28%" cy="22%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.13"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <filter id="coreShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="18" stdDeviation="28" floodColor="rgba(0,0,0,0.16)"/>
          </filter>
          <filter id="nodeShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.18)"/>
          </filter>
        </defs>

        {/* ── very faint technical grid ── */}
        <g opacity="0.028" stroke="#000" strokeWidth="0.5">
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <line x1={0}   y1={i * 52} x2={580} y2={i * 52}/>
              <line x1={i * 52} y1={0}   x2={i * 52} y2={580}/>
            </g>
          ))}
        </g>

        {/* ── Outer dashed measurement ring ── */}
        <motion.g style={{ rotate: outerRotate }} transform-origin="290 290"
          className="[transform-box:fill-box] [transform-origin:center]">
          <circle cx="290" cy="290" r="248"
            stroke="#d6d6d6" strokeWidth="0.7" strokeDasharray="3.5 9"/>
          {/* tick marks at every 30° */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            return (
              <line key={i}
                x1={290 + 242 * Math.cos(a)} y1={290 + 242 * Math.sin(a)}
                x2={290 + 254 * Math.cos(a)} y2={290 + 254 * Math.sin(a)}
                stroke="#bbb" strokeWidth="1" strokeLinecap="round"/>
            );
          })}
          {/* 4 orbital nodes */}
          {[0, 90, 180, 270].map((deg, i) => {
            const a = (deg - 90) * (Math.PI / 180);
            const x = 290 + 248 * Math.cos(a);
            const y = 290 + 248 * Math.sin(a);
            const labels = ["01", "02", "03", "04"];
            return (
              <g key={i} filter="url(#nodeShadow)">
                <circle cx={x} cy={y} r="7"   fill="#111"/>
                <circle cx={x} cy={y} r="3.5" fill="#555"/>
                <text x={290 + 265 * Math.cos(a)} y={290 + 265 * Math.sin(a)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="-apple-system,'Inter',sans-serif"
                  fontSize="7.5" fill="#aaa" letterSpacing="0.08em">
                  {labels[i]}
                </text>
              </g>
            );
          })}
        </motion.g>

        {/* ── Middle ring + 8 radial spokes ── */}
        <motion.g style={{ rotate: innerRotate }}
          className="[transform-box:fill-box] [transform-origin:center]">
          <circle cx="290" cy="290" r="172"
            stroke="#c8c8c8" strokeWidth="0.6" strokeDasharray="2 6"/>
          {/* Radial lines from inner-ring edge to middle-ring edge */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45 - 90) * (Math.PI / 180);
            return (
              <line key={i}
                x1={290 + 112 * Math.cos(a)} y1={290 + 112 * Math.sin(a)}
                x2={290 + 168 * Math.cos(a)} y2={290 + 168 * Math.sin(a)}
                stroke="#ccc" strokeWidth="0.55" strokeLinecap="round"/>
            );
          })}
        </motion.g>

        {/* ── Inner ring ── */}
        <circle cx="290" cy="290" r="108"
          stroke="#999" strokeWidth="0.9" strokeDasharray="1 4"/>

        {/* ── Quadrant accent arcs (bold, clockwise alternating) ── */}
        {[0, 90, 180, 270].map((startDeg, i) => {
          const s = (startDeg - 90)       * (Math.PI / 180);
          const e = (startDeg - 90 + 40)  * (Math.PI / 180);
          const r = 108;
          return (
            <path key={i}
              d={`M${290 + r * Math.cos(s)},${290 + r * Math.sin(s)}
                  A${r},${r} 0 0,1 ${290 + r * Math.cos(e)},${290 + r * Math.sin(e)}`}
              stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          );
        })}

        {/* ── Core rectangle (the "chip") ── */}
        <rect x="255" y="255" width="70" height="70" rx="9"
          fill="url(#coreRg)" filter="url(#coreShadow)"/>
        <rect x="255" y="255" width="70" height="70" rx="9"
          fill="url(#coreSheen)"/>
        {/* inner grid lines */}
        {[1, 2, 3].map(i => (
          <line key={`h${i}`}
            x1="258" y1={255 + i * 14} x2="322" y2={255 + i * 14}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"/>
        ))}
        {[1, 2, 3].map(i => (
          <line key={`v${i}`}
            x1={255 + i * 14} y1="258" x2={255 + i * 14} y2="322"
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"/>
        ))}
        {/* sheen strip */}
        <rect x="258" y="258" width="30" height="7" rx="2"
          fill="rgba(255,255,255,0.11)"/>
        {/* center dot */}
        <circle cx="290" cy="290" r="4.5" fill="#4a4a4a"/>
        <circle cx="290" cy="290" r="1.8" fill="#888"/>

        {/* ── Corner extension lines ── */}
        {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy], i) => (
          <line key={i}
            x1={290 + dx * 35} y1={290 + dy * 35}
            x2={290 + dx * 92} y2={290 + dy * 92}
            stroke="#ddd" strokeWidth="0.5" strokeLinecap="round"/>
        ))}
      </svg>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Feature pill (fades in on scroll)
───────────────────────────────────────────── */
function Pill({ opacity, y, label, sub }) {
  return (
    <motion.div style={{ opacity, y }} className="text-center">
      <p className="font-playfair text-base font-semibold text-zinc-900 leading-tight">{label}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide"
        style={{ fontFamily: "'Inter',sans-serif" }}>{sub}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Landing Page
───────────────────────────────────────────── */
export default function LandingPage() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  /* smooth spring so every transform feels silky */
  const s = useSpring(scrollYProgress, { stiffness: 55, damping: 22, restDelta: 0.0001 });

  /* ── object ── */
  const objY  = useTransform(s, [0, 0.5, 0.88], [0, -24, -220]);
  const objOp = useTransform(s, [0.72, 0.9],     [1, 0]);

  /* ── phase 1: tagline ── */
  const p1Op = useTransform(s, [0, 0.09, 0.2],  [0, 1, 0]);
  const p1Y  = useTransform(s, [0, 0.09, 0.2],  [18, 0, -18]);

  /* ── phase 2: main wordmark ── */
  const p2Op = useTransform(s, [0.13, 0.3, 0.56], [0, 1, 0]);
  const p2Y  = useTransform(s, [0.13, 0.3, 0.56], [30, 0, -30]);
  const p2Sc = useTransform(s, [0.13, 0.3],       [0.94, 1]);

  /* ── phase 3: three feature pills ── */
  const f1Op = useTransform(s, [0.43, 0.57], [0, 1]);
  const f1Y  = useTransform(s, [0.43, 0.57], [22, 0]);
  const f2Op = useTransform(s, [0.49, 0.63], [0, 1]);
  const f2Y  = useTransform(s, [0.49, 0.63], [22, 0]);
  const f3Op = useTransform(s, [0.55, 0.69], [0, 1]);
  const f3Y  = useTransform(s, [0.55, 0.69], [22, 0]);

  /* ── phase 4: CTA ── */
  const ctaOp = useTransform(s, [0.72, 0.88], [0, 1]);
  const ctaY  = useTransform(s, [0.72, 0.88], [38, 0]);

  /* ── scroll arrow ── */
  const arrOp = useTransform(s, [0, 0.06], [1, 0]);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ════════════════════════════════════════
          CINEMATIC SCROLL ZONE  (350vh tall)
          Sticky inner panel stays at top
          ════════════════════════════════════════ */}
      <div ref={containerRef} style={{ height: "350vh" }}>
        <div className="sticky top-0 h-screen w-full bg-white overflow-hidden flex items-center justify-center">

          {/* Abstract orbital object */}
          <motion.div
            style={{ y: objY, opacity: objOp }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <OrbitalCore progress={s} />
          </motion.div>

          {/* Phase 1 – eyebrow tagline */}
          <motion.p
            style={{ opacity: p1Op, y: p1Y }}
            className="absolute text-center text-[11px] tracking-[0.3em] uppercase text-zinc-400 pointer-events-none"
            style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.3em" }}
          >
            Premium Tattoo Buchungsplattform
          </motion.p>

          {/* Phase 2 – main wordmark + subtitle */}
          <motion.div
            style={{ opacity: p2Op, y: p2Y, scale: p2Sc }}
            className="absolute text-center pointer-events-none select-none"
          >
            <h1
              className="font-playfair font-bold text-zinc-950 leading-none tracking-tight"
              style={{ fontSize: "clamp(72px, 12vw, 116px)" }}
            >
              InkBook
            </h1>
            <p
              className="text-[11px] text-zinc-400 mt-5 tracking-[0.22em] uppercase"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Engineered for Tattoo Artists
            </p>
          </motion.div>

          {/* Phase 3 – feature pills */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-14 sm:gap-20 pointer-events-none">
            <Pill opacity={f1Op} y={f1Y} label="Kalender"  sub="Smarte Terminplanung" />
            <Pill opacity={f2Op} y={f2Y} label="Studios"   sub="Kuratierte Auswahl"   />
            <Pill opacity={f3Op} y={f3Y} label="Chat"      sub="Direkte Kommunikation" />
          </div>

          {/* Phase 4 – CTA */}
          <motion.div
            style={{ opacity: ctaOp, y: ctaY }}
            className="absolute text-center"
          >
            <p
              className="text-[11px] text-zinc-400 tracking-[0.22em] uppercase mb-7"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Bereit loszulegen?
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-3 px-9 py-3.5 bg-zinc-950 text-white rounded-full
                         text-[13px] font-medium hover:bg-zinc-700 transition-all duration-300
                         hover:gap-5 group"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
            <p
              className="text-[11px] text-zinc-300 mt-4"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Kostenlos für Kunden · Flexible Pläne für Studios
            </p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            style={{ opacity: arrOp }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronDown size={18} className="text-zinc-300" strokeWidth={1.5}/>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* ════════════════════════════════════════
          POST-SCROLL: Content sections
          ════════════════════════════════════════ */}

      {/* Section divider */}
      <div className="h-px bg-zinc-100"/>

      {/* What is InkBook */}
      <section className="py-36 px-6">
        <div className="max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-24"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily: "'Inter',sans-serif" }}>Was ist InkBook?</p>
            <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight">
              Tattoo-Buchungen<br/>neu definiert.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                num: "01",
                title: "Finde dein Studio",
                body: "Durchsuche kuratierte Tattoo-Studios in deiner Nähe. Vergleiche Stile, Bewertungen und Preise auf einen Blick.",
              },
              {
                num: "02",
                title: "Buche deinen Termin",
                body: "Direkte Buchung, kein Telefonieren. Wähle deinen Wunschtermin in Echtzeit aus verfügbaren Slots.",
              },
              {
                num: "03",
                title: "Dein perfektes Tattoo",
                body: "Kommuniziere direkt mit dem Studio, teile Referenzbilder und erhalte professionelle Beratung.",
              },
            ].map(({ num, title, body }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}
                className="group"
              >
                <p className="text-[10px] text-zinc-300 tracking-[0.2em] mb-4"
                  style={{ fontFamily: "'Inter',sans-serif" }}>{num}</p>
                <div className="w-6 h-[1px] bg-zinc-200 mb-7
                                transition-all duration-500 group-hover:w-14"/>
                <h3 className="font-playfair text-xl text-zinc-900 mb-3">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed"
                  style={{ fontFamily: "'Inter',sans-serif" }}>{body}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mt-28 text-center"
          >
            <Link
              to="/search"
              className="inline-flex items-center gap-3 px-10 py-4 bg-zinc-950 text-white rounded-full
                         text-sm font-medium hover:bg-zinc-700 transition-all duration-300
                         hover:gap-5 group"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Jetzt Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-b border-zinc-100 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "500+", label: "Studios" },
            { value: "10k+", label: "Buchungen" },
            { value: "4.9★", label: "Bewertung" },
          ].map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <p className="font-playfair text-3xl sm:text-4xl text-zinc-950 font-bold">{value}</p>
              <p className="text-xs text-zinc-400 mt-1 tracking-wide"
                style={{ fontFamily: "'Inter',sans-serif" }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-playfair text-zinc-900 font-semibold text-sm">InkBook</p>
          <p className="text-[11px] text-zinc-400" style={{ fontFamily: "'Inter',sans-serif" }}>
            © 2026 InkBook · Alle Rechte vorbehalten
          </p>
          <div className="flex gap-5">
            {[
              { to: "/login",    label: "Anmelden"    },
              { to: "/register", label: "Registrieren" },
              { to: "/search",   label: "Studios"      },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors"
                style={{ fontFamily: "'Inter',sans-serif" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
