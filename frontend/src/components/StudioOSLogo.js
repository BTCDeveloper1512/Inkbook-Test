import React from "react";

/**
 * `tone="light"` drops the dark tile so the bars can sit directly on an
 * already-dark surface — the default tile would otherwise vanish into it.
 */
export function StudioOSMark({ size = 28, className = "", tone = "dark" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {tone === "dark" && <rect width="28" height="28" rx="7" fill="#09090B" />}
      <rect x="6" y="7.5" width="16" height="3.5" rx="1.75" fill="white" />
      <rect x="6" y="13" width="11" height="3" rx="1.5" fill="rgba(255,255,255,0.65)" />
      <rect x="6" y="18" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function StudioOSWordmark({ className = "", markSize = 26, textSize = "text-xl" }) {
  return (
    <span className={`flex items-center gap-2 select-none ${className}`}>
      <StudioOSMark size={markSize} />
      <span className={`font-playfair font-semibold tracking-tight text-zinc-900 ${textSize}`}>
        Studio<span className="font-bold">OS</span>
      </span>
    </span>
  );
}

export default StudioOSWordmark;
