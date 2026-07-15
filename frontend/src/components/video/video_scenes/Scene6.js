import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const STEPS = [
  { id: 'calendar',  icon: '📅', label: 'Artist & Datum wählen' },
  { id: 'request',   icon: '📝', label: 'Anfrage senden' },
  { id: 'offer',     icon: '💬', label: 'Angebot abwarten' },
  { id: 'payment',   icon: '💳', label: 'Anzahlung leisten' },
  { id: 'confirmed', icon: '✓',  label: 'Termin bestätigt' },
];

const CALENDAR_DAYS = Array.from({ length: 35 }, (_, i) => {
  if (i < 2) return null;
  return i - 1;
});
const BOOKED = [4, 7, 11, 15, 18, 24];
const SELECTED_DAY = 22;

function StepIndicator({ phase }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done    = phase > i + 1;
        const active  = phase === i + 1;
        const pending = phase < i + 1;
        return (
          <div key={s.id} className="flex items-center">
            <motion.div
              className="flex flex-col items-center"
              animate={{
                opacity: pending ? 0.25 : 1,
                scale: active ? 1.12 : 1,
              }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-1.5"
                style={{
                  background: done ? '#ffffff' : active ? '#ffffff' : '#27272a',
                  color: done || active ? '#09090b' : '#52525b',
                  border: active ? '2px solid #ffffff' : '2px solid transparent',
                  boxShadow: active ? '0 0 0 4px rgba(255,255,255,0.12)' : 'none',
                }}
                animate={{ scale: active ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.5, repeat: active ? Infinity : 0, repeatDelay: 1.5 }}
              >
                {done ? '✓' : s.icon}
              </motion.div>
              <span
                className="text-[0.58vw] uppercase tracking-wider whitespace-nowrap"
                style={{ color: active ? '#ffffff' : done ? '#a1a1aa' : '#3f3f46' }}
              >
                {s.label}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                className="h-px mb-6 mx-3"
                style={{ background: done ? '#ffffff' : '#27272a' }}
                initial={{ width: 0 }}
                animate={{ width: phase >= 1 ? '4vw' : 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, style, visible, delay = 0 }) {
  return (
    <motion.div
      className="rounded-2xl border"
      style={{
        background: '#18181b',
        borderColor: '#27272a',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        ...style,
      }}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24, scale: visible ? 1 : 0.96 }}
      transition={{ duration: 0.7, delay: visible ? delay : 0, type: 'spring', bounce: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 4500),
      setTimeout(() => setPhase(3), 8500),
      setTimeout(() => setPhase(4), 12500),
      setTimeout(() => setPhase(5), 16500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '3vh 5vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Overline */}
      <motion.div
        className="text-[0.72vw] uppercase tracking-[0.22em] mb-3"
        style={{ color: '#52525b' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        03 — Buchungsflow
      </motion.div>
      <motion.h2
        className="font-black text-center text-white mb-8"
        style={{
          fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif",
          fontSize: '2.8vw',
          lineHeight: 1.1,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        Von Anfrage zu <em style={{ color: '#a1a1aa' }}>bestätigtem Termin</em>
      </motion.h2>

      {/* Step indicator */}
      <StepIndicator phase={phase} />

      {/* Cards row */}
      <div className="flex items-start justify-center gap-4 w-full" style={{ maxWidth: '88vw' }}>

        {/* ── STEP 1: Artist + Kalender ── */}
        <Card visible={phase >= 1} delay={0} style={{ width: '18vw', flexShrink: 0 }}>
          <div className="p-4">
            {/* Artist */}
            <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg,#3f3f46,#27272a)', border: '2px solid #3f3f46' }}
              >
                JS
              </div>
              <div>
                <div className="text-[0.85vw] font-semibold text-white">Julia Schmidt</div>
                <div className="text-[0.65vw]" style={{ color: '#71717a' }}>Fine Line · Realism</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span style={{ color: '#fbbf24', fontSize: '0.55vw' }}>★★★★★</span>
                  <span className="text-[0.58vw]" style={{ color: '#71717a' }}>4.9</span>
                </div>
              </div>
            </div>
            {/* Calendar */}
            <div className="text-[0.68vw] font-semibold text-white mb-2">Juni 2026</div>
            <div className="grid grid-cols-7 gap-0.5">
              {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
                <div key={d} className="text-center text-[0.52vw] pb-1" style={{ color: '#52525b' }}>{d}</div>
              ))}
              {CALENDAR_DAYS.map((day, i) => {
                if (!day) return <div key={i} />;
                const isBooked   = BOOKED.includes(day);
                const isSelected = day === SELECTED_DAY;
                return (
                  <motion.div
                    key={i}
                    className="aspect-square rounded flex items-center justify-center text-[0.6vw] font-medium"
                    style={{
                      background: isSelected ? '#ffffff' : isBooked ? '#3f3f46' : '#27272a',
                      color:      isSelected ? '#09090b' : isBooked ? '#52525b' : '#71717a',
                      cursor:     isBooked   ? 'not-allowed' : 'pointer',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0 }}
                    transition={{ duration: 0.2, delay: phase >= 1 ? 0.5 + i * 0.01 : 0 }}
                  >
                    {day}
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              className="mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #3f3f46' }}
              animate={{ opacity: phase >= 1 ? 1 : 0 }}
              transition={{ delay: 1.2 }}
            >
              <span style={{ color: '#34d399', fontSize: '0.65vw' }}>●</span>
              <span className="text-[0.65vw]" style={{ color: '#a1a1aa' }}>Mi. 22. Juni · 14:00 Uhr</span>
            </motion.div>
          </div>
        </Card>

        {/* ── STEP 2: Buchungsformular ── */}
        <Card visible={phase >= 2} delay={0.1} style={{ width: '16vw', flexShrink: 0 }}>
          <div className="p-4">
            <div className="text-[0.82vw] font-semibold text-white mb-3">Termin anfragen</div>

            {/* Terminart */}
            <div className="text-[0.6vw] uppercase tracking-wider mb-1.5" style={{ color: '#52525b' }}>Terminart</div>
            <div className="flex gap-1.5 mb-3">
              {['Beratung', 'Tattoo'].map((t, i) => (
                <div
                  key={t}
                  className="flex-1 rounded-lg py-1.5 text-center text-[0.68vw] font-medium"
                  style={{
                    background: i === 1 ? '#ffffff' : '#27272a',
                    color:      i === 1 ? '#09090b' : '#52525b',
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Größe */}
            <div className="text-[0.6vw] uppercase tracking-wider mb-1.5" style={{ color: '#52525b' }}>Tätoo-Größe</div>
            <div className="space-y-1 mb-3">
              {[
                { lbl: 'Mini', price: '1 Pt.', active: false },
                { lbl: 'Small', price: '2 Pt.', active: true },
                { lbl: 'Medium', price: '3 Pt.', active: false },
                { lbl: 'Large', price: '5 Pt.', active: false },
              ].map(({ lbl, price, active }) => (
                <motion.div
                  key={lbl}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                  style={{
                    background: active ? '#ffffff' : '#27272a',
                    color:      active ? '#09090b' : '#71717a',
                  }}
                  animate={{ opacity: phase >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: phase >= 2 ? 0.3 : 0 }}
                >
                  <span className="text-[0.68vw] font-medium">{lbl}</span>
                  <span className="text-[0.62vw]">{price}</span>
                </motion.div>
              ))}
            </div>

            {/* Datum */}
            <div
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <span style={{ color: '#34d399', fontSize: '0.72vw' }}>📅</span>
              <span className="text-[0.68vw]" style={{ color: '#34d399' }}>Mi. 22. Juni 2026</span>
            </div>

            <motion.div
              className="rounded-lg py-2 text-center text-[0.75vw] font-semibold text-black bg-white"
              animate={{ scale: phase === 2 ? [1, 1.03, 1] : 1 }}
              transition={{ duration: 0.4, delay: 0.8, repeat: 2, repeatDelay: 1.2 }}
            >
              Anfrage senden →
            </motion.div>
          </div>
        </Card>

        {/* ── STEP 3: Auf Angebot warten ── */}
        <Card visible={phase >= 3} delay={0.1} style={{ width: '16vw', flexShrink: 0 }}>
          <div className="p-4">
            <div className="text-[0.82vw] font-semibold text-white mb-3">Angebot abwarten</div>

            {/* Status badge */}
            <motion.div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#a78bfa' }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[0.68vw]" style={{ color: '#a78bfa' }}>Studio bearbeitet Anfrage…</span>
            </motion.div>

            {/* Countdown */}
            <div className="rounded-lg p-3 mb-3" style={{ background: '#27272a' }}>
              <div className="text-[0.6vw] uppercase tracking-wider mb-1" style={{ color: '#52525b' }}>Angebot läuft ab in</div>
              <div className="flex items-end gap-1">
                <span className="text-[1.8vw] font-black text-white" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>23</span>
                <span className="text-[0.65vw] mb-0.5" style={{ color: '#71717a' }}>Std</span>
                <span className="text-[1.8vw] font-black text-white" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>47</span>
                <span className="text-[0.65vw] mb-0.5" style={{ color: '#71717a' }}>Min</span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              {[
                '✓ Anfrage eingegangen',
                '✓ Studio benachrichtigt',
                '○ Angebot ausstehend',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="text-[0.65vw]"
                    style={{ color: t.startsWith('✓') ? '#34d399' : '#3f3f46' }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            {/* Angebot notification */}
            <motion.div
              className="mt-3 rounded-lg p-2.5 flex items-start gap-2"
              style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}
              animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 8 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              <span style={{ fontSize: '0.8vw' }}>🔔</span>
              <div>
                <div className="text-[0.68vw] font-semibold text-white leading-snug">Angebot eingegangen!</div>
                <div className="text-[0.6vw]" style={{ color: '#71717a' }}>Julia Schmidt · Black Ink Studio</div>
              </div>
            </motion.div>
          </div>
        </Card>

        {/* ── STEP 4: Anzahlung ── */}
        <Card visible={phase >= 4} delay={0.1} style={{ width: '16vw', flexShrink: 0 }}>
          <div className="p-4">
            <div className="text-[0.82vw] font-semibold text-white mb-1">Angebot annehmen</div>
            <div className="text-[0.65vw] mb-3" style={{ color: '#71717a' }}>Black Ink Studio</div>

            {/* Offer details */}
            <div className="rounded-lg p-2.5 mb-3 text-[0.65vw] leading-relaxed" style={{ background: '#27272a', color: '#a1a1aa' }}>
              "Fine-Line Sleeve, 4 Std. Termin am 22.06. um 14:00 Uhr. Freuen uns auf euch!"
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 mb-3 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
              {[
                ['Gesamtpreis', '€ 420,00'],
                ['Anzahlung (30%)', '€ 126,00'],
                ['Rest vor Termin', '€ 294,00'],
              ].map(([lbl, val], i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[0.65vw]" style={{ color: '#71717a' }}>{lbl}</span>
                  <span className="text-[0.72vw] font-semibold text-white">{val}</span>
                </div>
              ))}
            </div>

            {/* Stripe button */}
            <motion.div
              className="rounded-lg py-2.5 flex items-center justify-center gap-2"
              style={{ background: '#635bff' }}
              animate={{ scale: phase === 4 ? [1, 1.03, 1] : 1 }}
              transition={{ duration: 0.4, delay: 1, repeat: 2, repeatDelay: 1.5 }}
            >
              <span className="text-[0.72vw] font-bold text-white">Jetzt bezahlen via</span>
              <span className="text-[0.72vw] font-black text-white tracking-tight">Stripe</span>
            </motion.div>

            <div className="flex items-center justify-center gap-1 mt-2">
              <span style={{ color: '#52525b', fontSize: '0.6vw' }}>🔒</span>
              <span className="text-[0.58vw]" style={{ color: '#52525b' }}>SSL-verschlüsselt · Sicher</span>
            </div>
          </div>
        </Card>

        {/* ── STEP 5: Bestätigt ── */}
        <Card
          visible={phase >= 5}
          delay={0.1}
          style={{ width: '16vw', flexShrink: 0, borderColor: 'rgba(52,211,153,0.3)', position: 'relative', overflow: 'hidden' }}
        >
          {/* Green glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 70%)' }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ duration: 1 }}
          />
          <div className="p-4 relative">
            {/* Check icon */}
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)', color: '#34d399' }}
              animate={{ scale: phase >= 5 ? [0.5, 1.15, 1] : 0.5 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.4 }}
            >
              ✓
            </motion.div>

            <div className="text-center mb-4">
              <div className="text-[0.88vw] font-bold text-white mb-1">Termin bestätigt!</div>
              <div className="text-[0.65vw]" style={{ color: '#71717a' }}>Zahlung erfolgreich</div>
            </div>

            {/* Booking summary */}
            <div className="space-y-2">
              {[
                ['Artist', 'Julia Schmidt'],
                ['Datum', 'Mi. 22. Juni 2026'],
                ['Uhrzeit', '14:00 – 18:00 Uhr'],
                ['Studio', 'Black Ink Studio'],
                ['Anzahlung', '€ 126,00 ✓'],
              ].map(([lbl, val], i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                  style={{ borderColor: '#27272a' }}
                  animate={{ opacity: phase >= 5 ? 1 : 0, x: phase >= 5 ? 0 : 8 }}
                  transition={{ duration: 0.35, delay: phase >= 5 ? 0.5 + i * 0.08 : 0 }}
                >
                  <span className="text-[0.62vw]" style={{ color: '#71717a' }}>{lbl}</span>
                  <span
                    className="text-[0.68vw] font-medium"
                    style={{ color: val.includes('✓') ? '#34d399' : '#ffffff' }}
                  >
                    {val}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Confetti dots */}
            {phase >= 5 && [0, 1, 2, 3, 4, 5].map(i => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: ['#34d399','#a78bfa','#ffffff','#fbbf24','#34d399','#a78bfa'][i],
                  left: `${15 + i * 13}%`,
                  top: '8%',
                }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: [0, -20, 40], opacity: [1, 1, 0] }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
              />
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
