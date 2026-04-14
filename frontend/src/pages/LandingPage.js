import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════
   SVG Phone Mockup
══════════════════════════════════════════════ */
function Phone({ screen = "search", width = 200, className = "", style = {} }) {
  const h = width * 2.05;
  const rx = width * 0.14;

  const Search = () => (
    <>
      <rect x={width*.06} y={h*.10} width={width*.88} height={h*.075} rx="8" fill="#111"/>
      <rect x={width*.13} y={h*.123} width={width*.4} height={h*.022} rx="3" fill="rgba(255,255,255,.85)"/>
      <rect x={width*.06} y={h*.20} width={width*.88} height={h*.06} rx={h*.03} fill="#f2f2f2"/>
      <rect x={width*.14} y={h*.222} width={width*.46} height={h*.018} rx="3" fill="#bbb"/>
      {[0,1].map(i=>(
        <g key={i}>
          <rect x={width*.06} y={h*(.30+i*.19)} width={width*.88} height={h*.17} rx="10" fill={i===0?"#efefef":"#e8e8e8"}/>
          <rect x={width*.06} y={h*(.30+i*.19)} width={width*.37} height={h*.17} rx="10" fill={i===0?"#d5d5d5":"#cacaca"}/>
          <rect x={width*.49} y={h*(.31+i*.19)} width={width*.34} height={h*.02} rx="3" fill="#333"/>
          <rect x={width*.49} y={h*(.34+i*.19)} width={width*.24} height={h*.015} rx="3" fill="#999"/>
          {[0,1,2,3,4].map(s=>(
            <rect key={s} x={width*(.49+s*.046)} y={h*(.365+i*.19)} width={width*.032} height={h*.012} rx="2" fill={i===0?"#111":"#555"}/>
          ))}
        </g>
      ))}
      <rect x={0} y={h*.88} width={width} height={h*.12} fill="#fff"/>
      <line x1={0} y1={h*.88} x2={width} y2={h*.88} stroke="#eee" strokeWidth=".8"/>
      {[0,1,2,3].map(i=>(
        <rect key={i} x={width*(.1+i*.22)} y={h*.916} width={width*.08} height={h*.024} rx="3" fill={i===0?"#111":"#ccc"}/>
      ))}
    </>
  );

  const Booking = () => (
    <>
      <rect x={width*.06} y={h*.10} width={width*.88} height={h*.07} rx="8" fill="#111"/>
      <rect x={width*.13} y={h*.124} width={width*.42} height={h*.022} rx="3" fill="rgba(255,255,255,.85)"/>
      <rect x={width*.06} y={h*.20} width={width*.88} height={h*.055} rx="8" fill="#f7f7f7"/>
      <rect x={width*.28} y={h*.216} width={width*.44} height={h*.02} rx="3" fill="#555"/>
      {["Mo","Di","Mi","Do","Fr","Sa","So"].map((_,i)=>(
        <rect key={i} x={width*(.065+i*.127)} y={h*.285} width={width*.092} height={h*.018} rx="2" fill="#ccc"/>
      ))}
      {Array.from({length:35},(_,i)=>{
        const col=i%7, row=Math.floor(i/7);
        return <rect key={i} x={width*(.065+col*.127)} y={h*(.325+row*.065)} width={width*.092} height={h*.05} rx="6"
          fill={i===10?"#111":i<5?"#f9f9f9":"#efefef"}/>;
      })}
      {[0,1,2].map(i=>(
        <rect key={i} x={width*.06} y={h*(.70+i*.063)} width={width*.88} height={h*.05} rx="8"
          fill={i===1?"#111":"#f2f2f2"}/>
      ))}
      <rect x={width*.06} y={h*.875} width={width*.88} height={h*.06} rx={h*.03} fill="#111"/>
      <rect x={width*.26} y={h*.891} width={width*.48} height={h*.02} rx="3" fill="rgba(255,255,255,.9)"/>
    </>
  );

  const Chat = () => (
    <>
      <rect x={0} y={h*.08} width={width} height={h*.095} fill="#fff"/>
      <circle cx={width*.18} cy={h*.127} r={width*.09} fill="#e0e0e0"/>
      <rect x={width*.32} y={h*.11}  width={width*.38} height={h*.02} rx="3" fill="#222"/>
      <rect x={width*.32} y={h*.137} width={width*.25} height={h*.014} rx="3" fill="#aaa"/>
      <line x1={0} y1={h*.175} x2={width} y2={h*.175} stroke="#eee" strokeWidth=".8"/>
      {/* messages */}
      <rect x={width*.06} y={h*.20}  width={width*.58} height={h*.06} rx="10" fill="#f0f0f0"/>
      <rect x={width*.1}  y={h*.215} width={width*.44} height={h*.016} rx="3" fill="#555"/>
      <rect x={width*.36} y={h*.295} width={width*.58} height={h*.055} rx="10" fill="#111"/>
      <rect x={width*.42} y={h*.31}  width={width*.44} height={h*.016} rx="3" fill="rgba(255,255,255,.8)"/>
      <rect x={width*.06} y={h*.385} width={width*.7}  height={h*.08} rx="10" fill="#f0f0f0"/>
      <rect x={width*.1}  y={h*.40}  width={width*.54} height={h*.016} rx="3" fill="#555"/>
      <rect x={width*.1}  y={h*.425} width={width*.38} height={h*.014} rx="3" fill="#aaa"/>
      <rect x={width*.28} y={h*.50}  width={width*.66} height={h*.055} rx="10" fill="#111"/>
      <rect x={width*.34} y={h*.515} width={width*.52} height={h*.016} rx="3" fill="rgba(255,255,255,.8)"/>
      <rect x={width*.06} y={h*.595} width={width*.28} height={h*.045} rx="10" fill="#f0f0f0"/>
      {[0,1,2].map(i=>(
        <circle key={i} cx={width*(.12+i*.063)} cy={h*.618} r={width*.022} fill="#bbb"/>
      ))}
      <rect x={0} y={h*.88} width={width} height={h*.12} fill="#fafafa"/>
      <line x1={0} y1={h*.88} x2={width} y2={h*.88} stroke="#eee" strokeWidth=".8"/>
      <rect x={width*.06} y={h*.898} width={width*.72} height={h*.048} rx={h*.024} fill="#efefef"/>
      <rect x={width*.82} y={h*.898} width={width*.12} height={h*.048} rx={h*.024} fill="#111"/>
    </>
  );

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none"
      className={className} style={style}>
      <rect width={width} height={h} rx={rx} fill="#111"/>
      <rect x={width*.04} y={h*.025} width={width*.92} height={h*.95} rx={rx*.85} fill="#fafafa"/>
      <rect x={width*.35} y={h*.034} width={width*.3} height={h*.025} rx={h*.013} fill="#111"/>
      <rect x={-1} y={h*.22} width="2.5" height={h*.06}  rx="1.5" fill="#1e1e1e"/>
      <rect x={-1} y={h*.30} width="2.5" height={h*.08}  rx="1.5" fill="#1e1e1e"/>
      <rect x={-1} y={h*.40} width="2.5" height={h*.08}  rx="1.5" fill="#1e1e1e"/>
      <rect x={width-1.5} y={h*.28} width="2.5" height={h*.12} rx="1.5" fill="#1e1e1e"/>
      {screen==="search"  && <Search/>}
      {screen==="booking" && <Booking/>}
      {screen==="chat"    && <Chat/>}
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Smoke / Cloud Background
══════════════════════════════════════════════ */
function SmokeBg({ dark = true }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)}   40%{transform:translate(60px,-40px) scale(1.12)} 70%{transform:translate(-40px,30px) scale(.95)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1.05)} 35%{transform:translate(-80px,50px) scale(.9)} 65%{transform:translate(50px,-60px) scale(1.08)} }
        @keyframes drift3 { 0%,100%{transform:translate(0,0) scale(.95)}  50%{transform:translate(40px,70px) scale(1.1)} }
        @keyframes drift4 { 0%,100%{transform:translate(0,0)}  30%{transform:translate(-50px,-30px)} 70%{transform:translate(30px,50px)} }
        .smoke1{animation:drift1 22s ease-in-out infinite}
        .smoke2{animation:drift2 18s ease-in-out infinite .8s}
        .smoke3{animation:drift3 26s ease-in-out infinite 1.6s}
        .smoke4{animation:drift4 14s ease-in-out infinite 3s}
      `}</style>

      {dark ? (
        <>
          <div className="smoke1 absolute rounded-full"
            style={{width:700,height:700,top:-200,left:-150,
              background:"radial-gradient(circle,rgba(255,255,255,.055) 0%,transparent 65%)",filter:"blur(80px)"}}/>
          <div className="smoke2 absolute rounded-full"
            style={{width:600,height:600,top:200,right:-200,
              background:"radial-gradient(circle,rgba(255,255,255,.04) 0%,transparent 65%)",filter:"blur(90px)"}}/>
          <div className="smoke3 absolute rounded-full"
            style={{width:500,height:500,bottom:-100,left:"25%",
              background:"radial-gradient(circle,rgba(255,255,255,.045) 0%,transparent 65%)",filter:"blur(70px)"}}/>
          <div className="smoke4 absolute rounded-full"
            style={{width:400,height:400,top:"40%",left:"40%",
              background:"radial-gradient(circle,rgba(180,180,180,.03) 0%,transparent 70%)",filter:"blur(60px)"}}/>
          {/* SVG turbulence overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="xMidYMid slice">
            <filter id="smoke-dark">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.008" numOctaves="4" seed="2"/>
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#smoke-dark)"/>
          </svg>
        </>
      ) : (
        <>
          <div className="smoke1 absolute rounded-full"
            style={{width:700,height:700,top:-200,right:-150,
              background:"radial-gradient(circle,rgba(0,0,0,.04) 0%,transparent 65%)",filter:"blur(80px)"}}/>
          <div className="smoke2 absolute rounded-full"
            style={{width:600,height:600,bottom:0,left:-200,
              background:"radial-gradient(circle,rgba(0,0,0,.03) 0%,transparent 65%)",filter:"blur(90px)"}}/>
          <div className="smoke3 absolute rounded-full"
            style={{width:450,height:450,top:"30%",right:"20%",
              background:"radial-gradient(circle,rgba(0,0,0,.025) 0%,transparent 65%)",filter:"blur(70px)"}}/>
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" preserveAspectRatio="xMidYMid slice">
            <filter id="smoke-light">
              <feTurbulence type="fractalNoise" baseFrequency="0.01 0.007" numOctaves="4" seed="5"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#smoke-light)"/>
          </svg>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  const wrapRef   = useRef(null);
  const heroRef   = useRef(null);
  const titleRef  = useRef(null);
  const phone1Ref = useRef(null);
  const phone2Ref = useRef(null);
  const phone3Ref = useRef(null);
  const taglineRef= useRef(null);
  const ctaRef    = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ── 1. TITLE: chars fly in with 3D tumble ── */
      const chars = titleRef.current?.querySelectorAll(".char");
      if (chars?.length) {
        gsap.set(chars, { transformPerspective: 600, transformOrigin: "50% 100% -30px" });
        gsap.from(chars, {
          duration: 1.1,
          opacity: 0,
          rotateX: -90,
          y: 60,
          stagger: 0.05,
          ease: "back.out(1.5)",
          delay: 0.2,
        });
      }

      /* ── 2. PHONES: pinned hero, 3D scroll-driven rotation ── */
      const heroEl = heroRef.current;

      // Initial entrance (no scroll needed)
      gsap.from(phone1Ref.current, {
        x: -500, rotateY: -85, rotateX: -20, opacity: 0, duration: 1.4,
        ease: "expo.out", delay: 0.5,
      });
      gsap.from(phone2Ref.current, {
        y: -500, rotateX: 70, opacity: 0, scale: 0.6, duration: 1.5,
        ease: "expo.out", delay: 0.65,
      });
      gsap.from(phone3Ref.current, {
        x: 500, rotateY: 85, rotateX: 20, opacity: 0, duration: 1.4,
        ease: "expo.out", delay: 0.55,
      });

      /* Scroll: phones rotate & drift as user scrolls through hero */
      gsap.to(phone1Ref.current, {
        rotateY: 35,
        rotateX: 8,
        y: -160,
        scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: 0.9 },
      });
      gsap.to(phone2Ref.current, {
        rotateY: -8,
        rotateX: -12,
        y: -200,
        scale: 0.88,
        scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: 0.9 },
      });
      gsap.to(phone3Ref.current, {
        rotateY: -38,
        rotateX: 10,
        y: -140,
        scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: 0.9 },
      });

      /* ── 3. TAGLINE + CTA fade in ── */
      gsap.from(taglineRef.current, {
        opacity: 0, y: 24, duration: 1, ease: "power3.out", delay: 1.2,
      });
      gsap.from(ctaRef.current, {
        opacity: 0, y: 16, scale: 0.93, duration: 0.9, ease: "back.out(1.4)", delay: 1.5,
      });

      /* ── 4. FEATURE sections: phone barrel rolls + text clips ── */
      const features = wrapRef.current?.querySelectorAll(".feat-section");
      features?.forEach((section, i) => {
        const phone  = section.querySelector(".feat-phone");
        const textEl = section.querySelector(".feat-text");
        const lines  = section.querySelectorAll(".feat-line");
        const dir    = i % 2 === 0 ? 1 : -1;

        if (phone) {
          gsap.fromTo(phone,
            { x: dir * 300, rotateY: dir * 70, rotateX: -15, opacity: 0 },
            { x: 0,          rotateY: dir * 8,  rotateX: 0,   opacity: 1,
              duration: 1.4, ease: "expo.out",
              scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none reverse" }
            }
          );
          /* Idle float + counter-rotation on section scroll */
          gsap.to(phone, {
            rotateY: dir * -4,
            rotateX: 4,
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.2 },
          });
        }

        if (lines?.length) {
          gsap.fromTo(lines,
            { y: 60, opacity: 0, clipPath: "inset(0 0 100% 0)" },
            { y: 0,  opacity: 1, clipPath: "inset(0 0 0% 0)",
              stagger: 0.12, duration: 0.9, ease: "expo.out",
              scrollTrigger: { trigger: section, start: "top 70%", toggleActions: "play none none reverse" }
            }
          );
        }
      });

      /* ── 5. STATS: count-up feel ── */
      const stats = wrapRef.current?.querySelectorAll(".stat-item");
      stats?.forEach((el, i) => {
        gsap.fromTo(el,
          { y: 50, opacity: 0, scale: 0.85 },
          { y: 0,  opacity: 1, scale: 1,
            duration: 0.8, ease: "back.out(1.8)", delay: i * 0.12,
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
          }
        );
      });

      /* ── 6. Parallax on all .parallax elements ── */
      wrapRef.current?.querySelectorAll(".parallax-slow").forEach(el => {
        gsap.to(el, {
          y: -80,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.5 },
        });
      });

    }, wrapRef);

    return () => ctx.revert();
  }, []);

  /* Split title text into individual chars */
  const titleChars = "InkBook".split("").map((c, i) => (
    <span key={i} className="char inline-block" style={{ willChange: "transform, opacity" }}>{c}</span>
  ));

  return (
    <div ref={wrapRef} className="overflow-x-hidden" style={{ background: "#080808" }}>
      <Navbar />

      {/* ═══════════════════════════════════════
          HERO — Dark, smoky, immediate 3D
          ═══════════════════════════════════════ */}
      <section ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-end pb-16 overflow-hidden"
        style={{ background: "#080808" }}>

        <SmokeBg dark/>

        {/* 3D phone stage */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}>

          {/* Phone 1 – left */}
          <div ref={phone1Ref} className="absolute"
            style={{ transformStyle: "preserve-3d",
              filter: "drop-shadow(0 40px 80px rgba(0,0,0,.8)) drop-shadow(0 4px 20px rgba(255,255,255,.04))",
              left: "calc(50% - 340px)", top: "50%", marginTop: -200 }}>
            <Phone screen="search" width={170}/>
          </div>

          {/* Phone 2 – center, biggest */}
          <div ref={phone2Ref} className="absolute"
            style={{ transformStyle: "preserve-3d",
              filter: "drop-shadow(0 60px 100px rgba(0,0,0,.9)) drop-shadow(0 4px 24px rgba(255,255,255,.06))",
              left: "calc(50% - 105px)", top: "50%", marginTop: -220 }}>
            <Phone screen="booking" width={210}/>
          </div>

          {/* Phone 3 – right */}
          <div ref={phone3Ref} className="absolute"
            style={{ transformStyle: "preserve-3d",
              filter: "drop-shadow(0 36px 70px rgba(0,0,0,.75)) drop-shadow(0 4px 16px rgba(255,255,255,.04))",
              left: "calc(50% + 160px)", top: "50%", marginTop: -185 }}>
            <Phone screen="chat" width={158}/>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 text-center">
          <h1 ref={titleRef}
            className="font-playfair font-bold text-white leading-none tracking-tight mb-4 parallax-slow"
            style={{ fontSize: "clamp(68px, 11vw, 130px)", transformPerspective: 800 }}>
            {titleChars}
          </h1>
          <p ref={taglineRef}
            className="text-[11px] tracking-[0.3em] uppercase mb-8"
            style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.35)" }}>
            Premium Tattoo Buchungsplattform
          </p>
          <div ref={ctaRef}>
            <Link to="/search"
              className="inline-flex items-center gap-3 px-9 py-3.5 rounded-full text-[13px] font-medium
                         transition-all duration-300 hover:gap-5 group"
              style={{ fontFamily: "'Inter',sans-serif",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.15)",
                color: "rgba(255,255,255,.9)",
                backdropFilter: "blur(16px)" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #080808)" }}/>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE 1 — White smoke, Search
          ═══════════════════════════════════════ */}
      <section className="feat-section relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <SmokeBg dark={false}/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="feat-text">
            <p className="feat-line text-[10px] tracking-[0.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily: "'Inter',sans-serif" }}>01 — Discover</p>
            <div className="feat-line w-10 h-[1px] bg-zinc-200 mb-7"/>
            <h2 className="feat-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Finde dein<br/>perfektes Studio.
            </h2>
            <p className="feat-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Hunderte kuratierter Studios. Echte Bewertungen. Klare Preise.
              Alles auf einen Blick – ohne endloses Googeln.
            </p>
            <Link to="/search"
              className="feat-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900
                         border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Jetzt suchen
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
          <div className="feat-phone flex justify-center" style={{ perspective: "1000px" }}>
            <div style={{ filter: "drop-shadow(0 40px 60px rgba(0,0,0,.14)) drop-shadow(0 8px 20px rgba(0,0,0,.08))", transformStyle: "preserve-3d" }}>
              <Phone screen="search" width={230}/>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE 2 — Dark smoke, Booking
          ═══════════════════════════════════════ */}
      <section className="feat-section relative min-h-screen flex items-center px-6 py-28 overflow-hidden"
        style={{ background: "#0d0d0d" }}>
        <SmokeBg dark/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="feat-phone order-2 lg:order-1 flex justify-center" style={{ perspective: "1000px" }}>
            <div style={{ filter: "drop-shadow(0 50px 80px rgba(0,0,0,.9)) drop-shadow(0 4px 20px rgba(255,255,255,.04))", transformStyle: "preserve-3d" }}>
              <Phone screen="booking" width={230}/>
            </div>
          </div>
          <div className="feat-text order-1 lg:order-2">
            <p className="feat-line text-[10px] tracking-[0.28em] uppercase mb-5"
              style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.3)" }}>02 — Book</p>
            <div className="feat-line w-10 h-[1px] mb-7" style={{ background: "rgba(255,255,255,.12)" }}/>
            <h2 className="feat-line font-playfair text-4xl sm:text-5xl leading-tight mb-6"
              style={{ color: "rgba(255,255,255,.95)" }}>
              Buche direkt.<br/>Ohne Wartezeit.
            </h2>
            <p className="feat-line text-base leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.45)" }}>
              Verfügbare Slots in Echtzeit. Ein Klick, ein Termin.
              Kein Telefonieren, kein Warten auf Rückmeldung.
            </p>
            <Link to="/search"
              className="feat-line inline-flex items-center gap-2 text-sm font-medium transition-colors group"
              style={{ fontFamily: "'Inter',sans-serif",
                color: "rgba(255,255,255,.7)",
                borderBottom: "1px solid rgba(255,255,255,.2)",
                paddingBottom: "2px" }}>
              Termin buchen
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE 3 — White smoke, Chat
          ═══════════════════════════════════════ */}
      <section className="feat-section relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <SmokeBg dark={false}/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="feat-text">
            <p className="feat-line text-[10px] tracking-[0.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily: "'Inter',sans-serif" }}>03 — Connect</p>
            <div className="feat-line w-10 h-[1px] bg-zinc-200 mb-7"/>
            <h2 className="feat-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Kommuniziere.<br/>Direkt im Chat.
            </h2>
            <p className="feat-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Schreibe dem Studio direkt. Teile Bilder, besprich Ideen –
              klar, einfach, ohne Umwege.
            </p>
            <Link to="/register"
              className="feat-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900
                         border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              Kostenlos starten
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
          <div className="feat-phone flex justify-center" style={{ perspective: "1000px" }}>
            <div style={{ filter: "drop-shadow(0 40px 60px rgba(0,0,0,.14)) drop-shadow(0 8px 20px rgba(0,0,0,.07))", transformStyle: "preserve-3d" }}>
              <Phone screen="chat" width={230}/>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA — Deep dark finale
          ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-32 px-6 overflow-hidden"
        style={{ background: "#050505" }}>
        <SmokeBg dark/>

        {/* Radial glow center */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.04) 0%, transparent 60%)" }}/>

        <div className="relative z-10 text-center max-w-3xl">
          <p className="stat-item text-[10px] tracking-[0.3em] uppercase mb-8"
            style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.25)" }}>
            Zahlen die überzeugen
          </p>
          <h2 className="stat-item font-playfair text-4xl sm:text-6xl leading-tight mb-16"
            style={{ color: "rgba(255,255,255,.95)" }}>
            Tausende Buchungen.<br/>Ein Ziel.
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-10 sm:gap-20 mb-20">
            {[["500+","Studios"],["10k+","Buchungen"],["4.9★","Bewertung"]].map(([v,l],i)=>(
              <div key={l} className="stat-item">
                <p className="font-playfair text-4xl sm:text-5xl font-bold"
                  style={{ color: "rgba(255,255,255,.95)" }}>{v}</p>
                <p className="text-xs mt-2 tracking-wide"
                  style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.3)" }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Dual CTA */}
          <div className="stat-item flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full
                         text-[13px] font-medium hover:opacity-90 transition-all duration-300
                         hover:gap-5 group shadow-2xl"
              style={{ fontFamily: "'Inter',sans-serif", background: "#fff", color: "#111" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full
                         text-[13px] font-medium transition-all duration-300"
              style={{ fontFamily: "'Inter',sans-serif",
                border: "1px solid rgba(255,255,255,.18)",
                color: "rgba(255,255,255,.65)" }}>
              Kostenlos registrieren
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,.05)" }}
        className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <p className="font-playfair text-white font-semibold text-sm">InkBook</p>
          <p className="text-[11px]" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.22)" }}>
            © 2026 InkBook · Alle Rechte vorbehalten
          </p>
          <div className="flex gap-6">
            {[{to:"/login",l:"Anmelden"},{to:"/register",l:"Registrieren"},{to:"/search",l:"Studios"}].map(({to,l})=>(
              <Link key={to} to={to} className="text-[11px] transition-colors"
                style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.28)" }}
                onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.28)"}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
