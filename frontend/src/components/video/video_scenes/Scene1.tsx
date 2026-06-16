import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="relative">
        <motion.h1 
          className="text-[12vw] font-display italic font-semibold tracking-tight text-white/90 leading-none mix-blend-screen"
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 50, filter: phase >= 1 ? 'blur(0px)' : 'blur(10px)' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          StudioOS
        </motion.h1>
        <motion.div 
          className="absolute -right-[4vw] top-0 w-[4vw] h-[4vw] rounded-full border border-white/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: phase >= 2 ? 1 : 0, opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 1, type: "spring" }}
        />
      </div>
      
      <motion.p
        className="mt-6 text-[1.5vw] uppercase tracking-[0.3em] text-white/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      >
        The Premium Tattoo Platform
      </motion.p>
    </motion.div>
  );
}