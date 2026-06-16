import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="relative w-[60vw] h-[60vh] flex items-center justify-center">
        {/* Left Side: Client */}
        <motion.div 
          className="absolute left-0 w-[24vw] h-[32vw] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden"
          initial={{ x: '-20vw', rotate: -10, opacity: 0 }}
          animate={{ 
            x: phase >= 1 ? (phase >= 2 ? '10vw' : 0) : '-20vw', 
            rotate: phase >= 1 ? (phase >= 2 ? 0 : -5) : -10,
            opacity: 1,
            zIndex: phase >= 2 ? 10 : 0
          }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
        >
          <img src={`${import.meta.env.BASE_URL}images/tattoo.jpg`} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black font-semibold text-xl mb-4">C</div>
             <p className="text-white font-medium text-lg">Booking Sent</p>
          </div>
        </motion.div>

        {/* Right Side: Studio */}
        <motion.div 
          className="absolute right-0 w-[24vw] h-[32vw] bg-zinc-900 border border-emerald-500/30 rounded-2xl overflow-hidden"
          initial={{ x: '20vw', rotate: 10, opacity: 0 }}
          animate={{ 
            x: phase >= 1 ? (phase >= 2 ? '-10vw' : 0) : '20vw', 
            rotate: phase >= 1 ? (phase >= 2 ? 0 : 5) : 10,
            opacity: 1,
            scale: phase >= 2 ? 1.05 : 1,
            zIndex: phase >= 2 ? 20 : 0
          }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
        >
          <img src={`${import.meta.env.BASE_URL}images/studio.jpg`} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20 flex flex-col justify-end p-8">
             <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-xl mb-4">S</div>
             <p className="text-white font-medium text-lg">Offer Accepted</p>
             <motion.div 
               className="mt-4 h-12 bg-emerald-500/20 text-emerald-400 font-semibold rounded flex items-center justify-center border border-emerald-500/50"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
               transition={{ duration: 0.5 }}
             >
               Session Confirmed
             </motion.div>
          </div>
        </motion.div>
        
        {/* Center Connection Line */}
        <motion.div 
           className="absolute w-[20vw] h-[2px] bg-gradient-to-r from-white/0 via-emerald-500 to-white/0 z-0"
           initial={{ opacity: 0, scaleX: 0 }}
           animate={{ opacity: phase >= 2 ? 1 : 0, scaleX: phase >= 2 ? 1 : 0 }}
           transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}