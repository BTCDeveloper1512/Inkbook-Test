import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function TextReveal({ phase, index, text }) {
  return (
    <motion.p
      className="text-[1.15vw] font-medium"
      style={{ color: phase >= index ? '#ffffff' : '#3f3f46' }}
      animate={{ opacity: phase >= index - 1 ? 1 : 0, x: phase >= index - 1 ? 0 : -16 }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.p>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 6000),
      setTimeout(() => setPhase(4), 9500),
      setTimeout(() => setPhase(5), 12500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 px-[8vw]"
      initial={{ opacity: 0, x: '8vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-8vw' }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="w-[45%] pr-[4vw] flex flex-col justify-center">
        <motion.div
          className="h-px bg-emerald-500 mb-8"
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
          For the <em className="text-emerald-400">Collector</em>
        </motion.h2>
        <div className="space-y-5">
          <TextReveal phase={phase} index={1} text="Discover elite studios" />
          <TextReveal phase={phase} index={2} text="Send booking requests instantly" />
          <TextReveal phase={phase} index={3} text="Pay deposits securely" />
          <TextReveal phase={phase} index={4} text="Cancel — hassle free" />
        </div>
      </div>

      <div className="w-[55%] relative h-[75vh] flex items-center justify-center" style={{ perspective: '1000px' }}>

        {/* Studio Discovery Card */}
        <motion.div
          className="absolute rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ width: '26vw', background: '#18181b' }}
          animate={{
            opacity: phase >= 1 && phase < 3 ? 1 : phase >= 3 ? 0.2 : 0,
            rotateY: phase >= 1 ? 0 : 15,
            y: phase >= 1 ? 0 : 40,
            scale: phase >= 2 ? 0.94 : 1,
            zIndex: 1
          }}
          transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
        >
          <div className="h-[14vw] bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-end p-5">
            <div>
              <div className="flex gap-2 mb-3">
                {['Fine Line', 'Blackwork', 'Realism'].map(tag => (
                  <span key={tag} className="text-[0.7vw] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="text-[1.3vw] font-bold text-white mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>Black Ink Studio</div>
            <div className="text-[0.9vw] text-zinc-400 mb-4">Berlin, Germany</div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 text-[0.8vw] text-zinc-400">
                <span className="text-amber-400">★</span> 4.9
              </div>
              <div className="text-[0.8vw] text-zinc-500">48 completed sessions</div>
            </div>
          </div>
        </motion.div>

        {/* Booking Form */}
        <motion.div
          className="absolute rounded-2xl border border-white/10 shadow-2xl p-6"
          style={{ width: '23vw', background: '#18181b', top: '10%', right: '0%' }}
          animate={{
            opacity: phase >= 2 && phase < 4 ? 1 : 0,
            y: phase >= 2 ? 0 : 30,
            zIndex: phase >= 2 ? 5 : 0
          }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          <div className="text-[1vw] font-semibold text-white mb-5">New Booking Request</div>
          <div className="space-y-3 mb-5">
            {[['Date', 'October 15, 2024'], ['Time', '14:00 – 18:00'], ['Style', 'Blackwork Sleeve']].map(([label, val]) => (
              <div key={label} className="rounded-lg px-3 py-2.5 flex items-center" style={{ background: '#27272a' }}>
                <span className="text-[0.75vw] text-zinc-500 w-[6vw]">{label}</span>
                <span className="text-[0.85vw] text-white">{val}</span>
              </div>
            ))}
            <div className="rounded-lg px-3 py-3 text-[0.8vw] text-zinc-400" style={{ background: '#27272a' }}>
              Wolf sleeve design, matching reference images…
            </div>
          </div>
          <div className="rounded-lg py-3 text-center text-[0.9vw] font-semibold text-black bg-white">
            Send Request
          </div>
        </motion.div>

        {/* Offer / Deposit Card */}
        <motion.div
          className="absolute rounded-2xl border shadow-2xl p-6"
          style={{ width: '22vw', background: '#18181b', borderColor: 'rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.08)', bottom: '8%', left: '4%' }}
          animate={{
            opacity: phase >= 3 ? 1 : 0,
            scale: phase >= 3 ? 1 : 0.85,
            y: phase >= 3 ? 0 : 40,
            zIndex: phase >= 3 ? 10 : 0
          }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 text-lg" style={{ background: 'rgba(16,185,129,0.15)' }}>✓</div>
            <div>
              <div className="text-[1vw] font-bold text-white">Offer Received</div>
              <div className="text-[0.8vw] text-zinc-400">Black Ink Studio</div>
            </div>
          </div>
          <div className="py-4 border-y flex justify-between items-center mb-5" style={{ borderColor: '#27272a' }}>
            <span className="text-[0.85vw] text-zinc-400">Deposit required</span>
            <span className="text-[1.1vw] font-bold text-white">€ 150</span>
          </div>
          <motion.div
            className="rounded-lg py-3 text-center text-[0.9vw] font-semibold text-black"
            style={{ background: '#10b981' }}
            animate={{ scale: phase >= 4 ? [1, 1.03, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            Pay Deposit · Stripe
          </motion.div>
        </motion.div>

        {/* Confirmed badge */}
        <motion.div
          className="absolute top-[6%] right-[2%] rounded-xl px-4 py-3 border flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }}
          animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : -12 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[0.85vw] font-medium text-emerald-400">Session Confirmed</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
