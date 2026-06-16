import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ background: phase >= 1 ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 65%)' : 'none' }}
        transition={{ duration: 2 }}
      />

      <motion.div
        className="text-center relative z-10"
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 24 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="h-px mx-auto bg-emerald-500 mb-10"
          initial={{ width: 0 }}
          animate={{ width: phase >= 1 ? 64 : 0 }}
          transition={{ duration: 0.8 }}
        />

        <h1
          className="text-[10vw] font-bold tracking-tighter text-white leading-none"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Studio<em>OS</em>
        </h1>

        <motion.p
          className="mt-8 text-[1.3vw] uppercase tracking-[0.4em] text-white/50"
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 12 }}
          transition={{ duration: 0.8 }}
        >
          Ink meets Silicon Valley
        </motion.p>

        <motion.div
          className="mt-12 flex items-center justify-center gap-8"
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          {[
            { label: 'Customer', sub: 'Book with ease' },
            { label: '·', sub: '' },
            { label: 'Studio', sub: 'Manage with power' },
          ].map(({ label, sub }, i) => (
            <div key={i} className="text-center">
              {label === '·' ? (
                <span className="text-[2vw] text-emerald-500">·</span>
              ) : (
                <>
                  <div className="text-[0.9vw] uppercase tracking-widest text-zinc-300 font-medium">{label}</div>
                  <div className="text-[0.75vw] text-zinc-600 mt-1">{sub}</div>
                </>
              )}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-[8vh] w-px bg-gradient-to-b from-emerald-500 to-transparent"
        animate={{ height: phase >= 3 ? '10vh' : 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: 'top' }}
      />
    </motion.div>
  );
}
