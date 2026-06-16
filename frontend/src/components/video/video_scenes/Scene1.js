import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 1 }}
    >
      {/* Overline */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -12 }}
        transition={{ duration: 0.7 }}
      >
        <div className="h-px w-10" style={{ background: '#52525b' }} />
        <span
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: '#71717a' }}
        >
          Die Plattform für Tattoo‑Studios
        </span>
        <div className="h-px w-10" style={{ background: '#52525b' }} />
      </motion.div>

      {/* Title */}
      <div className="overflow-hidden">
        <motion.h1
          className="text-[13vw] font-black tracking-tighter leading-none text-white"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          initial={{ y: '110%' }}
          animate={{ y: phase >= 1 ? '0%' : '110%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Studio<em>OS</em>
        </motion.h1>
      </div>

      {/* Divider */}
      <motion.div
        className="my-8 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }}
        initial={{ width: 0 }}
        animate={{ width: phase >= 2 ? '20vw' : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Subtitle */}
      <motion.p
        className="text-[1.3vw] font-light"
        style={{ color: '#a1a1aa', letterSpacing: '0.05em' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }}
        transition={{ duration: 0.8 }}
      >
        Buchungen. Angebote. Zahlungen. Alles in einem.
      </motion.p>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-[8vh] flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 0.5 : 0 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="w-px bg-white"
          animate={{ height: [0, 40, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
