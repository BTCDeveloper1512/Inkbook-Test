import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * A vertical dial: the options sit on the surface of an imaginary cylinder
 * turning behind the page, one facing the viewer at a time.
 *
 * Positions come from real cylinder geometry rather than a stacked list with
 * a rotation bolted on — an option's distance from the focus gives an angle,
 * and that angle produces its height, its depth *and* its tilt together. That
 * is what makes it read as one curved surface: the far options genuinely
 * recede into the page instead of just shrinking in place.
 *
 * Wheel, drag, click and arrow keys all resolve to the same thing: choose an
 * index. Everything visual is a pure function of distance from it.
 */

/** Cylinder radius in px — larger reads flatter, smaller curls tighter. */
const RADIUS = 165;
/** Degrees of arc between neighbouring options. */
const ANGLE_PER_ITEM = 34;
/** Arc length between two options — how far a drag must travel to advance one. */
const DRAG_STEP = (RADIUS * ANGLE_PER_ITEM * Math.PI) / 180;

/** Place an option on the cylinder from its (possibly fractional) distance to the focus. */
function seatOnCylinder(distance) {
  const deg = distance * ANGLE_PER_ITEM;
  const rad = (deg * Math.PI) / 180;
  return {
    y: Math.sin(rad) * RADIUS,
    // 0 at the focus, negative behind it — the actual depth of the curve.
    z: Math.cos(rad) * RADIUS - RADIUS,
    // Negative so the trailing edge turns away with the surface it sits on.
    rotateX: -deg,
  };
}

export default function PlanWheel({ items, active, onChange }) {
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  // The listeners below are bound once but need today's selection, so the
  // value is mirrored into a ref rather than re-binding on every change.
  const activeRef = useRef(active);
  activeRef.current = active;
  const wheelAccumRef = useRef(0);

  // Drag-to-turn is a pointer affordance only. On a touch screen a vertical
  // drag over this element is how someone scrolls the page — claiming it
  // would turn the dial into a 320px tall dead zone the page won't scroll
  // past. Tapping an option still selects it there.
  const [canDrag, setCanDrag] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setCanDrag(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  function step(delta) {
    const next = Math.min(items.length - 1, Math.max(0, activeRef.current + delta));
    if (next !== activeRef.current) onChange(next);
  }

  // React attaches onWheel as a passive listener, so preventDefault() inside
  // it is silently ignored (and logs a warning) — turning the dial would also
  // scroll the whole page underneath it. A native listener registered with
  // {passive:false} is the only way to actually hold the page still.
  useEffect(() => {
    const el = containerRef.current;
    function handleWheel(e) {
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;
      // A trackpad sends a stream of tiny deltas for one flick — only act
      // once enough has accumulated to mean "the next option", then reset.
      if (Math.abs(wheelAccumRef.current) > 40) {
        step(wheelAccumRef.current > 0 ? 1 : -1);
        wheelAccumRef.current = 0;
      }
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // While dragging, the focus is fractional so the whole wheel turns with the
  // finger instead of snapping between whole options.
  const focus = active - dragOffset / DRAG_STEP;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="Tarif wählen"
      aria-activedescendant={`plan-option-${active}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          step(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          step(-1);
        }
      }}
      className="relative h-[320px] w-full select-none outline-none"
      style={{ perspective: 700 }}
    >
      <motion.div
        drag={canDrag ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.18}
        onDrag={(_, info) => setDragOffset(info.offset.y)}
        onDragEnd={(_, info) => {
          setDragOffset(0);
          step(Math.round(-info.offset.y / DRAG_STEP));
        }}
        className={`absolute inset-0 flex items-center justify-center ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {items.map((label, i) => {
          const distance = i - focus;
          const abs = Math.abs(distance);
          const { y, z, rotateX } = seatOnCylinder(distance);
          return (
            <motion.button
              type="button"
              key={label}
              id={`plan-option-${i}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              onClick={() => onChange(i)}
              animate={{
                y,
                z,
                rotateX,
                opacity: Math.max(0.3, 1 - abs * 0.34),
                filter: `blur(${Math.min(2.6, abs * 1.1)}px)`,
              }}
              transition={dragOffset ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 26 }}
              style={{ transformStyle: "preserve-3d" }}
              className={`absolute font-playfair whitespace-nowrap leading-none transition-colors text-4xl md:text-5xl ${
                abs < 0.5 ? "font-bold text-zinc-900" : "font-medium text-zinc-400"
              }`}
            >
              {label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* The seat the focused option rests in — without it the wheel reads as
          floating text rather than a control with a selected slot. */}
      <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[76px] rounded-2xl bg-gradient-to-r from-transparent via-zinc-900/[0.045] to-transparent" />

      {/* Fades the options out into the page at the top and bottom, so the
          wheel looks like it continues past the frame instead of being cut. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-zinc-50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-50 to-transparent" />
    </div>
  );
}
