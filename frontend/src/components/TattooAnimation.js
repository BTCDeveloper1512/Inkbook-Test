import React from "react";

export default function TattooAnimation() {
  return (
    <div
      className="w-full h-full flex items-center justify-center bg-white relative overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        /* ── Needle: smooth cinematic descent ── */
        @keyframes needle-enter {
          0%   { transform: translateY(-220px); opacity: 0; }
          6%   { opacity: 1; }
          100% { transform: translateY(0px);   opacity: 1; }
        }

        /* ── Ink dot at tip pulses while writing ── */
        @keyframes tip-pulse {
          0%,100% { opacity: 0; transform: scale(0.6); }
          50%     { opacity: 0.55; transform: scale(1); }
        }

        /* ── "Welcome to" draws in ── */
        @keyframes draw-sub {
          from { stroke-dashoffset: 900; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes fill-sub {
          0%,70% { fill-opacity: 0; }
          100%   { fill-opacity: 1; }
        }

        /* ── "InkBook" draws in ── */
        @keyframes draw-main {
          from { stroke-dashoffset: 1400; }
          to   { stroke-dashoffset: 0;    }
        }
        @keyframes fill-main {
          0%,75% { fill-opacity: 0; }
          100%   { fill-opacity: 1; }
        }

        /* ── Needle lift after writing ── */
        @keyframes needle-lift {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-18px); }
        }

        /* ── Subtle underline reveal ── */
        @keyframes line-reveal {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .needle-group {
          animation: needle-enter 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }
        .needle-done {
          animation:
            needle-enter 2s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            needle-lift 0.9s cubic-bezier(0.4, 0, 0.2, 1) 4.6s forwards;
          transform-origin: top center;
        }
        .tip-dot {
          animation: tip-pulse 0.45s ease-in-out infinite 1.9s;
        }
        .text-sub {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          fill-opacity: 0;
          animation:
            draw-sub 1.5s cubic-bezier(0.4, 0, 0.2, 1) 1.9s forwards,
            fill-sub 1.5s ease 1.9s forwards;
        }
        .text-main {
          stroke-dasharray: 1400;
          stroke-dashoffset: 1400;
          fill-opacity: 0;
          animation:
            draw-main 1.8s cubic-bezier(0.4, 0, 0.2, 1) 3.2s forwards,
            fill-main 1.8s ease 3.2s forwards;
        }
        .underline-bar {
          transform-origin: left center;
          transform: scaleX(0);
          animation: line-reveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) 4.8s forwards;
        }
      `}</style>

      <svg
        width="400"
        height="340"
        viewBox="0 0 400 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── Metallic needle body ── */}
          <linearGradient id="needleBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#6b6b6b"/>
            <stop offset="18%"  stopColor="#c8c8c8"/>
            <stop offset="35%"  stopColor="#f0f0f0"/>
            <stop offset="50%"  stopColor="#ffffff"/>
            <stop offset="65%"  stopColor="#e0e0e0"/>
            <stop offset="82%"  stopColor="#b0b0b0"/>
            <stop offset="100%" stopColor="#686868"/>
          </linearGradient>

          {/* ── Needle tip ── */}
          <linearGradient id="needleTip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#777"/>
            <stop offset="40%"  stopColor="#ddd"/>
            <stop offset="60%"  stopColor="#f8f8f8"/>
            <stop offset="100%" stopColor="#666"/>
          </linearGradient>

          {/* ── Needle upper grip ── */}
          <linearGradient id="needleGrip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3a3a3a"/>
            <stop offset="30%"  stopColor="#888"/>
            <stop offset="50%"  stopColor="#aaa"/>
            <stop offset="70%"  stopColor="#888"/>
            <stop offset="100%" stopColor="#3a3a3a"/>
          </linearGradient>

          {/* ── Drop shadow for needle ── */}
          <filter id="needleDrop" x="-60%" y="-10%" width="220%" height="130%">
            <feDropShadow dx="3" dy="6" stdDeviation="8" floodColor="rgba(0,0,0,0.14)" floodOpacity="1"/>
          </filter>

          {/* ── Subtle text shadow ── */}
          <filter id="textCrisp" x="-5%" y="-10%" width="110%" height="130%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.4" floodColor="rgba(0,0,0,0.12)"/>
          </filter>

          {/* ── Glow at needle tip ── */}
          <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* ────────────── NEEDLE ────────────── */}
        <g className="needle-done" filter="url(#needleDrop)">

          {/* Upper grip collar */}
          <rect x="193" y="8"  width="14" height="20" rx="4" fill="url(#needleGrip)"/>
          <rect x="195" y="10" width="4"  height="16" rx="2" fill="rgba(255,255,255,0.25)"/>

          {/* Main body */}
          <rect x="195" y="27" width="10" height="130" rx="2" fill="url(#needleBody)"/>

          {/* Highlight stripe */}
          <rect x="198.5" y="29" width="2.5" height="126" rx="1" fill="rgba(255,255,255,0.55)"/>

          {/* Lower taper start */}
          <path d="M195 157 L200 185 L205 157 Z" fill="url(#needleTip)"/>

          {/* Mid-taper */}
          <path d="M197.5 185 L200 205 L202.5 185 Z" fill="#b0b0b0"/>

          {/* Fine taper */}
          <path d="M199 205 L200 218 L201 205 Z" fill="#999"/>

          {/* Needle tip point */}
          <line x1="200" y1="218" x2="200" y2="228" stroke="#777" strokeWidth="1"/>
          <line x1="200" y1="228" x2="200" y2="234" stroke="#999" strokeWidth="0.6"/>

          {/* Ink dot at tip (pulses during writing) */}
          <circle className="tip-dot" cx="200" cy="234" r="2.5" fill="url(#tipGlow)"/>
        </g>

        {/* ────────────── TEXT ────────────── */}
        <g filter="url(#textCrisp)">

          {/* "Welcome to" — thin, tracked, elegant */}
          <text
            x="200" y="260"
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', 'Helvetica Neue', sans-serif"
            fontSize="16"
            fontWeight="300"
            letterSpacing="0.22em"
            stroke="#1a1a1a"
            strokeWidth="0.6"
            fill="#1a1a1a"
            className="text-sub"
          >
            WELCOME TO
          </text>

          {/* "InkBook" — bold wordmark */}
          <text
            x="200" y="305"
            textAnchor="middle"
            fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
            fontSize="52"
            fontWeight="700"
            letterSpacing="-0.02em"
            stroke="#000"
            strokeWidth="0.4"
            fill="#000"
            className="text-main"
          >
            InkBook
          </text>
        </g>

        {/* ── Underline accent ── */}
        <line
          x1="130" y1="315"
          x2="270" y2="315"
          stroke="#000"
          strokeWidth="0.8"
          strokeLinecap="round"
          className="underline-bar"
        />
      </svg>
    </div>
  );
}
