import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════
   HTML/CSS Phone with real app screenshot
══════════════════════════════════════════════════════ */
function Phone({ src, width = 220, className = "", style = {} }) {
  const h = Math.round(width * 2.05);
  const r = Math.round(width * 0.13);
  return (
    <div
      className={className}
      style={{
        width, height: h,
        borderRadius: r,
        background: "#111",
        padding: "3px",
        boxShadow:
          "0 0 0 1px #1e1e1e, inset 0 0 0 1px rgba(255,255,255,.06), 0 60px 120px rgba(0,0,0,.6), 0 20px 40px rgba(0,0,0,.4)",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Side buttons */}
      {[{l:true,top:"22%",h:"6%"},{l:true,top:"30%",h:"8%"},{l:true,top:"40%",h:"8%"},{l:false,top:"28%",h:"12%"}]
        .map((b,i)=>(
        <div key={i} style={{
          position:"absolute", top:b.top, width:3, height:b.h, borderRadius:2,
          background:"#1a1a1a",
          left: b.l ? -3 : undefined, right: b.l ? undefined : -3
        }}/>
      ))}
      {/* Screen */}
      <div style={{
        width: "100%", height: "100%",
        borderRadius: r - 3,
        overflow: "hidden",
        background: "#0a0a0a",
        position: "relative",
      }}>
        {/* Dynamic island */}
        <div style={{
          position: "absolute", top: 10, left: "50%",
          transform: "translateX(-50%)",
          width: "30%", height: 11,
          background: "#000", borderRadius: 6,
          zIndex: 10,
        }}/>
        {/* Screenshot image */}
        <img
          src={src}
          alt=""
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
          }}
        />
        {/* Very subtle screen glass sheen */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 50%)",
          pointerEvents: "none", borderRadius: r - 3,
        }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Smoke / Cloud layers
══════════════════════════════════════════════════════ */
function Smoke({ dark = true }) {
  const c = dark
    ? ["rgba(255,255,255,.05)","rgba(255,255,255,.04)","rgba(255,255,255,.035)","rgba(200,200,200,.025)"]
    : ["rgba(0,0,0,.04)","rgba(0,0,0,.03)","rgba(0,0,0,.025)","rgba(30,30,30,.02)"];
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
      {[[700,700,-200,-150,c[0],80,"sm1"],[600,600,200,-200,c[1],90,"sm2"],[500,500,-100,"25%",c[2],70,"sm3"],[400,400,"40%","40%",c[3],60,"sm4"]].map(([w,h,t,l,bg,bl,cl],i)=>(
        <div key={i} className={cl} style={{position:"absolute",width:w,height:h,top:t,left:l,
          background:`radial-gradient(circle,${bg} 0%,transparent 65%)`,filter:`blur(${bl}px)`,borderRadius:"50%"}}/>
      ))}
      <svg className="absolute inset-0 w-full h-full" style={{opacity: dark ? .055 : .03}} preserveAspectRatio="xMidYMid slice">
        <filter id={dark?"sd":"sl"}>
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.007" numOctaves="4" seed={dark?2:5}/>
          <feColorMatrix type="matrix" values={dark
            ?"0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0"
            :"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0"}/>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${dark?"sd":"sl"})`}/>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Weather-Transition  (dark ↔ light with storm clearing)
══════════════════════════════════════════════════════ */
function WeatherTransition({ fromDark = true }) {
  const stops = fromDark
    ? ["#090909","#131313","#2a2a2a","#4a4a4a","#888","#c0c0c0","#e8e8e8","#ffffff"]
    : ["#ffffff","#e8e8e8","#c0c0c0","#888","#4a4a4a","#2a2a2a","#131313","#090909"];
  return (
    <div style={{
      height: 320,
      background: `linear-gradient(to bottom, ${stops.join(",")})`,
      position: "relative",
      zIndex: 5,
      overflow: "hidden",
    }}>
      <Smoke dark={fromDark}/>
      {/* Extra cloud wisps at transition center */}
      <div style={{
        position:"absolute", top:"30%", left:0, right:0,
        height:"40%",
        background: fromDark
          ? "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(255,255,255,.08) 0%, transparent 50%)"
          : "radial-gradient(ellipse at 35% 50%, rgba(0,0,0,.06) 0%, transparent 55%), radial-gradient(ellipse at 65% 45%, rgba(0,0,0,.04) 0%, transparent 50%)",
        filter: "blur(18px)",
        pointerEvents:"none",
      }}/>
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
  const phonesRef  = useRef(null);
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

      /* ── Phones spring in from 3 directions ── */
      const [p1,p2,p3] = phonesRef.current?.querySelectorAll(".hero-phone") ?? [];
      if (p1) gsap.from(p1, { x:-420, rotateY:-60, opacity:0, duration:1.5, ease:"expo.out", delay:0.45 });
      if (p2) gsap.from(p2, { y:-480, scale:.55, opacity:0, duration:1.6, ease:"expo.out", delay:0.6 });
      if (p3) gsap.from(p3, { x:420, rotateY:60, opacity:0, duration:1.5, ease:"expo.out", delay:0.5 });

      /* ── Hero scroll: phones ONLY fade + gentle lift, no rotation ── */
      phonesRef.current?.querySelectorAll(".hero-phone").forEach((p, i) => {
        const speeds = [0.7, 0.5, 0.65];
        gsap.to(p, {
          y: -90 * speeds[i],
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end:   "80% top",
            scrub: 1.2,
          },
        });
      });

      /* ── Hero tagline / CTA fade out on scroll ── */
      gsap.to([tagRef.current, ctaHeroRef.current], {
        opacity: 0, y: -40,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "10% top", end: "50% top", scrub: 1 },
      });

      /* ── Tagline + CTA entrance ── */
      gsap.from(tagRef.current,     { opacity:0, y:20, duration:1, ease:"power3.out", delay:1.2 });
      gsap.from(ctaHeroRef.current, { opacity:0, y:14, scale:.94, duration:.9, ease:"back.out(1.4)", delay:1.5 });

      /* ── Feature sections: barrel-roll phones + text reveal ── */
      wrapRef.current?.querySelectorAll(".feat-sec").forEach((sec, i) => {
        const phone = sec.querySelector(".f-phone");
        const lines = sec.querySelectorAll(".f-line");
        const dir   = i % 2 === 0 ? 1 : -1;

        if (phone) {
          gsap.fromTo(phone,
            { x: dir*280, rotateY: dir*55, opacity:0 },
            { x:0, rotateY: dir*6, opacity:1,
              duration:1.3, ease:"expo.out",
              scrollTrigger:{ trigger:sec, start:"top 78%", toggleActions:"play none none reverse" }
            }
          );
          gsap.to(phone, {
            rotateY: dir * -3,
            scrollTrigger:{ trigger:sec, start:"top bottom", end:"bottom top", scrub:1.4 },
          });
        }

        if (lines?.length) {
          gsap.fromTo(lines,
            { y:50, opacity:0, clipPath:"inset(0 0 100% 0)" },
            { y:0, opacity:1, clipPath:"inset(0 0 0% 0)",
              stagger:.11, duration:.85, ease:"expo.out",
              scrollTrigger:{ trigger:sec, start:"top 72%", toggleActions:"play none none reverse" }
            }
          );
        }
      });

      /* ── Stats bounce in ── */
      wrapRef.current?.querySelectorAll(".stat-i").forEach((el, i) => {
        gsap.fromTo(el,
          { y:45, opacity:0, scale:.8 },
          { y:0, opacity:1, scale:1, duration:.8, ease:"back.out(1.7)", delay: i*.13,
            scrollTrigger:{ trigger:el, start:"top 88%", toggleActions:"play none none reverse" }
          }
        );
      });

    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const titleChars = "InkBook".split("").map((c, i) => (
    <span key={i} className="ch" style={{ display:"inline-block", willChange:"transform,opacity" }}>
      {c}
    </span>
  ));

  return (
    <div ref={wrapRef} style={{ background:"#090909", overflowX:"hidden" }}>
      <Navbar/>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-end pb-14 overflow-hidden"
        style={{ background:"#090909" }}>
        <Smoke dark/>

        {/* 3 phones stage */}
        <div ref={phonesRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective:"1100px", perspectiveOrigin:"50% 42%" }}>

          {/* Phone 1 – left */}
          <div className="hero-phone absolute" style={{
            left:"calc(50% - 310px)", top:"50%", marginTop:-200,
            transformStyle:"preserve-3d",
          }}>
            <Phone src="/screenshots/search.jpg" width={165}/>
          </div>

          {/* Phone 2 – center, largest */}
          <div className="hero-phone absolute" style={{
            left:"calc(50% - 108px)", top:"50%", marginTop:-225,
            transformStyle:"preserve-3d",
          }}>
            <Phone src="/screenshots/booking.jpg" width={216}/>
          </div>

          {/* Phone 3 – right */}
          <div className="hero-phone absolute" style={{
            left:"calc(50% + 174px)", top:"50%", marginTop:-192,
            transformStyle:"preserve-3d",
          }}>
            <Phone src="/screenshots/chat.jpg" width={172}/>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 text-center">
          <h1 ref={titleRef}
            className="font-playfair font-bold text-white leading-none tracking-tight mb-3"
            style={{ fontSize:"clamp(64px,11vw,124px)", transformPerspective:800 }}>
            {titleChars}
          </h1>
          <p ref={tagRef}
            className="text-[11px] tracking-[.28em] uppercase mb-8"
            style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.32)" }}>
            Premium Tattoo Buchungsplattform
          </p>
          <div ref={ctaHeroRef}>
            <Link to="/search"
              className="inline-flex items-center gap-3 px-9 py-3.5 rounded-full text-[13px]
                         font-medium transition-all duration-300 hover:gap-5 group"
              style={{ fontFamily:"'Inter',sans-serif",
                background:"rgba(255,255,255,.09)",
                border:"1px solid rgba(255,255,255,.16)",
                color:"rgba(255,255,255,.88)",
                backdropFilter:"blur(14px)" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
        </div>

        {/* Bottom gradient fade to transition */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background:"linear-gradient(to bottom,transparent,#090909)" }}/>
      </section>

      {/* ════════ DARK → LIGHT TRANSITION ════════ */}
      <WeatherTransition fromDark={true}/>

      {/* ═══════════════════════════ FEATURE 1 – Search (White) ════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <Smoke dark={false}/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="f-line text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily:"'Inter',sans-serif" }}>01 — Discover</p>
            <div className="f-line w-10 h-[1px] bg-zinc-200 mb-7"/>
            <h2 className="f-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Finde dein<br/>perfektes Studio.
            </h2>
            <p className="f-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily:"'Inter',sans-serif" }}>
              Hunderte kuratierter Studios. Echte Bewertungen. Klare Preise.
              Stile filtern, vergleichen und direkt buchen.
            </p>
            <Link to="/search"
              className="f-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900
                         border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily:"'Inter',sans-serif" }}>
              Jetzt suchen
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
          <div className="f-phone flex justify-center" style={{ perspective:"1000px" }}>
            <Phone src="/screenshots/search.jpg" width={240}
              style={{ boxShadow:"0 50px 100px rgba(0,0,0,.18), 0 16px 32px rgba(0,0,0,.1)" }}/>
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK TRANSITION ════════ */}
      <WeatherTransition fromDark={false}/>

      {/* ═══════════════════════════ FEATURE 2 – Booking (Dark) ════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden"
        style={{ background:"#0d0d0d" }}>
        <Smoke dark/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="f-phone order-2 lg:order-1 flex justify-center" style={{ perspective:"1000px" }}>
            <Phone src="/screenshots/booking.jpg" width={240}/>
          </div>
          <div className="order-1 lg:order-2">
            <p className="f-line text-[10px] tracking-[.28em] uppercase mb-5"
              style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.28)" }}>02 — Book</p>
            <div className="f-line w-10 h-[1px] mb-7" style={{ background:"rgba(255,255,255,.1)" }}/>
            <h2 className="f-line font-playfair text-4xl sm:text-5xl leading-tight mb-6"
              style={{ color:"rgba(255,255,255,.94)" }}>
              Buche direkt.<br/>Ohne Wartezeit.
            </h2>
            <p className="f-line text-base leading-relaxed max-w-sm mb-10"
              style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.42)" }}>
              Verfügbare Slots in Echtzeit. Ein Klick, ein Termin.
              Kein Telefonieren, kein Warten auf Rückmeldung.
            </p>
            <Link to="/search"
              className="f-line inline-flex items-center gap-2 text-sm font-medium
                         transition-colors group"
              style={{ fontFamily:"'Inter',sans-serif",
                color:"rgba(255,255,255,.65)",
                borderBottom:"1px solid rgba(255,255,255,.18)", paddingBottom:2 }}>
              Termin buchen
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ DARK → LIGHT TRANSITION ════════ */}
      <WeatherTransition fromDark={true}/>

      {/* ═══════════════════════════ FEATURE 3 – Chat (White) ════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <Smoke dark={false}/>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="f-line text-[10px] tracking-[.28em] uppercase text-zinc-400 mb-5"
              style={{ fontFamily:"'Inter',sans-serif" }}>03 — Connect</p>
            <div className="f-line w-10 h-[1px] bg-zinc-200 mb-7"/>
            <h2 className="f-line font-playfair text-4xl sm:text-5xl text-zinc-950 leading-tight mb-6">
              Kommuniziere.<br/>Direkt im Chat.
            </h2>
            <p className="f-line text-base text-zinc-500 leading-relaxed max-w-sm mb-10"
              style={{ fontFamily:"'Inter',sans-serif" }}>
              Schreibe dem Studio direkt. Teile Referenzbilder, besprich
              Details – klar, schnell, ohne Umwege.
            </p>
            <Link to="/register"
              className="f-line inline-flex items-center gap-2 text-sm font-medium text-zinc-900
                         border-b border-zinc-200 pb-0.5 hover:border-zinc-900 transition-colors group"
              style={{ fontFamily:"'Inter',sans-serif" }}>
              Kostenlos starten
              <ArrowRight size={13} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
          </div>
          <div className="f-phone flex justify-center" style={{ perspective:"1000px" }}>
            <Phone src="/screenshots/chat.jpg" width={240}
              style={{ boxShadow:"0 50px 100px rgba(0,0,0,.18), 0 16px 32px rgba(0,0,0,.1)" }}/>
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK TRANSITION ════════ */}
      <WeatherTransition fromDark={false}/>

      {/* ═══════════════════════════ CTA FINALE ═══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-32 px-6 overflow-hidden"
        style={{ background:"#050505" }}>
        <Smoke dark/>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.035) 0%,transparent 58%)" }}/>

        <div className="relative z-10 text-center max-w-3xl">
          <p className="stat-i text-[10px] tracking-[.3em] uppercase mb-8"
            style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.22)" }}>
            Zahlen die überzeugen
          </p>
          <h2 className="stat-i font-playfair text-4xl sm:text-6xl leading-tight mb-16"
            style={{ color:"rgba(255,255,255,.94)" }}>
            Tausende Buchungen.<br/>Ein Ziel.
          </h2>
          <div className="grid grid-cols-3 gap-10 sm:gap-20 mb-20">
            {[["500+","Studios"],["10k+","Buchungen"],["4.9★","Bewertung"]].map(([v,l],i)=>(
              <div key={l} className="stat-i">
                <p className="font-playfair text-4xl sm:text-5xl font-bold"
                  style={{ color:"rgba(255,255,255,.94)" }}>{v}</p>
                <p className="text-xs mt-2 tracking-wide"
                  style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.28)" }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="stat-i flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full
                         text-[13px] font-medium hover:opacity-90 transition-all hover:gap-5 group"
              style={{ fontFamily:"'Inter',sans-serif", background:"#fff", color:"#111" }}>
              Studios entdecken
              <ArrowRight size={14} strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"/>
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full
                         text-[13px] font-medium transition-all"
              style={{ fontFamily:"'Inter',sans-serif",
                border:"1px solid rgba(255,255,255,.16)",
                color:"rgba(255,255,255,.6)" }}>
              Kostenlos registrieren
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"#050505", borderTop:"1px solid rgba(255,255,255,.05)" }}
        className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <p className="font-playfair text-white font-semibold text-sm">InkBook</p>
          <p className="text-[11px]" style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.2)" }}>
            © 2026 InkBook · Alle Rechte vorbehalten
          </p>
          <div className="flex gap-6">
            {[{to:"/login",l:"Anmelden"},{to:"/register",l:"Registrieren"},{to:"/search",l:"Studios"}].map(({to,l})=>(
              <Link key={to} to={to}
                className="text-[11px] transition-colors"
                style={{ fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.26)" }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.65)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.26)"}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
