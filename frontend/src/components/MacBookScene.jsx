import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { StudioOSMark } from "./StudioOSLogo";

/**
 * Just the screen — no stand, no desk clutter. Built from real CSS 3D
 * transforms rather than a rendered 3D model so the app mockup inside stays
 * ordinary DOM and renders at full sharpness instead of being rasterised
 * onto a texture.
 *
 * The camera arcs down from a tilted view to dead level, the dark glass
 * wakes on the logo, the interface draws, and the camera dives into the
 * glass until the software fills the frame. One scroll-linked progress value
 * drives all of it, so it plays backwards just as cleanly on the way up.
 */

/**
 * Built at 2× and the page scales the whole thing *down* for the wide shot —
 * `transform: scale` rasterises the subtree once and stretches the bitmap,
 * so magnifying past 1× is a real upscale and shows. Ending the dive at 1×
 * of a 2×-sized render means the closest, most-scrutinised frame is native
 * resolution, and every earlier frame is a downscale — which never softens.
 */
const U = 2;
const SCREEN_W = 720 * U;
const SCREEN_H = 450 * U;
const BEZEL = 9 * U;
const CHIN = 30 * U;
const MONITOR_H = SCREEN_H + BEZEL * 2 + CHIN;

/**
 * Where each beat sits along the stage's own 0→1 progress. Fractions rather
 * than pixel offsets, so the sequence plays identically on any viewport —
 * the page owns the scroll stage and hands the progress in.
 */
const BEAT = {
  camera: [0.02, 0.24],
  boot: [0.11, 0.19, 0.3],
  ui: [0.28, 0.38],
  /** The dive into the glass, once there is actually something to dive into. */
  push: [0.4, 0.56],
};

/** How steeply we look down on the screen before the camera comes level. */
const CAMERA_HIGH = 42;
const CAMERA_EYE = 4;
/**
 * Exactly U, so the dive lands on 1:1 pixels — see the U comment at the top
 * of the file for why raising this past U softens the glass.
 */
const DIVE_SCALE = U;

export default function MacBookScene({ progress, children, className = "" }) {
  const [reduced, setReduced] = useState(false);
  const [uiMounted, setUiMounted] = useState(false);
  const wrapRef = useRef(null);

  // Pointer parallax, damped so it glides instead of snapping to the cursor.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotY = useSpring(useTransform(px, [-1, 1], [7, -7]), { stiffness: 60, damping: 18 });
  const rotX = useSpring(useTransform(py, [-1, 1], [-4, 4]), { stiffness: 60, damping: 18 });

  // Boot mark, interface and camera all read the same progress value, so
  // they stay in step however fast someone scrolls — and run backwards just
  // as cleanly on the way up.
  const fallback = useMotionValue(1);
  const p = progress || fallback;
  const bootOpacity = useTransform(p, BEAT.boot, [0, 1, 0], { clamp: true });
  const bootScale = useTransform(p, [BEAT.boot[0], BEAT.boot[2]], [0.84, 1.06], { clamp: true });
  // Third stop pins it open for the rest of the runway. Relying on clamping
  // alone let it drift back down to zero once progress passed the last stop.
  const uiOpacity = useTransform(p, [BEAT.ui[0], BEAT.ui[1], 1], [0, 1, 1], { clamp: true });
  // The camera itself: tilted at the start, easing level as the reader
  // arrives. Sprung so a flicked scroll wheel arrives smoothly instead of
  // snapping the whole scene around.
  const cameraTilt = useTransform(p, BEAT.camera, [CAMERA_HIGH, CAMERA_EYE], { clamp: true });
  const cameraSpring = useSpring(cameraTilt, { stiffness: 80, damping: 20, restDelta: 0.02 });
  // Approach while the camera comes down, hold steady through the boot and
  // the interface drawing, then dive in. The flat middle matters: pushing in
  // during the reveal would fight the thing the reader is trying to read.
  const pushIn = useTransform(p, [0, BEAT.camera[1], BEAT.push[0], BEAT.push[1], 1], [0.9, 1, 1, DIVE_SCALE, DIVE_SCALE], {
    clamp: true,
  });
  // Sheen across the dark glass, easing off once the screen takes over.
  const sheenOpacity = useTransform(p, [0, BEAT.boot[0], 1], [1, 0.45, 0.45], { clamp: true });
  // Once the glass fills the frame we are meant to be *in* the software, so
  // the things that read as "looking at an object" are retired: the pointer
  // parallax and the floor shadow both wind down to nothing.
  const objectness = useTransform(p, [BEAT.push[0], BEAT.push[1]], [1, 0], { clamp: true });
  const rotXDamped = useTransform([rotX, objectness], ([r, k]) => r * k);
  const rotYDamped = useTransform([rotY, objectness], ([r, k]) => r * k);

  // Mount the interface only once the screen is actually lit, so its own
  // entrance animations play for the reader instead of behind a dark screen.
  useMotionValueEvent(p, "change", (v) => {
    if (v >= BEAT.ui[0] && !uiMounted) setUiMounted(true);
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);
    // With reduced motion nothing is scroll-gated: lit and settled.
    if (prefersReduced || p.get() >= BEAT.ui[0]) setUiMounted(true);
  }, [p]);

  useEffect(() => {
    if (reduced) return undefined;
    function onMove(e) {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      px.set(((e.clientX - r.left) / r.width) * 2 - 1);
      py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduced]);

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ perspective: 2000, perspectiveOrigin: "50% 42%" }}>
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          rotateX: reduced ? 0 : rotXDamped,
          rotateY: reduced ? 0 : rotYDamped,
          scale: reduced ? 1 : pushIn,
          transformOrigin: "50% 50%",
        }}
      >
        {/* Slow idle float, kept on its own layer so it doesn't fight the parallax. */}
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={reduced ? {} : { y: [0, -9, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
        >
          {/* The camera's own angle on the screen — tilted at first, level
              once we've arrived. */}
          <motion.div
            style={{
              transformStyle: "preserve-3d",
              rotateX: reduced ? CAMERA_EYE : cameraSpring,
              position: "relative",
              width: SCREEN_W + BEZEL * 2,
              height: MONITOR_H,
              margin: "0 auto",
            }}
          >
            {/* Aluminium shell */}
            <div
              className="absolute inset-0"
              style={{
                borderRadius: 11 * U,
                background: "linear-gradient(160deg, #e2e3e6 0%, #c3c5ca 40%, #a8abb1 64%, #d4d6da 100%)",
                boxShadow: `0 ${U}px 0 rgba(255,255,255,.7) inset, 0 -${U}px 0 rgba(0,0,0,.15) inset`,
              }}
            />
            {/* Glass panel */}
            <div
              className="absolute overflow-hidden"
              style={{ inset: BEZEL, bottom: BEZEL + CHIN, borderRadius: 5 * U, background: "#08090b" }}
            >
              <div className="absolute inset-0 overflow-hidden" style={{ width: SCREEN_W, height: SCREEN_H }}>
                {/* Boot mark: the screen wakes on the logo before the
                    interface itself draws, the way the real machine does. */}
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ opacity: reduced ? 0 : bootOpacity, background: "#08090b", zIndex: 2 }}
                >
                  <motion.div style={{ scale: reduced ? 1 : bootScale }}>
                    <StudioOSMark size={29 * U} tone="light" />
                  </motion.div>
                  <div className="font-playfair text-white/90 tracking-tight" style={{ fontSize: 9 * U, marginTop: 8 * U }}>
                    Studio<span className="font-bold">OS</span>
                  </div>
                </motion.div>

                {/* `zoom`, not `transform: scale` — zoom re-runs layout, so
                    the interface is genuinely typeset at 2× and stays crisp
                    at the end of the dive. A transform would only stretch a
                    raster of the small version, which is the softness this
                    whole 2× arrangement exists to avoid. */}
                <motion.div className="absolute inset-0" style={{ opacity: reduced ? 1 : uiOpacity, zoom: U }}>
                  {uiMounted && children}
                </motion.div>
              </div>

              {/* Sheen across the glass — fades once the screen wakes up so
                  it never sits on top of the content the reader is looking
                  at. */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.05) 32%, rgba(255,255,255,0) 52%)",
                  opacity: reduced ? 0.45 : sheenOpacity,
                }}
              />
            </div>

            {/* Chin + engraved wordmark */}
            <div className="absolute left-0 right-0 flex items-center justify-center" style={{ bottom: 0, height: CHIN }}>
              <span
                className="font-inter tracking-[0.2em] uppercase"
                style={{ fontSize: 4 * U, color: "rgba(60,63,70,.55)", textShadow: `0 ${U}px 0 rgba(255,255,255,.5)` }}
              >
                StudioOS
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Contact shadow. Not part of the 3D assembly on purpose — it belongs
          to the floor, so it stays put while the screen tilts above it.
          Fades out with the dive: once we are inside the screen there is no
          floor. */}
      <motion.div
        className="mx-auto rounded-[50%] pointer-events-none"
        style={{
          width: SCREEN_W * 0.7,
          height: 30,
          marginTop: -6,
          background: "radial-gradient(ellipse at center, rgba(24,24,27,.28) 0%, rgba(24,24,27,0) 70%)",
          filter: "blur(9px)",
          opacity: reduced ? 1 : objectness,
        }}
      />
    </div>
  );
}
