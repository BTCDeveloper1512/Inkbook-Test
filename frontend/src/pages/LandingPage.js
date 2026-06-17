import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import axios from "axios";
import SplashScreen from "../components/SplashScreen";

const API  = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = "'Outfit', sans-serif";

/* ─────────────────────────────────────────────
   FadeIn utility
───────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ─────────────────────────────────────────────
   Animated 3-D Wireframe Globe (canvas)
───────────────────────────────────────────── */
function WireframeGlobe({ size = 600 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = size * DPR;
    canvas.height = size * DPR;
    ctx.scale(DPR, DPR);

    const cx   = size / 2;
    const cy   = size / 2;
    const R    = size * 0.43;
    const SEGS = 16;
    let   ang  = 0;
    let   raf;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      /* longitude lines */
      for (let i = 0; i < SEGS; i++) {
        const lng = (i / SEGS) * Math.PI * 2 + ang;
        const frontFactor = (Math.cos(lng) + 1) / 2;
        const alpha = 0.05 + frontFactor * 0.22;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let j = 0; j <= 80; j++) {
          const lat = (j / 80) * Math.PI - Math.PI / 2;
          const x = cx + Math.cos(lng) * Math.cos(lat) * R;
          const y = cy + Math.sin(lat) * R;
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      /* latitude lines */
      for (let i = 1; i < SEGS; i++) {
        const lat = (i / SEGS) * Math.PI - Math.PI / 2;
        const r   = Math.cos(lat) * R;
        const y   = cy + Math.sin(lat) * R;
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        for (let j = 0; j <= 80; j++) {
          const lng2 = (j / 80) * Math.PI * 2 + ang;
          j === 0
            ? ctx.moveTo(cx + Math.cos(lng2) * r, y)
            : ctx.lineTo(cx + Math.cos(lng2) * r, y);
        }
        ctx.stroke();
      }

      ang += 0.003;
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────────
   3-D CSS Mockup Frame
───────────────────────────────────────────── */
function MockupFrame({ src }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} style={{ perspective: 1400 }}>
      <motion.div
        initial={{ opacity: 0, rotateY: 22, rotateX: 6, y: 50 }}
        animate={inView ? { opacity: 1, rotateY: -8, rotateX: 3, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ rotateY: -3, rotateX: 1, transition: { duration: 0.6 } }}
      >
        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 70px 140px rgba(0,0,0,0.35), 0 30px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.07)",
        }}>
          {/* Browser chrome */}
          <div style={{
            height: 38, background: "#e8e8e8",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", padding: "0 16px", gap: 8,
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, height: 22, borderRadius: 6,
              background: "rgba(0,0,0,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, color: "#888", fontFamily: FONT }}>
                app.studio-os.de
              </span>
            </div>
          </div>
          <img
            src={src}
            alt="StudioOS Buchungsformular"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main LandingPage
───────────────────────────────────────────── */
export default function LandingPage() {
  const [done, setDone] = useState(false);

  if (!done) return <SplashScreen onDone={() => setDone(true)} />;

  return (
    <div style={{ fontFamily: FONT, background: "#000", overflowX: "hidden" }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{
          fontSize: 17, fontWeight: 700, color: "#fff",
          letterSpacing: "-0.04em", fontFamily: FONT,
        }}>
          Studio<span style={{ color: "rgba(255,255,255,0.3)" }}>OS</span>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link to="/search" style={{
            fontSize: 13, fontWeight: 500,
            color: "rgba(255,255,255,0.45)", textDecoration: "none",
            fontFamily: FONT, letterSpacing: "-0.01em",
          }}>
            Studios finden
          </Link>
          <Link to="/login" style={{
            fontSize: 13, fontWeight: 500,
            color: "rgba(255,255,255,0.45)", textDecoration: "none",
            fontFamily: FONT, letterSpacing: "-0.01em",
          }}>
            Anmelden
          </Link>
          <Link to="/register?role=studio" style={{
            fontSize: 13, fontWeight: 600,
            color: "#000", background: "#fff",
            padding: "8px 20px", borderRadius: 100,
            textDecoration: "none", fontFamily: FONT,
            letterSpacing: "-0.02em",
          }}>
            Als Studio starten
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════
          SEKTION 1 — HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh", background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        padding: "140px 24px 100px",
      }}>

        {/* Wireframe Globe — Hintergrund */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}>
          <WireframeGlobe size={720} />
        </div>

        {/* Radialverlauf — Globe ausblenden */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 55% 65% at 50% 50%, transparent 20%, #000 72%)",
        }} />

        {/* Text-Inhalt */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 820 }}>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              fontSize: 11, fontWeight: 600,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)", marginBottom: 32,
              fontFamily: FONT,
            }}
          >
            Das Studio-Betriebssystem
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(54px, 8.5vw, 102px)",
              fontWeight: 700, color: "#fff",
              lineHeight: 0.98, letterSpacing: "-0.05em",
              marginBottom: 32, fontFamily: FONT,
            }}
          >
            Tattoo-Buchungen.<br />
            <span style={{ color: "rgba(255,255,255,0.22)" }}>
              Endlich digital.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.65 }}
            style={{
              fontSize: "clamp(15px, 1.8vw, 19px)",
              color: "rgba(255,255,255,0.4)",
              maxWidth: 520, margin: "0 auto 48px",
              lineHeight: 1.65, fontWeight: 400, fontFamily: FONT,
            }}
          >
            Kunden finden ihr Studio, buchen per Echtzeit-Kalender und zahlen
            sicher per Stripe — kein WhatsApp-Chaos, keine verpassten Anfragen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.55 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link to="/search" style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              padding: "15px 30px", borderRadius: 100,
              background: "#fff", color: "#000",
              fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: FONT,
              letterSpacing: "-0.02em",
            }}>
              Studio finden
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/register?role=studio" style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              padding: "15px 30px", borderRadius: 100,
              background: "transparent", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.14)",
              fontSize: 14, fontWeight: 500, textDecoration: "none", fontFamily: FONT,
              letterSpacing: "-0.02em",
            }}>
              Als Studio registrieren
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.18)",
              marginTop: 22, fontFamily: FONT,
            }}
          >
            Kostenlos · Keine Kreditkarte erforderlich
          </motion.p>
        </div>

        {/* Scroll-Indikator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: 36,
            left: "50%", transform: "translateX(-50%)",
          }}
        >
          <div style={{
            width: 1, height: 52,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)",
          }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          SEKTION 2 — MOCKUP + FEATURES
      ══════════════════════════════════════════════════ */}
      <section style={{
        background: "#fff",
        padding: "120px 40px 140px",
        position: "relative", overflow: "hidden",
      }}>

        {/* Dezente Linie Hintergrund */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1140, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}>

          {/* Text-Spalte */}
          <FadeIn>
            <p style={{
              fontSize: 11, fontWeight: 600,
              letterSpacing: "0.28em", textTransform: "uppercase",
              color: "rgba(0,0,0,0.28)", marginBottom: 22, fontFamily: FONT,
            }}>
              Für Studios & Kunden
            </p>

            <h2 style={{
              fontSize: "clamp(38px, 4.5vw, 62px)",
              fontWeight: 700, color: "#000",
              lineHeight: 1.0, letterSpacing: "-0.05em",
              marginBottom: 24, fontFamily: FONT,
            }}>
              Dein Studio.<br />Professionell<br />buchbar.
            </h2>

            <p style={{
              fontSize: 16, color: "rgba(0,0,0,0.42)",
              lineHeight: 1.7, marginBottom: 44,
              fontWeight: 400, fontFamily: FONT, maxWidth: 460,
            }}>
              Echte Verfügbarkeit, Artist-Auswahl, Körperstellen-Selektor und
              sichere Anzahlung — alles in einem einzigen Buchungsschritt.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
              {[
                "Echtzeit-Kalender farbcodiert nach Auslastung",
                "Größe, Körperstelle und Artist in einem Schritt wählbar",
                "Sichere Anzahlung via Stripe — automatisch verwaltet",
                "Alle Anfragen zentral im Studio-Dashboard",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <CheckCircle
                    size={16} strokeWidth={2.5} color="#000"
                    style={{ flexShrink: 0, marginTop: 3 }}
                  />
                  <span style={{
                    fontSize: 14, color: "rgba(0,0,0,0.5)",
                    lineHeight: 1.55, fontFamily: FONT,
                  }}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/register?role=studio" style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: "14px 28px", borderRadius: 100,
                background: "#000", color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: FONT,
                letterSpacing: "-0.02em",
              }}>
                Kostenlos starten
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link to="/search" style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: "14px 28px", borderRadius: 100,
                background: "transparent", color: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(0,0,0,0.14)",
                fontSize: 14, fontWeight: 500, textDecoration: "none", fontFamily: FONT,
                letterSpacing: "-0.02em",
              }}>
                Studio suchen
              </Link>
            </div>
          </FadeIn>

          {/* 3D Mockup */}
          <FadeIn delay={0.14}>
            <MockupFrame src="/screens/mockup-buchung.png" />
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{
        background: "#000",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "44px 40px",
      }}>
        <div style={{
          maxWidth: 1140, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 20,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.04em", fontFamily: FONT,
          }}>
            Studio<span style={{ color: "rgba(255,255,255,0.25)" }}>OS</span>
          </span>

          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.18)",
            fontFamily: FONT,
          }}>
            © 2026 StudioOS — Das Studio-Betriebssystem
          </p>

          <div style={{ display: "flex", gap: 28 }}>
            {["Datenschutz", "Impressum", "Kontakt"].map(l => (
              <span
                key={l}
                style={{
                  fontSize: 12, color: "rgba(255,255,255,0.28)",
                  cursor: "pointer", fontFamily: FONT,
                  letterSpacing: "-0.01em",
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
