import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.h2
        className="text-[2.5vw] font-bold text-white/80 mb-16 text-center"
        style={{ fontFamily: '"Playfair Display", serif' }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
        transition={{ duration: 0.8 }}
      >
        Where Art Meets Precision
      </motion.h2>

      <div className="relative flex items-center justify-center" style={{ width: '70vw', height: '40vh' }}>

        {/* Customer side */}
        <motion.div
          className="absolute rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ width: '26vw', height: '36vh', background: '#18181b', left: '0%' }}
          animate={{
            x: phase >= 2 ? '6vw' : 0,
            rotate: phase >= 2 ? 0 : -4,
            opacity: phase >= 1 ? 1 : 0,
            zIndex: phase >= 3 ? 5 : 1
          }}
          initial={{ x: '-8vw', rotate: -8, opacity: 0 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
        >
          <div className="h-[22vh] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-end p-5">
            <div className="text-white">
              <div className="text-[0.8vw] text-zinc-400 mb-1">Customer</div>
              <div className="text-[1.3vw] font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>Max Hellwig</div>
            </div>
          </div>
          <div className="p-5">
            <div className="text-[0.85vw] text-zinc-400 mb-2">Booking Request Sent</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[0.8vw] text-amber-400">Awaiting offer</span>
            </div>
          </div>
        </motion.div>

        {/* Connection beam */}
        <motion.div
          className="absolute z-10 flex items-center justify-center"
          style={{ width: '22vw', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <motion.div
            className="absolute rounded-full flex items-center justify-center text-white font-bold text-[1.2vw]"
            style={{ width: '5vw', height: '5vw', background: '#10b981' }}
            animate={{ scale: phase >= 3 ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            ✓
          </motion.div>
        </motion.div>

        {/* Studio side */}
        <motion.div
          className="absolute rounded-2xl border shadow-2xl overflow-hidden"
          style={{ width: '26vw', height: '36vh', background: '#18181b', right: '0%', borderColor: 'rgba(16,185,129,0.4)' }}
          animate={{
            x: phase >= 2 ? '-6vw' : 0,
            rotate: phase >= 2 ? 0 : 4,
            opacity: phase >= 1 ? 1 : 0,
            scale: phase >= 3 ? 1.03 : 1,
            zIndex: phase >= 3 ? 10 : 1
          }}
          initial={{ x: '8vw', rotate: 8, opacity: 0 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
        >
          <div className="h-[22vh] flex items-end p-5" style={{ background: 'linear-gradient(135deg, #052e16, #14532d)' }}>
            <div className="text-white">
              <div className="text-[0.8vw] text-emerald-400 mb-1">Studio</div>
              <div className="text-[1.3vw] font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>Black Ink Studio</div>
            </div>
          </div>
          <div className="p-5">
            <div className="text-[0.85vw] text-zinc-400 mb-2">Offer Accepted</div>
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: phase >= 3 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[0.8vw] text-emerald-400">Session confirmed · Deposit paid</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.p
        className="mt-16 text-[1.1vw] text-white/50 uppercase tracking-[0.3em]"
        animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 12 }}
        transition={{ duration: 0.8 }}
      >
        One platform · Two worlds · Zero friction
      </motion.p>
    </motion.div>
  );
}
