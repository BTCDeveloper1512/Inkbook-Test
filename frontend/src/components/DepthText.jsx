import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Extruded type built from stacked copies, not a 3D engine — the same "real
 * CSS transforms over a mesh" choice as MacBookScene. Each layer is the same
 * text, stepped back in depth and lightened toward the tail, so the stack
 * reads as a solid block of type with a lit face.
 *
 * The layers are offset diagonally as well as pushed back: depth alone puts
 * them exactly behind the face, where the face hides every one of them and
 * the whole effect vanishes at rest. The offset is what makes the extrusion
 * visible head-on; the z-depth is what gives it real parallax when it tilts
 * toward the pointer.
 */

/**
 * Diagonal travel per unit of depth — how far the extrusion "slides" as it
 * recedes. Under 1 so the stack leans back more than it slides sideways,
 * which reads as depth; at 1 it flattens into a 45° drop shadow.
 */
const SKEW = 0.6;

/** "#ffffff" + "#3f3f46" @ t=0.4 -> the colour of the 40%-back layer. */
function mixHex(hexA, hexB, t) {
  const a = hexA.replace("#", "");
  const b = hexB.replace("#", "");
  const ar = parseInt(a.slice(0, 2), 16),
    ag = parseInt(a.slice(2, 4), 16),
    ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16),
    bg = parseInt(b.slice(2, 4), 16),
    bb = parseInt(b.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export default function DepthText({
  text,
  layers = 18,
  /**
   * Spacing between layers, in em. Deliberately not px: the same pixel
   * extrusion that looks right under a 96px desktop headline is half the
   * glyph height on a phone, where it stops reading as depth and turns into
   * a blob. In em it stays the same fraction of the type at every size.
   */
  depth = 0.025,
  faceColor = "#ffffff",
  depthColor = "#52525b",
  tilt = 10,
  className = "",
}) {
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-tilt, tilt]), { stiffness: 120, damping: 16 });
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [tilt * 0.7, -tilt * 0.7]), { stiffness: 120, damping: 16 });

  function onMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    px.set(0);
    py.set(0);
  }

  const back = Array.from({ length: layers - 1 }, (_, i) => i);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: 1000 }}
      className={`inline-block select-none ${className}`}
      role="img"
      aria-label={text}
    >
      <motion.div style={{ rotateX: rotX, rotateY: rotY }} className="relative" aria-hidden="true">
        {/* Sets the box's real size; the stacked layers below sit on top of it, invisible. */}
        <span className="invisible">{text}</span>
        {back.map((i) => {
          const stepsBehind = layers - 1 - i; // 0 = just behind the face, max = furthest
          const fromBack = i / (layers - 1); // 0 = furthest back, ~1 = just behind the face
          const slide = stepsBehind * depth * SKEW;
          return (
            <span
              key={i}
              className="absolute inset-0"
              style={{
                transform: `translate3d(${slide}em, ${slide}em, ${-stepsBehind * depth}em)`,
                // Eased rather than linear: a straight ramp keeps most of the
                // stack near the dark face colour, which reads as one solid
                // slab. Weighting it toward the tail lets the extrusion
                // dissolve into the page instead of ending on a hard edge.
                color: mixHex(depthColor, faceColor, Math.pow(fromBack, 1.45)),
              }}
            >
              {text}
            </span>
          );
        })}
        <span className="absolute inset-0" style={{ color: faceColor, transform: "translate3d(0,0,0)" }}>
          {text}
        </span>
      </motion.div>
    </div>
  );
}
