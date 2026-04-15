import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════
   Custom Landing Navbar (transparent → glass on scroll)
══════════════════════════════════════════════════════ */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
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
      }}
    >
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%",
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} data-testid="landing-nav-logo">
          <div style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>I</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>InkBook</span>
        </Link>

        {/* Center links */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { to: "/search",     label: "Studios finden" },
            { to: "/ai-advisor", label: "KI-Stilberater" },
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

        {/* Right: auth + language */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "de" ? "en" : "de")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 20, border: "none",
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
            <Link to={dashboardPath}
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
              <Link to="/login"
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
              <Link to="/register"
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
        </div>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   iPhone Mockup
══════════════════════════════════════════════════════ */
function Phone({ src, width = 220, className = "", style = {} }) {
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
        <img src={src} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover",
          objectPosition: "top center", display: "block",
        }} />
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
   MacBook Mockup
══════════════════════════════════════════════════════ */
function MacBook({ src, width = 520, className = "", style = {} }) {
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
          <img src={src} alt="" style={{
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "top left", display: "block",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(140deg, rgba(255,255,255,.055) 0%, transparent 42%)",
            pointerEvents: "none",
          }} />
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

      /* ── Scroll parallax – NO fade-out ── */
      const phoneSpeeds = [0.68, 0.48, 0.62];
      phones.forEach((p, i) => {
        gsap.to(p, {
          y: -80 * phoneSpeeds[i], ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "100% top", scrub: 1.2 },
        });
      });
      if (macbook) {
        gsap.to(macbook, {
          y: -42, ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "100% top", scrub: 1.6 },
        });
      }

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
        className="relative min-h-screen flex flex-col items-center justify-end pb-14 overflow-hidden"
        style={{ background: "#090909" }}>
        <Smoke dark />

        {/* Devices stage */}
        <div ref={devicesRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 44%" }}>

          {/* MacBook – centered, behind phones */}
          <div className="hero-macbook absolute" style={{
            left: "50%", top: "50%", transform: "translateX(-50%)",
            marginTop: -190, transformStyle: "preserve-3d", zIndex: 1,
          }}>
            <MacBook src="/screenshots/desktop.jpg" width={520} />
          </div>

          {/* Phone 1 – left (Search) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% - 334px)", top: "50%", marginTop: -158,
            transformStyle: "preserve-3d", zIndex: 2,
          }}>
            <Phone src="/screenshots/search.jpg" width={152} />
          </div>

          {/* Phone 2 – center (Booking, tallest) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% + 18px)", top: "50%", marginTop: -206,
            transformStyle: "preserve-3d", zIndex: 3,
          }}>
            <Phone src="/screenshots/booking.jpg" width={192} />
          </div>

          {/* Phone 3 – right (Chat) */}
          <div className="hero-phone absolute" style={{
            left: "calc(50% + 240px)", top: "50%", marginTop: -152,
            transformStyle: "preserve-3d", zIndex: 2,
          }}>
            <Phone src="/screenshots/chat.jpg" width={152} />
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 text-center">
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
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <Smoke dark={false} />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
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
          <div className="f-device flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook src="/screenshots/desktop.jpg" width={440}
              style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.16))" }} />
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK ════════ */}
      <WeatherTransition fromDark={false} />

      {/* ═══ FEATURE 2 – Booking (Dark) ═══════════════════════════ */}
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden"
        style={{ background: "#0d0d0d" }}>
        <Smoke dark />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="f-device order-2 lg:order-1 flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook src="/screenshots/desktop-booking.jpg" width={440} />
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
      <section className="feat-sec relative min-h-screen flex items-center px-6 py-28 overflow-hidden bg-white">
        <Smoke dark={false} />
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
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
          <div className="f-device flex justify-center" style={{ perspective: "1000px" }}>
            <MacBook src="/screenshots/desktop-chat.jpg" width={440}
              style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.16))" }} />
          </div>
        </div>
      </section>

      {/* ════════ LIGHT → DARK ════════ */}
      <WeatherTransition fromDark={false} />

      {/* ═══ CTA FINALE ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-32 px-6 overflow-hidden"
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
          <div className="grid grid-cols-3 gap-10 sm:gap-20 mb-20">
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
      <footer style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,.05)" }} className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <p className="font-playfair text-white font-semibold text-sm">InkBook</p>
          <p className="text-[11px]" style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.2)" }}>
            © 2026 InkBook · Alle Rechte vorbehalten
          </p>
          <div className="flex gap-6">
            {[{to:"/login",l:"Anmelden"},{to:"/register",l:"Registrieren"},{to:"/search",l:"Studios"}].map(({to,l}) => (
              <Link key={to} to={to}
                className="text-[11px] transition-colors"
                style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,.26)" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.26)"}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
