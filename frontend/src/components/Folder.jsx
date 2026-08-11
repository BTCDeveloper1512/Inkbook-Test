import React from "react";
import "./Folder.css";

/**
 * A settings folder — adapted from React Bits' Folder component, restyled
 * into the app's monochrome zinc language instead of the original's bright
 * defaults, and stripped of its own open/close click handling: hovering
 * still fans the papers out (pure CSS, same trick as the original), but a
 * click here means "open this section", not "peek at it" — the caller
 * decides what that opens.
 */
function darkenColor(hex, percent) {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  const num = parseInt(color.slice(0, 6), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export default function Folder({ color = "#3f3f46", size = 1, icon: Icon, badge, onClick, className = "" }) {
  const folderBackColor = darkenColor(color, 0.1);

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div
        className="sp-folder"
        style={{ "--sp-folder-color": color, "--sp-folder-back-color": folderBackColor }}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
      >
        {badge != null && badge > 0 && <span className="sp-folder__badge">{badge}</span>}
        <div className="sp-folder__back">
          <div className="sp-paper sp-paper-1" />
          <div className="sp-paper sp-paper-2" />
          <div className="sp-paper sp-paper-3">
            {Icon && <Icon size={16} strokeWidth={1.6} className="text-zinc-500" />}
          </div>
          <div className="sp-folder__front" />
          <div className="sp-folder__front sp-right" />
        </div>
      </div>
    </div>
  );
}
