import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ background: phase >= 1 ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 60%)' : 'radial-gradient(ellipse at center, transparent 0%, transparent 60%)' }}
        transition={{ duration: 2 }}
      />

      <div className="relative text-center">
        <motion.div
          className="inline-block mb-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
        >
          <div className="h-px w-32 bg-emerald-500 mx-auto" />
        </motion.div>

        <div className="overflow-hidden">
          <motion.h1
            className="text-[11vw] font-bold tracking-tighter text-white leading-none"
            style={{ fontFamily: '"Playfair Display", serif' }}
            initial={{ y: '110%' }}
            animate={{ y: phase >= 1 ? '0%' : '110%' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Studio<span style={{ fontStyle: 'italic' }}>OS</span>
          </motion.h1>
        </div>

        <motion.p
          className="mt-8 text-[1.4vw] uppercase tracking-[0.35em] text-white/50"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 16 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          The Premium Tattoo Platform
        </motion.p>

        <motion.div
          className="mt-12 flex items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {['Customer', '·', 'Studio'].map((w, i) => (
            <motion.span
              key={i}
              className={`text-[0.9vw] uppercase tracking-widest ${w === '·' ? 'text-emerald-500 text-xl' : 'text-zinc-400'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.12 }}
            >
              {w}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-[8vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="w-px bg-gradient-to-b from-emerald-500 to-transparent"
          animate={{ height: [0, 48, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
