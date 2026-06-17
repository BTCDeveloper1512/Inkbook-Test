import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudioOSMark } from "./StudioOSLogo";

const SESSION_KEY = "studioos_splash_shown";

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (shown) { onDone && onDone(); return; }
    setVisible(true);
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(false);
        onDone && onDone();
      }, 700);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ y: "-100%", transition: { duration: 0.72, ease: [0.76, 0, 0.24, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "#09090B" }}
        >
          {/* Mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          >
            <StudioOSMark size={64} />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.45 }}
            className="mt-5 flex items-baseline gap-1"
          >
            <span
              style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontWeight: 400, fontSize: 28, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}
            >
              Studio
            </span>
            <span
              style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontWeight: 700, fontSize: 28, color: "white", letterSpacing: "-0.02em" }}
            >
              OS
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 10 }}
          >
            The Studio Operating System
          </motion.p>

          {/* Bottom progress line */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.1, ease: "linear", delay: 0.1 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,0.15)",
              transformOrigin: "left",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
