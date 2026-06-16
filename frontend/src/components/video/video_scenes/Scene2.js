import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function Step({ phase, index, icon, title, desc }) {
  const active = phase >= index;
  return (
    <motion.div
      className="flex items-start gap-4"
      animate={{ opacity: active ? 1 : 0.2, x: active ? 0 : -8 }}
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

function Card({ children, style, animate, transition, initial }) {
  return (
    <motion.div
      className="absolute rounded-2xl border"
      style={{
        background: '#18181b',
        borderColor: '#27272a',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        ...style
      }}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export function Scene2() {
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
      className="absolute inset-0 flex items-center z-10"
      style={{ padding: '0 7vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-4vw' }}
      transition={{ duration: 0.8 }}
    >
      {/* Left text */}
      <div className="w-[40%] flex flex-col pr-[4vw]">
        <motion.div
          className="text-[0.75vw] uppercase tracking-[0.2em] mb-4"
          style={{ color: '#52525b' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          01 — Kunden
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
          Buche dein<br />
          <em style={{ color: '#a1a1aa' }}>Wunschtattoo</em>
        </motion.h2>

        <div className="space-y-6">
          <Step phase={phase} index={1} icon="🔍" title="Studio entdecken" desc="Durchstöbere verifizierte Tattoo‑Studios in deiner Stadt" />
          <Step phase={phase} index={2} icon="📝" title="Buchungsanfrage senden" desc="Beschreibe dein Tattoo, Wunschzeit und Stil" />
          <Step phase={phase} index={3} icon="💬" title="Angebot annehmen" desc="Das Studio sendet dir ein individuelles Angebot" />
          <Step phase={phase} index={4} icon="💳" title="Anzahlung bezahlen" desc="Sichere deinen Termin mit einer Anzahlung via Stripe" />
        </div>
      </div>

      {/* Right mockups */}
      <div className="w-[60%] relative h-[80vh]" style={{ perspective: '1200px' }}>

        {/* Studiokarte */}
        <Card
          style={{ width: '25vw', top: '5%', left: '5%' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: phase >= 1 ? (phase >= 3 ? 0.3 : 1) : 0, y: phase >= 1 ? 0 : 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          <div
            className="rounded-t-2xl flex items-end p-5"
            style={{ height: '12vw', background: 'linear-gradient(135deg, #27272a, #18181b)' }}
          >
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {['Fine Line', 'Blackwork'].map(tag => (
                  <span key={tag} className="text-[0.7vw] rounded-full px-2 py-0.5"
                    style={{ background: '#27272a', color: '#71717a', border: '1px solid #3f3f46' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-[1.2vw] font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                Black Ink Studio
              </div>
              <div className="text-[0.8vw] mt-1" style={{ color: '#71717a' }}>Berlin · ★ 4.9</div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[['48', 'Sessions'], ['100%', 'Verifiziert'], ['24h', 'Antwortzeit'], ['€80', 'ab / Std']].map(([val, lbl]) => (
                <div key={lbl} className="rounded-lg p-3" style={{ background: '#27272a' }}>
                  <div className="text-[1.1vw] font-bold text-white">{val}</div>
                  <div className="text-[0.7vw] mt-0.5" style={{ color: '#71717a' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Buchungsformular */}
        <Card
          style={{ width: '23vw', top: '18%', right: '0%' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 2 && phase < 4 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.15 }}
        >
          <div className="p-5">
            <div className="text-[0.95vw] font-semibold text-white mb-4">Buchungsanfrage</div>
            <div className="space-y-2.5 mb-4">
              {[
                ['Datum', '15. Oktober 2024'],
                ['Wunschzeit', '14:00 – 18:00 Uhr'],
                ['Stil', 'Blackwork Sleeve'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="rounded-lg px-3 py-2.5 flex items-center gap-3" style={{ background: '#27272a' }}>
                  <span className="text-[0.72vw] shrink-0" style={{ color: '#52525b', width: '6vw' }}>{lbl}</span>
                  <span className="text-[0.82vw] text-white">{val}</span>
                </div>
              ))}
              <div className="rounded-lg p-3 text-[0.78vw] leading-relaxed" style={{ background: '#27272a', color: '#a1a1aa' }}>
                Wolfs-Sleeve nach Referenzbildern, Unterarm komplett…
              </div>
            </div>
            <div className="rounded-lg py-2.5 text-center text-[0.88vw] font-semibold text-black bg-white">
              Anfrage senden
            </div>
          </div>
        </Card>

        {/* Angebot erhalten */}
        <Card
          style={{ width: '22vw', bottom: '4%', left: '8%', borderColor: '#3f3f46' }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, scale: phase >= 3 ? 1 : 0.9, y: phase >= 3 ? 0 : 20 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.2 }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: '#3f3f46' }}
              >
                B
              </div>
              <div>
                <div className="text-[0.9vw] font-semibold text-white">Angebot erhalten</div>
                <div className="text-[0.72vw]" style={{ color: '#71717a' }}>Black Ink Studio</div>
              </div>
            </div>
            <div className="rounded-lg p-3 mb-4 text-[0.78vw] leading-relaxed" style={{ background: '#27272a', color: '#a1a1aa' }}>
              "Wir freuen uns auf deinen Sleeve! Termin am 15.10., 4 Stunden. Anzahlung: €150."
            </div>
            <div className="flex justify-between items-center py-3 border-y mb-4" style={{ borderColor: '#27272a' }}>
              <span className="text-[0.82vw]" style={{ color: '#71717a' }}>Anzahlung</span>
              <span className="text-[1.1vw] font-bold text-white">€ 150,00</span>
            </div>
            <motion.div
              className="rounded-lg py-2.5 text-center text-[0.88vw] font-semibold text-black bg-white"
              animate={{ scale: phase >= 4 ? [1, 1.04, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              Jetzt bezahlen · Stripe
            </motion.div>
          </div>
        </Card>

        {/* Bestätigt Badge */}
        <motion.div
          className="absolute top-[4%] right-[2%] rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#27272a', border: '1px solid #3f3f46' }}
          animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : -10 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[0.82vw] font-medium text-white">Termin bestätigt</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
