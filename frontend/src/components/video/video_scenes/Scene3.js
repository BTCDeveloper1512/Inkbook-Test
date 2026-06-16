import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function TextReveal({ phase, index, text }) {
  return (
    <motion.p
      className="text-[1.15vw] font-medium"
      style={{ color: phase >= index ? '#ffffff' : '#3f3f46' }}
      animate={{ opacity: phase >= index - 1 ? 1 : 0, x: phase >= index - 1 ? 0 : 16 }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.p>
  );
}

const DAYS = Array.from({ length: 35 }, (_, i) => i < 2 ? null : i - 1);
const CONFIRMED = [5, 8, 12, 19, 24];
const PENDING = [15, 20, 27];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 9500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-row-reverse items-center justify-center z-10 px-[8vw]"
      initial={{ opacity: 0, x: '-8vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '8vw' }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="w-[45%] pl-[4vw] flex flex-col justify-center">
        <motion.div
          className="h-px bg-white mb-8"
          initial={{ width: 0 }}
          animate={{ width: 48 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        <motion.h2
          className="text-[4vw] font-bold leading-tight mb-8 text-white"
          style={{ fontFamily: '"Playfair Display", serif' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          For the <em className="text-white/40">Studio</em>
        </motion.h2>
        <div className="space-y-5">
          <TextReveal phase={phase} index={1} text="Manage your calendar" />
          <TextReveal phase={phase} index={2} text="Send custom offers" />
          <TextReveal phase={phase} index={3} text="Track your revenue" />
          <TextReveal phase={phase} index={4} text="Focus on the art" />
        </div>
      </div>

      <div className="w-[55%] relative h-[75vh] flex items-center justify-center" style={{ perspective: '1000px' }}>

        {/* Calendar Card */}
        <motion.div
          className="absolute rounded-2xl border border-white/10 shadow-2xl p-5"
          style={{ width: '28vw', background: '#18181b', top: '5%', left: '0%' }}
          animate={{
            opacity: phase >= 1 ? (phase >= 3 ? 0.4 : 1) : 0,
            y: phase >= 1 ? (phase >= 3 ? -20 : 0) : 40,
            zIndex: 1
          }}
          transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[1vw] font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>October 2024</span>
            <div className="flex gap-3 text-[0.7vw] text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-emerald-500" /> Confirmed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-amber-500" /> Pending</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[0.65vw] text-zinc-600 pb-1">{d}</div>
            ))}
            {DAYS.map((day, i) => {
              if (!day) return <div key={i} />;
              const isConf = CONFIRMED.includes(day);
              const isPend = PENDING.includes(day);
              return (
                <motion.div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-[0.75vw] font-medium"
                  style={{
                    background: isConf ? 'rgba(16,185,129,0.2)' : isPend ? 'rgba(245,158,11,0.2)' : '#27272a',
                    color: isConf ? '#34d399' : isPend ? '#fbbf24' : '#71717a',
                    border: isConf ? '1px solid rgba(16,185,129,0.4)' : isPend ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent'
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: phase >= 1 ? 0.8 + i * 0.015 : 0 }}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Revenue Dashboard */}
        <motion.div
          className="absolute rounded-2xl border border-white/10 shadow-2xl p-6"
          style={{ width: '25vw', background: '#18181b', bottom: '5%', right: '0%' }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 30,
            zIndex: phase >= 2 ? 5 : 0
          }}
          transition={{ duration: 0.9, type: 'spring', bounce: 0.2 }}
        >
          <div className="text-[0.8vw] text-zinc-500 font-medium mb-3 uppercase tracking-wider">Monthly Revenue</div>
          <motion.div
            className="text-[3.5vw] font-bold text-white leading-none mb-1"
            style={{ fontFamily: '"Playfair Display", serif' }}
            animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
            transition={{ duration: 0.6 }}
          >
            €12,450
          </motion.div>
          <motion.div
            className="text-[0.85vw] font-medium mb-6"
            style={{ color: '#10b981' }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            ↑ +14% vs last month
          </motion.div>
          <div className="flex items-end gap-1.5 h-[8vw] border-b pb-2" style={{ borderColor: '#27272a' }}>
            {[35, 55, 42, 78, 48, 90, 68].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t"
                style={{ background: i === 5 ? '#10b981' : '#27272a' }}
                initial={{ height: 0 }}
                animate={{ height: phase >= 3 ? `${h}%` : 0 }}
                transition={{ duration: 0.8, delay: phase >= 3 ? 0.3 + i * 0.08 : 0, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['W1','W2','W3','W4','W5','W6','W7'].map(w => (
              <span key={w} className="text-[0.6vw] text-zinc-600">{w}</span>
            ))}
          </div>
        </motion.div>

        {/* Refund Notification */}
        <motion.div
          className="absolute rounded-xl border shadow-2xl p-4 flex items-start gap-3"
          style={{ width: '22vw', background: 'rgba(24,24,27,0.95)', borderColor: 'rgba(245,158,11,0.3)', top: '38%', right: '2%' }}
          animate={{
            opacity: phase >= 4 ? 1 : 0,
            y: phase >= 4 ? 0 : 20,
            zIndex: phase >= 4 ? 20 : 0
          }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            🔔
          </div>
          <div>
            <div className="text-[0.9vw] font-semibold text-white mb-1">Rückzahlung ausstehend</div>
            <div className="text-[0.75vw] text-zinc-400 leading-relaxed">Kunde stornierte im freien Zeitfenster. Anzahlung zurückzahlen.</div>
            <div className="mt-3 inline-block text-[0.75vw] font-semibold text-black px-3 py-1.5 rounded-lg cursor-default" style={{ background: '#f59e0b' }}>
              💳 Anzahlung zurückzahlen
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
