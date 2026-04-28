import React from "react";

/**
 * Ambient smoke/cloud animation for dashboard dark hero strips.
 * Ported from the LandingPage Smoke component.
 */
export default function DashboardHeroSmoke() {
  const colors = [
    "rgba(255,255,255,.04)",
    "rgba(255,255,255,.03)",
    "rgba(255,255,255,.025)",
    "rgba(200,200,200,.018)"
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes dhs1{0%,100%{transform:translate(0,0)scale(1)}40%{transform:translate(60px,-30px)scale(1.08)}70%{transform:translate(-40px,20px)scale(.97)}}
        @keyframes dhs2{0%,100%{transform:translate(0,0)scale(1.03)}35%{transform:translate(-60px,45px)scale(.92)}65%{transform:translate(50px,-45px)scale(1.06)}}
        @keyframes dhs3{0%,100%{transform:translate(0,0)scale(.97)}50%{transform:translate(35px,55px)scale(1.08)}}
        @keyframes dhs4{0%,100%{transform:translate(0,0)}30%{transform:translate(-38px,-22px)}70%{transform:translate(22px,38px)}}
        .dhs-c1{animation:dhs1 24s ease-in-out infinite}
        .dhs-c2{animation:dhs2 19s ease-in-out infinite .8s}
        .dhs-c3{animation:dhs3 28s ease-in-out infinite 1.5s}
        .dhs-c4{animation:dhs4 15s ease-in-out infinite 3s}
      `}</style>

      {[
        [700, 300, -80, -100, colors[0], 80, "dhs-c1"],
        [550, 280, -60,  "35%", colors[1], 90, "dhs-c2"],
        [450, 240,  "30%", -50, colors[2], 70, "dhs-c3"],
        [350, 200,  "20%", "55%", colors[3], 60, "dhs-c4"],
      ].map(([w, h, top, left, bg, blur, cls], i) => (
        <div key={i} className={cls} style={{
          position: "absolute", width: w, height: h, top, left,
          background: `radial-gradient(ellipse,${bg} 0%,transparent 65%)`,
          filter: `blur(${blur}px)`,
        }} />
      ))}

      {/* Noise texture */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.045 }} preserveAspectRatio="xMidYMid slice">
        <filter id="dhs-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.007" numOctaves="4" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dhs-noise)" />
      </svg>
    </div>
  );
}
