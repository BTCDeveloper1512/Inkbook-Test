import React from "react";

export default function TattooAnimation() {
  return (
    <div className="w-full h-full flex items-center justify-center relative" aria-hidden="true">
      <style>{`
        @keyframes needle-buzz {
          0%,100% { transform: translateY(0); }
          25% { transform: translateY(2px); }
          75% { transform: translateY(-1px); }
        }
        @keyframes ink-drop {
          0% { opacity:0; transform: translateY(0) scale(0.5); }
          20% { opacity:0.9; }
          100% { opacity:0; transform: translateY(28px) scale(0.1); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity:0.4; filter: blur(18px); }
          50% { opacity:0.8; filter: blur(24px); }
        }
        @keyframes cable-sway {
          0%,100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes spark {
          0% { opacity:0; transform: scale(0) translate(0,0); }
          40% { opacity:1; }
          100% { opacity:0; transform: scale(1) translate(var(--tx), var(--ty)); }
        }
        @keyframes fade-float {
          0% { opacity:0; transform: translateY(10px); }
          30% { opacity: 0.5; }
          100% { opacity:0; transform: translateY(-20px); }
        }
        .needle-group { animation: needle-buzz 0.08s linear infinite; transform-origin: center top; }
        .ink-d1 { animation: ink-drop 1.4s ease-in infinite 0.1s; }
        .ink-d2 { animation: ink-drop 1.4s ease-in infinite 0.55s; }
        .ink-d3 { animation: ink-drop 1.4s ease-in infinite 1.0s; }
        .glow { animation: glow-pulse 2.4s ease-in-out infinite; }
        .cable { animation: cable-sway 3s ease-in-out infinite; transform-origin: 50% 0%; }
        .sp1 { --tx:8px; --ty:-10px; animation: spark 1.8s ease-out infinite 0.3s; }
        .sp2 { --tx:-10px; --ty:-6px; animation: spark 1.8s ease-out infinite 0.9s; }
        .sp3 { --tx:5px; --ty:-14px; animation: spark 1.8s ease-out infinite 1.4s; }
        .floatline1 { animation: fade-float 4s ease-in-out infinite 0s; }
        .floatline2 { animation: fade-float 4s ease-in-out infinite 1.3s; }
        .floatline3 { animation: fade-float 4s ease-in-out infinite 2.6s; }
      `}</style>

      {/* Ambient glow behind machine */}
      <div className="glow absolute rounded-full bg-white/10" style={{ width: 260, height: 260, top: "50%", left: "50%", transform: "translate(-50%,-54%)" }} />

      <svg width="260" height="340" viewBox="0 0 260 340" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* ── Cable (sways) ── */}
        <g className="cable">
          <path d="M130 30 C110 10, 80 15, 60 5" stroke="#555" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M130 30 C150 12, 175 18, 200 8" stroke="#555" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </g>

        {/* ── Machine Body ── */}
        {/* Base housing */}
        <rect x="88" y="60" width="84" height="120" rx="14" fill="#1c1c1e" stroke="#3a3a3c" strokeWidth="1.5"/>
        {/* Top cap */}
        <rect x="96" y="54" width="68" height="22" rx="8" fill="#2c2c2e" stroke="#3a3a3c" strokeWidth="1.5"/>
        {/* Front panel highlight */}
        <rect x="96" y="68" width="68" height="96" rx="8" fill="#111"/>
        <rect x="100" y="72" width="60" height="4" rx="2" fill="#2a2a2a"/>

        {/* Coil / Winding */}
        {[0,1,2,3,4,5,6].map(i => (
          <rect key={i} x="103" y={82 + i*10} width="54" height="6" rx="3"
            fill="none" stroke="#4a4a4a" strokeWidth="1.5"/>
        ))}
        <rect x="103" y="82" width="54" height="68" rx="5" fill="none" stroke="#3a3a3c" strokeWidth="1.5"/>

        {/* Binding post (right) */}
        <rect x="166" y="78" width="10" height="14" rx="3" fill="#2c2c2e" stroke="#555" strokeWidth="1"/>
        <circle cx="171" cy="85" r="3" fill="#888"/>
        {/* Binding post (left) */}
        <rect x="84" y="78" width="10" height="14" rx="3" fill="#2c2c2e" stroke="#555" strokeWidth="1"/>
        <circle cx="89" cy="85" r="3" fill="#888"/>

        {/* Frame grip tube */}
        <rect x="116" y="178" width="28" height="60" rx="10" fill="#1c1c1e" stroke="#3a3a3c" strokeWidth="1.5"/>
        {/* Grip texture */}
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="116" y={184+i*10} width="28" height="4" rx="2" fill="#282828"/>
        ))}

        {/* Needle tube */}
        <rect x="127" y="234" width="6" height="38" rx="3" fill="#888" stroke="#aaa" strokeWidth="0.5"/>

        {/* ── Needle tip (buzzing) ── */}
        <g className="needle-group">
          <polygon points="130,280 127,272 133,272" fill="#ccc"/>
          <polygon points="130,286 128.5,280 131.5,280" fill="#e0e0e0"/>

          {/* Ink drops */}
          <circle className="ink-d1" cx="130" cy="287" r="1.8" fill="rgba(200,200,200,0.9)"/>
          <circle className="ink-d2" cx="129" cy="287" r="1.2" fill="rgba(180,180,180,0.8)"/>
          <circle className="ink-d3" cx="131" cy="287" r="1.4" fill="rgba(220,220,220,0.85)"/>

          {/* Micro sparks */}
          <circle className="sp1" cx="131" cy="284" r="1" fill="#fff"/>
          <circle className="sp2" cx="129" cy="284" r="0.8" fill="#ddd"/>
          <circle className="sp3" cx="130.5" cy="283" r="0.6" fill="#fff"/>
        </g>

        {/* ── Floating decorative lines (like ink streaks) ── */}
        <g opacity="0.25">
          <path className="floatline1" d="M52 220 Q64 210 58 200" stroke="#888" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path className="floatline2" d="M46 240 Q60 228 55 218" stroke="#777" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path className="floatline3" d="M198 215 Q186 205 192 195" stroke="#888" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </g>

        {/* ── Bottom ink pool ── */}
        <ellipse cx="130" cy="308" rx="22" ry="5" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
        <ellipse cx="130" cy="306" rx="8" ry="2.5" fill="#2a2a2a"/>
      </svg>

      {/* Label */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-white/20 font-inter text-xs tracking-[0.25em] uppercase">InkBook Studio</p>
      </div>
    </div>
  );
}
