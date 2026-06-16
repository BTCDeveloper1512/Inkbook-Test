import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 8000),
      setTimeout(() => setPhase(5), 11000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 px-[10vw]"
      initial={{ opacity: 0, x: '10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-10vw' }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="w-1/2 pr-[5vw] flex flex-col justify-center">
        <motion.div 
          className="h-[2px] w-[50px] bg-emerald-500 mb-8"
          initial={{ width: 0 }}
          animate={{ width: 50 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.h2 
          className="text-[4vw] font-display font-semibold leading-tight mb-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          For the <span className="italic text-emerald-400">Collector</span>
        </motion.h2>
        
        <div className="space-y-4">
          <TextReveal phase={phase} index={1} text="Discover elite studios." />
          <TextReveal phase={phase} index={2} text="Send booking requests instantly." />
          <TextReveal phase={phase} index={3} text="Pay deposits securely." />
          <TextReveal phase={phase} index={4} text="All in one place." />
        </div>
      </div>

      <div className="w-1/2 relative h-[80vh] flex items-center justify-center perspective-[1000px]">
        {/* Studio Discovery Card */}
        <motion.div 
          className="absolute w-[25vw] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, rotateY: 20, z: -200, y: 50 }}
          animate={{ 
            opacity: phase >= 1 ? (phase >= 3 ? 0 : 1) : 0,
            rotateY: phase >= 1 ? 0 : 20,
            z: phase >= 1 ? 0 : -200,
            y: phase >= 1 ? 0 : 50,
            scale: phase >= 2 ? 0.95 : 1
          }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
          <img src={`${import.meta.env.BASE_URL}images/tattoo.jpg`} className="w-full h-[15vw] object-cover" />
          <div className="p-6">
            <h3 className="text-xl font-display font-semibold">Black Ink Studio</h3>
            <p className="text-sm text-zinc-400 mt-1">Fine Line, Blackwork, Realism</p>
            <div className="flex gap-2 mt-4">
              <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs">★ 4.9</div>
              <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs">Berlin</div>
            </div>
          </div>
        </motion.div>

        {/* Booking Form Card */}
        <motion.div 
          className="absolute w-[22vw] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6"
          initial={{ opacity: 0, rotateY: -20, x: 100 }}
          animate={{ 
            opacity: phase >= 2 && phase < 4 ? 1 : 0,
            rotateY: phase >= 2 ? -5 : -20,
            x: phase >= 2 ? 50 : 100,
            y: phase >= 2 ? -20 : 0,
            zIndex: phase >= 2 ? 10 : 0
          }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
          <div className="w-full h-2 bg-zinc-800 rounded-full mb-6 overflow-hidden">
            <motion.div className="h-full bg-emerald-500" initial={{ width: "0%" }} animate={{ width: phase >= 2 ? "100%" : "0%" }} transition={{ duration: 2, delay: 0.5 }} />
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-zinc-800 rounded flex items-center px-4 text-sm text-zinc-400">Oct 15, 2024</div>
            <div className="h-10 bg-zinc-800 rounded flex items-center px-4 text-sm text-zinc-400">14:00 - 18:00</div>
            <div className="h-24 bg-zinc-800 rounded p-4 text-sm text-zinc-400">Wolf sleeve design, matching the reference images...</div>
            <div className="h-12 bg-white text-black font-semibold rounded flex items-center justify-center">Request Booking</div>
          </div>
        </motion.div>

        {/* Deposit Card */}
        <motion.div 
          className="absolute w-[20vw] bg-zinc-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] p-6"
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ 
            opacity: phase >= 3 ? 1 : 0,
            scale: phase >= 3 ? 1 : 0.8,
            y: phase >= 3 ? 0 : 100,
            zIndex: phase >= 3 ? 20 : 0
          }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        >
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
            ✓
          </div>
          <h3 className="text-xl font-display font-semibold mb-2">Offer Received</h3>
          <p className="text-zinc-400 text-sm mb-6">Black Ink Studio accepted your request.</p>
          <div className="flex justify-between items-center mb-6 py-4 border-y border-zinc-800">
            <span className="text-zinc-400">Deposit</span>
            <span className="font-semibold">€150.00</span>
          </div>
          <div className="h-12 bg-emerald-500 text-white font-semibold rounded flex items-center justify-center">Pay with Apple Pay</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function TextReveal({ phase, index, text }: { phase: number, index: number, text: string }) {
  return (
    <motion.p
      className={`text-[1.2vw] ${phase >= index ? 'text-white' : 'text-zinc-600'} transition-colors duration-500`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: phase >= index - 1 ? 1 : 0, x: phase >= index - 1 ? 0 : -20 }}
      transition={{ duration: 0.5, delay: phase === index - 1 ? 0.2 : 0 }}
    >
      {text}
    </motion.p>
  );
}