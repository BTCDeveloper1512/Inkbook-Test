import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.p
        className="text-[0.9vw] uppercase tracking-[0.25em] mb-14"
        style={{ color: '#52525b' }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        Zwei Seiten. Eine Plattform.
      </motion.p>

      <div className="flex items-center gap-0" style={{ width: '72vw' }}>
        {/* Kunden-Karte */}
        <motion.div
          className="rounded-2xl border p-7 flex-1"
          style={{ background: '#18181b', borderColor: '#27272a', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, x: '-6vw', rotate: -3 }}
          animate={{
            opacity: phase >= 1 ? 1 : 0,
            x: phase >= 2 ? 0 : '-6vw',
            rotate: phase >= 2 ? 0 : -3
          }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.15 }}
        >
          <div className="text-[0.72vw] uppercase tracking-[0.2em] mb-4" style={{ color: '#52525b' }}>Kunde</div>
          <div className="text-[2.2vw] font-black text-white mb-6" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
            Einfach buchen
          </div>
          <div className="space-y-3">
            {[
              'Studio finden & vergleichen',
              'Buchungsanfrage senden',
              'Angebot annehmen',
              'Anzahlung sicher bezahlen',
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : -8 }}
                transition={{ duration: 0.4, delay: phase >= 2 ? 0.1 + i * 0.08 : 0 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <span className="text-[0.85vw]" style={{ color: '#a1a1aa' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Verbindung */}
        <div className="flex flex-col items-center px-8">
          <motion.div
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }}
            initial={{ width: 0 }}
            animate={{ width: phase >= 2 ? '8vw' : 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl my-4"
            style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#ffffff' }}
            animate={{ scale: phase >= 3 ? [1, 1.15, 1] : 1, rotate: phase >= 3 ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            ✓
          </motion.div>
          <motion.div
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }}
            initial={{ width: 0 }}
            animate={{ width: phase >= 2 ? '8vw' : 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.div
            className="mt-4 text-[0.72vw] text-center uppercase tracking-wider"
            style={{ color: '#52525b' }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            Match
          </motion.div>
        </div>

        {/* Studio-Karte */}
        <motion.div
          className="rounded-2xl border p-7 flex-1"
          style={{ background: '#18181b', borderColor: '#3f3f46', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, x: '6vw', rotate: 3 }}
          animate={{
            opacity: phase >= 1 ? 1 : 0,
            x: phase >= 2 ? 0 : '6vw',
            rotate: phase >= 2 ? 0 : 3
          }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.15 }}
        >
          <div className="text-[0.72vw] uppercase tracking-[0.2em] mb-4" style={{ color: '#52525b' }}>Studio</div>
          <div className="text-[2.2vw] font-black text-white mb-6" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
            Professionell verwalten
          </div>
          <div className="space-y-3">
            {[
              'Anfragen zentral empfangen',
              'Individuelle Angebote erstellen',
              'Kalender & Kapazität steuern',
              'Einnahmen & Rückzahlungen tracken',
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : 8 }}
                transition={{ duration: 0.4, delay: phase >= 2 ? 0.1 + i * 0.08 : 0 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <span className="text-[0.85vw]" style={{ color: '#a1a1aa' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.p
        className="mt-14 text-[1vw] font-light"
        style={{ color: '#52525b' }}
        animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 10 }}
        transition={{ duration: 0.8 }}
      >
        Kein Chaos mehr. Nur noch Kunst.
      </motion.p>
    </motion.div>
  );
}
