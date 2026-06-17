import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30"
      style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      <motion.div
        className="text-center"
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Overline */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12" style={{ background: '#3f3f46' }} />
          <span className="text-[0.72vw] uppercase tracking-[0.25em]" style={{ color: '#52525b' }}>
            Jetzt starten
          </span>
          <div className="h-px w-12" style={{ background: '#3f3f46' }} />
        </div>

        {/* Logo */}
        <h1
          className="font-black tracking-tighter leading-none text-white"
          style={{
            fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif",
            fontSize: '11vw'
          }}
        >
          Studio<em>OS</em>
        </h1>

        {/* Divider */}
        <motion.div
          className="mx-auto my-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }}
          initial={{ width: 0 }}
          animate={{ width: phase >= 2 ? '18vw' : 0 }}
          transition={{ duration: 0.8 }}
        />

        {/* Tagline */}
        <motion.p
          className="text-[1.4vw] font-light"
          style={{ color: '#71717a', letterSpacing: '0.06em' }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }}
          transition={{ duration: 0.8 }}
        >
          Buchungen. Angebote. Zahlungen. Alles in einem.
        </motion.p>

        {/* Stats */}
        <motion.div
          className="mt-14 flex items-center justify-center gap-12"
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 10 }}
          transition={{ duration: 0.8 }}
        >
          {[
            ['Für Kunden', 'Einfach buchen'],
            ['·', ''],
            ['Für Studios', 'Professionell verwalten'],
          ].map(([title, sub], i) => (
            <div key={i} className="text-center">
              {title === '·' ? (
                <span className="text-2xl" style={{ color: '#3f3f46' }}>·</span>
              ) : (
                <>
                  <div className="text-[0.9vw] font-semibold text-white mb-1">{title}</div>
                  <div className="text-[0.75vw]" style={{ color: '#52525b' }}>{sub}</div>
                </>
              )}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom line */}
      <motion.div
        className="absolute bottom-[8vh] w-px"
        style={{ background: 'linear-gradient(to bottom, #3f3f46, transparent)' }}
        animate={{ height: phase >= 3 ? '8vh' : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        style2={{ transformOrigin: 'top' }}
      />
    </motion.div>
  );
}
