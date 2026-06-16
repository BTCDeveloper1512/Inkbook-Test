import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function Step({ phase, index, icon, title, desc }) {
  const active = phase >= index;
  return (
    <motion.div
      className="flex items-start gap-4"
      animate={{ opacity: active ? 1 : 0.2, x: active ? 0 : 8 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
        style={{
          background: active ? '#ffffff' : '#27272a',
          color: active ? '#09090b' : '#52525b'
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="text-[1vw] font-semibold mb-0.5"
          style={{ color: active ? '#ffffff' : '#52525b' }}
        >
          {title}
        </div>
        <div className="text-[0.8vw]" style={{ color: active ? '#a1a1aa' : '#3f3f46' }}>
          {desc}
        </div>
      </div>
    </motion.div>
  );
}

const DAYS = Array.from({ length: 35 }, (_, i) => i < 3 ? null : i - 2);
const CONFIRMED = [5, 8, 14, 19, 22, 26];
const PENDING = [11, 17, 29];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 7000),
      setTimeout(() => setPhase(4), 10500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-row-reverse items-center z-10"
      style={{ padding: '0 7vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '4vw' }}
      transition={{ duration: 0.8 }}
    >
      {/* Right text */}
      <div className="w-[40%] flex flex-col pl-[4vw]">
        <motion.div
          className="text-[0.75vw] uppercase tracking-[0.2em] mb-4"
          style={{ color: '#52525b' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          02 — Studios
        </motion.div>
        <motion.h2
          className="font-black leading-tight mb-8 text-white"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '3.8vw',
            lineHeight: 1.1
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Dein Studio.<br />
          <em style={{ color: '#a1a1aa' }}>Dein Tempo.</em>
        </motion.h2>

        <div className="space-y-6">
          <Step phase={phase} index={1} icon="📅" title="Anfragen verwalten" desc="Alle Buchungsanfragen übersichtlich an einem Ort" />
          <Step phase={phase} index={2} icon="✉️" title="Individuelle Angebote senden" desc="Preis, Datum und Details direkt mit dem Kunden abstimmen" />
          <Step phase={phase} index={3} icon="🗓" title="Kalender & Kapazitäten" desc="Blockiere Tage, verwalte Auslastung und Öffnungszeiten" />
          <Step phase={phase} index={4} icon="📊" title="Einnahmen tracken" desc="Anzahlungen, offene Beträge und Monatsübersichten" />
        </div>
      </div>

      {/* Left mockups */}
      <div className="w-[60%] relative h-[80vh]" style={{ perspective: '1200px' }}>

        {/* Kalender */}
        <motion.div
          className="absolute rounded-2xl border p-5"
          style={{
            width: '28vw',
            top: '3%',
            left: '0%',
            background: '#18181b',
            borderColor: '#27272a',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: phase >= 1 ? (phase >= 3 ? 0.4 : 1) : 0, y: phase >= 1 ? 0 : 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[1vw] font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>Oktober 2024</span>
            <div className="flex gap-3 text-[0.68vw]" style={{ color: '#71717a' }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block bg-white" /> Bestätigt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#71717a' }} /> Ausstehend
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
              <div key={d} className="text-center text-[0.6vw] pb-1" style={{ color: '#52525b' }}>{d}</div>
            ))}
            {DAYS.map((day, i) => {
              if (!day) return <div key={i} />;
              const isConf = CONFIRMED.includes(day);
              const isPend = PENDING.includes(day);
              return (
                <motion.div
                  key={i}
                  className="aspect-square rounded-md flex items-center justify-center text-[0.72vw] font-medium"
                  style={{
                    background: isConf ? '#ffffff' : isPend ? '#3f3f46' : '#27272a',
                    color: isConf ? '#09090b' : isPend ? '#e4e4e7' : '#71717a',
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.25, delay: phase >= 1 ? 0.6 + i * 0.012 : 0 }}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Anfragen-Liste */}
        <motion.div
          className="absolute rounded-2xl border p-5"
          style={{
            width: '24vw',
            top: '28%',
            right: '0%',
            background: '#18181b',
            borderColor: '#27272a',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.15 }}
        >
          <div className="text-[0.9vw] font-semibold text-white mb-4">Neue Anfragen</div>
          {[
            { name: 'Max H.', stil: 'Blackwork', status: 'Neu', dot: '#ffffff' },
            { name: 'Julia M.', stil: 'Fine Line', status: 'Angebot gesendet', dot: '#71717a' },
            { name: 'Tom K.', stil: 'Realism', status: 'Bestätigt', dot: '#a1a1aa' },
          ].map(({ name, stil, status, dot }, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-b-0"
              style={{ borderColor: '#27272a' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : -10 }}
              transition={{ duration: 0.5, delay: phase >= 2 ? 0.2 + i * 0.1 : 0 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[0.75vw] font-bold shrink-0"
                style={{ background: '#27272a', color: '#a1a1aa' }}
              >
                {name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.82vw] font-medium text-white">{name}</div>
                <div className="text-[0.72vw]" style={{ color: '#71717a' }}>{stil}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                <span className="text-[0.72vw]" style={{ color: '#a1a1aa' }}>{status}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue Card */}
        <motion.div
          className="absolute rounded-2xl border p-5"
          style={{
            width: '22vw',
            bottom: '3%',
            left: '5%',
            background: '#18181b',
            borderColor: '#3f3f46',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.2 }}
        >
          <div className="text-[0.72vw] uppercase tracking-wider mb-2" style={{ color: '#52525b' }}>Monatseinnahmen</div>
          <motion.div
            className="text-[3vw] font-black text-white leading-none mb-1"
            style={{ fontFamily: '"Playfair Display", serif' }}
            animate={{ opacity: phase >= 4 ? 1 : 0.3 }}
            transition={{ duration: 0.6 }}
          >
            € 12.450
          </motion.div>
          <div className="text-[0.8vw] mb-5" style={{ color: '#71717a' }}>Oktober 2024</div>
          <div className="flex items-end gap-1.5 border-b pb-2" style={{ height: '6vw', borderColor: '#27272a' }}>
            {[30, 55, 40, 80, 45, 95, 65].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t"
                style={{ background: i === 5 ? '#ffffff' : '#3f3f46' }}
                initial={{ height: 0 }}
                animate={{ height: phase >= 4 ? `${h}%` : 0 }}
                transition={{ duration: 0.7, delay: phase >= 4 ? 0.2 + i * 0.07 : 0, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {['W1','W2','W3','W4','W5','W6','W7'].map(w => (
              <span key={w} className="text-[0.55vw]" style={{ color: '#52525b' }}>{w}</span>
            ))}
          </div>
        </motion.div>

        {/* Rückzahlung-Benachrichtigung */}
        <motion.div
          className="absolute rounded-xl border p-4 flex items-start gap-3"
          style={{
            width: '22vw',
            top: '58%',
            right: '1%',
            background: 'rgba(24,24,27,0.95)',
            borderColor: '#3f3f46',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
          }}
          animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 16 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: '#27272a' }}
          >
            🔔
          </div>
          <div>
            <div className="text-[0.85vw] font-semibold text-white mb-1">Rückzahlung ausstehend</div>
            <div className="text-[0.72vw] leading-relaxed" style={{ color: '#a1a1aa' }}>
              Kunde stornierte im kostenlosen Zeitfenster.
            </div>
            <div
              className="mt-2.5 inline-block text-[0.72vw] font-semibold text-black px-3 py-1.5 rounded-md cursor-default bg-white"
            >
              💳 Anzahlung zurückzahlen
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
