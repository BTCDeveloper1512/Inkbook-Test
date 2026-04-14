import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   SVG Phone Mockup with app screen content
═══════════════════════════════════════════════════════ */
function PhoneMockup({ screen = "search", width = 200 }) {
  const h = width * 2.05;
  const rx = width * 0.14;

  const SearchScreen = () => (
    <>
      {/* Header bar */}
      <rect x={width*0.06} y={h*0.1} width={width*0.88} height={h*0.08} rx="8" fill="#111"/>
      <rect x={width*0.13} y={h*0.13} width={width*0.38} height={h*0.025} rx="3" fill="rgba(255,255,255,0.85)"/>
      {/* Search bar */}
      <rect x={width*0.06} y={h*0.21} width={width*0.88} height={h*0.065} rx={h*0.033} fill="#f2f2f2"/>
      <rect x={width*0.14} y={h*0.232} width={width*0.5} height={h*0.02} rx="3" fill="#bbb"/>
      {/* Card 1 */}
      <rect x={width*0.06} y={h*0.3} width={width*0.88} height={h*0.18} rx="10" fill="#ececec"/>
      <rect x={width*0.06} y={h*0.3} width={width*0.38} height={h*0.18} rx="10" fill="#d0d0d0"/>
      <rect x={width*0.5}  y={h*0.31} width={width*0.36} height={h*0.022} rx="3" fill="#333"/>
      <rect x={width*0.5}  y={h*0.34} width={width*0.26} height={h*0.016} rx="3" fill="#999"/>
      <rect x={width*0.5}  y={h*0.365} width={width*0.18} height={h*0.014} rx="3" fill="#bbb"/>
      {/* Stars */}
      {[0,1,2,3,4].map(i=>(
        <rect key={i} x={width*0.5+i*(width*0.045)} y={h*0.39} width={width*0.034} height={h*0.012} rx="2" fill="#111"/>
      ))}
      {/* Card 2 */}
      <rect x={width*0.06} y={h*0.5}  width={width*0.88} height={h*0.18} rx="10" fill="#e8e8e8"/>
      <rect x={width*0.06} y={h*0.5}  width={width*0.38} height={h*0.18} rx="10" fill="#c8c8c8"/>
      <rect x={width*0.5}  y={h*0.51} width={width*0.32} height={h*0.022} rx="3" fill="#333"/>
      <rect x={width*0.5}  y={h*0.54} width={width*0.22} height={h*0.016} rx="3" fill="#999"/>
      {/* Partial card 3 */}
      <rect x={width*0.06} y={h*0.7}  width={width*0.88} height={h*0.12} rx="10" fill="#f0f0f0"/>
      {/* Bottom nav */}
      <rect x={0} y={h*0.88} width={width} height={h*0.12} fill="#fff"/>
      <line x1={0} y1={h*0.88} x2={width} y2={h*0.88} stroke="#e5e5e5" strokeWidth="0.8"/>
      {[0,1,2,3].map(i=>(
        <rect key={i} x={width*(0.12+i*0.22)} y={h*0.916} width={width*0.07} height={h*0.024} rx="3"
          fill={i===0?"#111":"#ccc"}/>
      ))}
    </>
  );

  const BookingScreen = () => (
    <>
      <rect x={width*0.06} y={h*0.1}  width={width*0.88} height={h*0.07} rx="8" fill="#111"/>
      <rect x={width*0.13} y={h*0.125} width={width*0.42} height={h*0.022} rx="3" fill="rgba(255,255,255,0.85)"/>
      {/* Month nav */}
      <rect x={width*0.06} y={h*0.21} width={width*0.88} height={h*0.06} rx="8" fill="#f7f7f7"/>
      <rect x={width*0.28} y={h*0.226} width={width*0.44} height={h*0.02} rx="3" fill="#555"/>
      {/* Calendar grid */}
      {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d,i)=>(
        <rect key={d} x={width*(0.065+i*0.127)} y={h*0.295} width={width*0.092} height={h*0.02} rx="2" fill="#ccc"/>
      ))}
      {Array.from({length:35},(_,i)=>{
        const col=i%7, row=Math.floor(i/7);
        const sel=i===10;
        const past=i<5;
        return (
          <rect key={i}
            x={width*(0.065+col*0.127)} y={h*(0.335+row*0.07)}
            width={width*0.092} height={h*0.054} rx="6"
            fill={sel?"#111":past?"#f8f8f8":"#f0f0f0"}/>
        );
      })}
      {/* Time slots */}
      {[0,1,2].map(i=>(
        <rect key={i} x={width*0.06} y={h*(0.71+i*0.063)} width={width*0.88} height={h*0.052} rx="8"
          fill={i===1?"#111":"#f2f2f2"}/>
      ))}
      {/* CTA */}
      <rect x={width*0.06} y={h*0.87} width={width*0.88} height={h*0.065} rx={h*0.033} fill="#111"/>
      <rect x={width*0.26} y={h*0.886} width={width*0.48} height={h*0.02} rx="3" fill="rgba(255,255,255,0.9)"/>
    </>
  );

  const ChatScreen = () => (
    <>
      {/* Header */}
      <rect x={0} y={h*0.08} width={width} height={h*0.1} fill="#fff"/>
      <circle cx={width*0.18} cy={h*0.13} r={width*0.09} fill="#e0e0e0"/>
      <rect x={width*0.32} y={h*0.112} width={width*0.38} height={h*0.02} rx="3" fill="#222"/>
      <rect x={width*0.32} y={h*0.14}  width={width*0.25} height={h*0.014} rx="3" fill="#aaa"/>
      <line x1={0} y1={h*0.18} x2={width} y2={h*0.18} stroke="#eee" strokeWidth="0.8"/>
      {/* Messages */}
      {/* them */}
      <rect x={width*0.06} y={h*0.2}  width={width*0.6} height={h*0.065} rx="10" fill="#f0f0f0"/>
      <rect x={width*0.1}  y={h*0.216} width={width*0.44} height={h*0.016} rx="3" fill="#555"/>
      <rect x={width*0.1}  y={h*0.24}  width={width*0.28} height={h*0.014} rx="3" fill="#aaa"/>
      {/* me */}
      <rect x={width*0.34} y={h*0.3}  width={width*0.6}  height={h*0.055} rx="10" fill="#111"/>
      <rect x={width*0.4}  y={h*0.315} width={width*0.46} height={h*0.016} rx="3" fill="rgba(255,255,255,0.8)"/>
      {/* them */}
      <rect x={width*0.06} y={h*0.39} width={width*0.72} height={h*0.085} rx="10" fill="#f0f0f0"/>
      <rect x={width*0.1}  y={h*0.405} width={width*0.55} height={h*0.016} rx="3" fill="#555"/>
      <rect x={width*0.1}  y={h*0.43}  width={width*0.38} height={h*0.014} rx="3" fill="#aaa"/>
      <rect x={width*0.1}  y={h*0.452} width={width*0.28} height={h*0.014} rx="3" fill="#bbb"/>
      {/* me */}
      <rect x={width*0.28} y={h*0.51} width={width*0.66} height={h*0.055} rx="10" fill="#111"/>
      <rect x={width*0.34} y={h*0.525} width={width*0.52} height={h*0.016} rx="3" fill="rgba(255,255,255,0.8)"/>
      {/* typing indicator */}
      <rect x={width*0.06} y={h*0.6} width={width*0.28} height={h*0.048} rx="10" fill="#f0f0f0"/>
      {[0,1,2].map(i=>(
        <circle key={i} cx={width*(0.12+i*0.062)} cy={h*0.624} r={width*0.022} fill="#bbb"/>
      ))}
      {/* Input bar */}
      <rect x={0} y={h*0.88} width={width} height={h*0.12} fill="#fafafa"/>
      <line x1={0} y1={h*0.88} x2={width} y2={h*0.88} stroke="#eee" strokeWidth="0.8"/>
      <rect x={width*0.06} y={h*0.898} width={width*0.72} height={h*0.048} rx={h*0.024} fill="#efefef"/>
      <rect x={width*0.82} y={h*0.898} width={width*0.12} height={h*0.048} rx={h*0.024} fill="#111"/>
    </>
  );

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none">
      {/* Phone frame */}
      <rect x={0} y={0} width={width} height={h} rx={rx} fill="#111"/>
      {/* Screen glass */}
      <rect x={width*0.04} y={h*0.025} width={width*0.92} height={h*0.95} rx={rx*0.85} fill="#fafafa"/>
      {/* Dynamic island */}
      <rect x={width*0.35} y={h*0.034} width={width*0.3} height={h*0.025} rx={h*0.013} fill="#111"/>
      {/* Side buttons */}
      <rect x={-1} y={h*0.22} width="2.5" height={h*0.06}  rx="1.5" fill="#222"/>
      <rect x={-1} y={h*0.30} width="2.5" height={h*0.08}  rx="1.5" fill="#222"/>
      <rect x={-1} y={h*0.40} width="2.5" height={h*0.08}  rx="1.5" fill="#222"/>
      <rect x={width-1.5} y={h*0.28} width="2.5" height={h*0.12} rx="1.5" fill="#222"/>

      {/* Screen content */}
      {screen === "search"  && <SearchScreen/>}
      {screen === "booking" && <BookingScreen/>}
      {screen === "chat"    && <ChatScreen/>}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Background cloud blobs
═══════════════════════════════════════════════════════ */
function CloudBlobs({ progress }) {
  const y1 = useTransform(progress, [0, 1], ["0%",  "-18%"]);
  const y2 = useTransform(progress, [0, 1], ["0%",  "-10%"]);
  const y3 = useTransform(progress, [0, 1], ["0%",  "-24%"]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div style={{ y: y1 }}
        className="absolute rounded-full"
        style={{
          width: 700, height: 700,
          top: -200, left: -180,
          background: "radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)",
          filter: "blur(60px)", y: y1
        }}/>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          top: 100, right: -150,
          background: "radial-gradient(circle, rgba(0,0,0,0.025) 0%, transparent 70%)",
          filter: "blur(70px)", y: y2
        }}/>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          bottom: -100, left: "30%",
          background: "radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)",
          filter: "blur(55px)", y: y3
        }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Feature Section (scroll reveal)
═══════════════════════════════════════════════════════ */
function FeatureSection({ num, title, body, screen, flip = false }) {
  return (
    <section className="min-h-screen flex items-center px-6 py-24 bg-white overflow-hidden">
      <div className={`max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${flip ? "lg:flex-row-reverse" : ""}`}
        style={{ direction: flip ? "rtl" : "ltr" }}>

        {/* Text side */}
        <motion.div
          style={{ direction: "ltr" }}
          initial={{ opacity: 0, x: flip ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 mb-5"
            style={{ fontFamily: "'Inter',sans-serif" }}>{num}</p>
          <div className="w-8 h-[1px] bg-zinc-200 mb-8"/>
          <h2 className="font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">{title}</h2>
          <p className="text-base text-zinc-500 leading-relaxed max-w-md"
            style={{ fontFamily: "'Inter',sans-serif" }}>{body}</p>
          <Link to="/search"
            className="inline-flex items-center gap-2 mt-10 text-sm font-medium text-zinc-900
                       border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
            style={{ fontFamily: "'Inter',sans-serif" }}>
            Entdecken
            <ArrowRight size={13} strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-1"/>
          </Link>
        </motion.div>

        {/* Phone side */}
        <motion.div
          style={{ direction: "ltr" }}
          initial={{ opacity: 0, y: 60, rotateY: flip ? -18 : 18 }}
          whileInView={{ opacity: 1, y: 0, rotateY: flip ? -8 : 8 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          className="flex justify-center"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.12)) drop-shadow(0 8px 16px rgba(0,0,0,0.08))" }}
          >
            <PhoneMockup screen={screen} width={220}/>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Landing Page
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(heroProgress, { stiffness: 50, damping: 20 });

  /* Phone parallax on scroll through hero */
  const p1Y = useTransform(smooth, [0, 1], [0, -180]);
  const p2Y = useTransform(smooth, [0, 1], [0, -120]);
  const p3Y = useTransform(smooth, [0, 1], [0, -220]);

  /* Hero text fades on scroll */
  const heroTextOp = useTransform(smooth, [0, 0.55], [1, 0]);
  const heroTextY  = useTransform(smooth, [0, 0.55], [0, -60]);

  /* Full-page scroll for background */
  const { scrollYProgress: pageProgress } = useScroll();
  const pageProg = useSpring(pageProgress, { stiffness: 30, damping: 20 });

  return (
    <div className="bg-white overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-white"
      >
        <CloudBlobs progress={pageProg} />

        {/* ── 3D Device Stage ── */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1400px" }}>

          {/* Phone 1 – Left, tilted toward viewer */}
          <motion.div
            style={{ y: p1Y }}
            className="absolute"
            initial={{ x: -400, y: 300, opacity: 0, rotateY: 35, rotateX: -8 }}
            animate={{ x: "-28vw", y: "4vh", opacity: 1, rotateY: 22, rotateX: -4 }}
            transition={{ type: "spring", stiffness: 48, damping: 16, delay: 0.15 }}
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              style={{
                filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.13)) drop-shadow(0 8px 20px rgba(0,0,0,0.07))",
                transformStyle: "preserve-3d"
              }}
            >
              <PhoneMockup screen="search" width={180}/>
            </motion.div>
          </motion.div>

          {/* Phone 2 – Center, closest to viewer (largest) */}
          <motion.div
            style={{ y: p2Y }}
            className="absolute"
            initial={{ y: -500, opacity: 0, rotateY: -5, scale: 0.65 }}
            animate={{ y: "-6vh",  opacity: 1, rotateY: -4, scale: 1 }}
            transition={{ type: "spring", stiffness: 42, damping: 15, delay: 0.35 }}
          >
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              style={{
                filter: "drop-shadow(0 50px 80px rgba(0,0,0,0.16)) drop-shadow(0 12px 24px rgba(0,0,0,0.1))",
                transformStyle: "preserve-3d"
              }}
            >
              <PhoneMockup screen="booking" width={210}/>
            </motion.div>
          </motion.div>

          {/* Phone 3 – Right, tilted away */}
          <motion.div
            style={{ y: p3Y }}
            className="absolute"
            initial={{ x: 400, y: 350, opacity: 0, rotateY: -35, rotateX: 8 }}
            animate={{ x: "28vw", y: "8vh", opacity: 1, rotateY: -20, rotateX: 3 }}
            transition={{ type: "spring", stiffness: 48, damping: 16, delay: 0.25 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              style={{
                filter: "drop-shadow(0 36px 56px rgba(0,0,0,0.11)) drop-shadow(0 6px 16px rgba(0,0,0,0.07))",
                transformStyle: "preserve-3d"
              }}
            >
              <PhoneMockup screen="chat" width={168}/>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Hero Text (bottom center) ── */}
        <motion.div
          style={{ opacity: heroTextOp, y: heroTextY }}
          className="absolute bottom-0 left-0 right-0 text-center pb-16 pointer-events-none select-none"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="font-playfair font-bold text-zinc-950 leading-none tracking-tight mb-4"
            style={{ fontSize: "clamp(56px, 9vw, 104px)" }}
          >
            InkBook
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0, ease: [0.4, 0, 0.2, 1] }}
            className="text-xs text-zinc-400 tracking-[0.26em] uppercase mb-8"
            style={{ fontFamily: "'Inter',sans-serif" }}
          >
            Premium Tattoo Buchungsplattform
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto"
          >
            <Link to="/search"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-zinc-950 text-white
                         rounded-full text-[13px] font-medium hover:bg-zinc-700 transition-all
                         duration-300 hover:gap-5 group shadow-lg shadow-black/10"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll arrow */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ChevronDown size={18} className="text-zinc-300" strokeWidth={1.5}/>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE SECTIONS  (3 full pages)
          ══════════════════════════════════════ */}
      <FeatureSection
        num="01"
        title={<>Finde dein<br/>perfektes Studio.</>}
        body="Durchsuche Hunderte kuratierter Tattoo-Studios in deiner Nähe. Vergleiche Stile, Preise und echte Kundenbewertungen – alles auf einen Blick, ohne endloses Googeln."
        screen="search"
        flip={false}
      />

      <FeatureSection
        num="02"
        title={<>Buche direkt.<br/>Ohne Wartezeit.</>}
        body="Sehe verfügbare Termine in Echtzeit und buche mit einem Klick. Kein Telefonieren, kein Warten auf Antworten. Wähle Stil, Datum und Uhrzeit – fertig."
        screen="booking"
        flip={true}
      />

      <FeatureSection
        num="03"
        title={<>Kommuniziere.<br/>Direkt im Chat.</>}
        body="Schreibe deinem Studio direkt in der App. Teile Referenzbilder, bespreche Details und erhalte professionelle Beratung – alles an einem Ort, sicher und übersichtlich."
        screen="chat"
        flip={false}
      />

      {/* ══════════════════════════════════════
          STATS + CTA SECTION
          ══════════════════════════════════════ */}
      <section className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-20 max-w-2xl"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-5"
            style={{ fontFamily: "'Inter',sans-serif" }}>Zahlen die überzeugen</p>
          <h2 className="font-playfair text-4xl sm:text-5xl text-white leading-tight">
            Tausende Buchungen.<br/>Ein Ziel.
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-12 sm:gap-24 mb-24 text-center">
          {[
            { v: "500+", l: "Studios" },
            { v: "10k+", l: "Buchungen" },
            { v: "4.9★", l: "Bewertung" },
          ].map(({ v, l }, i) => (
            <motion.div key={l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <p className="font-playfair text-4xl sm:text-5xl text-white font-bold">{v}</p>
              <p className="text-xs text-zinc-500 mt-2 tracking-wide"
                style={{ fontFamily: "'Inter',sans-serif" }}>{l}</p>
            </motion.div>
          ))}
        </div>

        {/* Dual CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link to="/search"
            className="inline-flex items-center gap-3 px-9 py-4 bg-white text-zinc-950 rounded-full
                       text-[13px] font-medium hover:bg-zinc-100 transition-all duration-300
                       hover:gap-5 group"
            style={{ fontFamily: "'Inter',sans-serif" }}>
            Studios entdecken
            <ArrowRight size={14} strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-1"/>
          </Link>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-9 py-4 border border-zinc-700 text-zinc-300
                       rounded-full text-[13px] font-medium hover:border-zinc-500 hover:text-white
                       transition-all duration-300"
            style={{ fontFamily: "'Inter',sans-serif" }}>
            Kostenlos registrieren
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="font-playfair text-white font-semibold text-sm">InkBook</p>
          <p className="text-[11px] text-zinc-600" style={{ fontFamily: "'Inter',sans-serif" }}>
            © 2026 InkBook · Alle Rechte vorbehalten
          </p>
          <div className="flex gap-6">
            {[
              { to: "/login",    l: "Anmelden"     },
              { to: "/register", l: "Registrieren"  },
              { to: "/search",   l: "Studios"       },
            ].map(({ to, l }) => (
              <Link key={to} to={to}
                className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                style={{ fontFamily: "'Inter',sans-serif" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
