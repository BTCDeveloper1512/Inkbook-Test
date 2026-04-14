import React, { useState, useEffect, useRef } from "react";

// text states: "idle" | "writing" | "visible" | "erasing"
export default function TattooAnimation() {
  const [textState, setTextState] = useState("idle");
  const timerRef = useRef(null);

  const handleEnter = () => {
    clearTimeout(timerRef.current);
    if (textState === "idle") {
      setTextState("writing");
      timerRef.current = setTimeout(() => setTextState("visible"), 1300);
    }
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    if (textState === "writing" || textState === "visible") {
      setTextState("erasing");
      timerRef.current = setTimeout(() => setTextState("idle"), 600);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isWriting  = textState === "writing";
  const isVisible  = textState === "visible";
  const isErasing  = textState === "erasing";
  const showText   = isWriting || isVisible || isErasing;

  return (
    <div
      className="w-full h-full flex items-center justify-center relative select-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-hidden="true"
      style={{ cursor: "crosshair" }}
    >
      <style>{`
        /* ── Machine idle animations ── */
        @keyframes needle-buzz {
          0%,100% { transform: translateY(0px); }
          25%      { transform: translateY(2px); }
          75%      { transform: translateY(-1px); }
        }
        @keyframes ink-drop {
          0%   { opacity:0; transform:translateY(0) scale(0.6); }
          20%  { opacity:0.9; }
          100% { opacity:0; transform:translateY(26px) scale(0.05); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity:0.35; filter:blur(18px); }
          50%     { opacity:0.7;  filter:blur(26px); }
        }
        @keyframes cable-sway {
          0%,100% { transform:rotate(-2deg); }
          50%     { transform:rotate(2deg); }
        }
        @keyframes spark {
          0%   { opacity:0; transform:scale(0) translate(0,0); }
          40%  { opacity:1; }
          100% { opacity:0; transform:scale(1) translate(var(--tx),var(--ty)); }
        }

        /* ── Writing: needle slides right ── */
        @keyframes needle-write {
          0%   { transform: translateX(-68px); }
          100% { transform: translateX(68px); }
        }
        /* ── Text stroke draws in ── */
        @keyframes stroke-draw {
          from { stroke-dashoffset: 820; }
          to   { stroke-dashoffset: 0; }
        }
        /* ── Fill fades in after stroke ── */
        @keyframes fill-in {
          0%,70% { fill-opacity: 0; }
          100%   { fill-opacity: 1; }
        }
        /* ── Erase: glitch-upward dissolve ── */
        @keyframes ink-dissolve {
          0%   { opacity:1; filter:blur(0px) brightness(1);   transform:translateY(0);   }
          30%  { opacity:1; filter:blur(0px) brightness(2.5); transform:translateY(-2px); }
          60%  { opacity:0.6; filter:blur(4px) brightness(1.8); transform:translateY(-6px);  }
          100% { opacity:0; filter:blur(14px) brightness(3);  transform:translateY(-16px); }
        }

        .needle-group  { animation: needle-buzz 0.08s linear infinite; transform-origin:center top; }
        .ink-d1        { animation: ink-drop 1.4s ease-in infinite 0.0s; }
        .ink-d2        { animation: ink-drop 1.4s ease-in infinite 0.5s; }
        .ink-d3        { animation: ink-drop 1.4s ease-in infinite 1.0s; }
        .glow-orb      { animation: glow-pulse 2.4s ease-in-out infinite; }
        .cable         { animation: cable-sway 3s ease-in-out infinite; transform-origin:50% 0%; }
        .sp1           { --tx:8px;  --ty:-10px; animation:spark 1.8s ease-out infinite 0.3s; }
        .sp2           { --tx:-10px;--ty:-6px;  animation:spark 1.8s ease-out infinite 0.9s; }
        .sp3           { --tx:5px;  --ty:-14px; animation:spark 1.8s ease-out infinite 1.4s; }

        /* writing state: needle slides across text area */
        .needle-writing { animation: needle-write 1.2s cubic-bezier(0.4,0,0.6,1) forwards !important; transform-origin:center top; }

        /* text stroke draw */
        .inkbook-stroke {
          stroke-dasharray: 820;
          stroke-dashoffset: 820;
          fill-opacity: 0;
        }
        .inkbook-stroke.draw {
          animation:
            stroke-draw 1.1s cubic-bezier(0.4,0,0.2,1) forwards,
            fill-in     1.1s ease forwards;
        }
        .inkbook-stroke.drawn {
          stroke-dashoffset: 0;
          fill-opacity: 1;
        }
        .inkbook-wrap.dissolve {
          animation: ink-dissolve 0.55s ease-in forwards;
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="glow-orb absolute rounded-full"
        style={{
          width: 260, height: 260,
          background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
          top: "50%", left: "50%",
          transform: "translate(-50%,-54%)",
          pointerEvents: "none"
        }}
      />

      <svg width="260" height="370" viewBox="0 0 260 370" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glow filter for InkBook text */}
          <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur1"/>
            <feGaussianBlur stdDeviation="7" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {/* Sharper glow for stroke */}
          <filter id="strokeGlow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Cable ── */}
        <g className="cable">
          <path d="M130 32 C110 12,80 17,58 6"  stroke="#555" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M130 32 C152 14,176 20,200 9" stroke="#555" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </g>

        {/* ── Machine Body ── */}
        <rect x="88"  y="60"  width="84" height="120" rx="14" fill="#1c1c1e" stroke="#3a3a3c" strokeWidth="1.5"/>
        <rect x="96"  y="54"  width="68" height="22"  rx="8"  fill="#2c2c2e" stroke="#3a3a3c" strokeWidth="1.5"/>
        <rect x="96"  y="68"  width="68" height="96"  rx="8"  fill="#111"/>
        <rect x="100" y="72"  width="60" height="4"   rx="2"  fill="#2a2a2a"/>
        {[0,1,2,3,4,5,6].map(i => (
          <rect key={i} x="103" y={82+i*10} width="54" height="6" rx="3"
            fill="none" stroke="#4a4a4a" strokeWidth="1.5"/>
        ))}
        <rect x="103" y="82"  width="54" height="68" rx="5" fill="none" stroke="#3a3a3c" strokeWidth="1.5"/>
        <rect x="166" y="78"  width="10" height="14" rx="3" fill="#2c2c2e" stroke="#555" strokeWidth="1"/>
        <circle cx="171" cy="85" r="3" fill="#888"/>
        <rect x="84"  y="78"  width="10" height="14" rx="3" fill="#2c2c2e" stroke="#555" strokeWidth="1"/>
        <circle cx="89" cy="85" r="3" fill="#888"/>
        <rect x="116" y="178" width="28" height="60"  rx="10" fill="#1c1c1e" stroke="#3a3a3c" strokeWidth="1.5"/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="116" y={184+i*10} width="28" height="4" rx="2" fill="#282828"/>
        ))}
        <rect x="127" y="234" width="6"  height="38" rx="3" fill="#888" stroke="#aaa" strokeWidth="0.5"/>

        {/* ── Needle group – switches to writing animation on hover ── */}
        <g
          className={isWriting ? "needle-writing" : "needle-group"}
          style={isVisible || isErasing ? { transform: "translateX(68px)" } : undefined}
        >
          <polygon points="130,280 127,272 133,272" fill="#ccc"/>
          <polygon points="130,286 128.5,280 131.5,280" fill="#e0e0e0"/>
          {!isWriting && !isVisible && !isErasing && (<>
            <circle className="ink-d1" cx="130" cy="287" r="1.8" fill="rgba(200,200,200,0.9)"/>
            <circle className="ink-d2" cx="129" cy="287" r="1.2" fill="rgba(180,180,180,0.8)"/>
            <circle className="ink-d3" cx="131" cy="287" r="1.4" fill="rgba(220,220,220,0.85)"/>
            <circle className="sp1" cx="131" cy="284" r="1"   fill="#fff"/>
            <circle className="sp2" cx="129" cy="284" r="0.8" fill="#ddd"/>
            <circle className="sp3" cx="130.5" cy="283" r="0.6" fill="#fff"/>
          </>)}
        </g>

        {/* ── InkBook text – animated on hover ── */}
        {showText && (
          <g
            className={isErasing ? "inkbook-wrap dissolve" : "inkbook-wrap"}
            filter="url(#textGlow)"
          >
            {/* Underline bar */}
            <rect
              x="67" y="307" width="126" height="1.5" rx="1"
              fill="rgba(255,255,255,0.25)"
              className={`inkbook-stroke ${isWriting ? "draw" : isVisible ? "drawn" : ""}`}
            />
            {/* Main text stroke */}
            <text
              x="130" y="303"
              textAnchor="middle"
              fontFamily="'Playfair Display', Georgia, serif"
              fontSize="44"
              fontWeight="700"
              fontStyle="italic"
              letterSpacing="-0.5"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="1"
              fill="rgba(255,255,255,0.92)"
              filter="url(#strokeGlow)"
              className={`inkbook-stroke ${isWriting ? "draw" : isVisible ? "drawn" : ""}`}
            >
              InkBook
            </text>
          </g>
        )}

        {/* ── Skin/paper surface ── */}
        <ellipse cx="130" cy="308" rx="22" ry="5"   fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
        <ellipse cx="130" cy="306" rx="8"  ry="2.5" fill="#2a2a2a"/>
      </svg>

      {/* Bottom label */}
      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
        <p className="text-white/15 font-inter text-xs tracking-[0.28em] uppercase">
          {isWriting || isVisible ? "tattooing..." : "hover to ink"}
        </p>
      </div>
    </div>
  );
}
