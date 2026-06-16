import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
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
      className="absolute inset-0 flex flex-row-reverse items-center justify-center z-10 px-[10vw]"
      initial={{ opacity: 0, x: '-10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '10vw' }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="w-1/2 pl-[5vw] flex flex-col justify-center">
        <motion.div 
          className="h-[2px] w-[50px] bg-white mb-8"
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
          For the <span className="italic text-white/50">Studio</span>
        </motion.h2>
        
        <div className="space-y-4">
          <TextReveal phase={phase} index={1} text="Manage your calendar." />
          <TextReveal phase={phase} index={2} text="Send custom offers." />
          <TextReveal phase={phase} index={3} text="Track your revenue." />
          <TextReveal phase={phase} index={4} text="Focus on the art." />
        </div>
      </div>

      <div className="w-1/2 relative h-[80vh] flex items-center justify-center perspective-[1000px]">
        {/* Calendar Card */}
        <motion.div 
          className="absolute w-[28vw] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6"
          initial={{ opacity: 0, rotateY: -20, z: -200, y: 50 }}
          animate={{ 
            opacity: phase >= 1 ? (phase >= 3 ? 0.5 : 1) : 0,
            rotateY: phase >= 1 ? 0 : -20,
            z: phase >= 1 ? (phase >= 3 ? -100 : 0) : -200,
            y: phase >= 1 ? (phase >= 3 ? -50 : 0) : 50,
            x: phase >= 3 ? -50 : 0
          }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
          <h3 className="text-xl font-display font-semibold mb-6">October 2024</h3>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(28)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                  i === 12 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  i === 15 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  i === 20 ? 'bg-zinc-800 text-zinc-500' :
                  'bg-zinc-800/50 text-zinc-300'
                }`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: phase >= 1 ? 1 + i * 0.02 : 0 }}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pending</span>
          </div>
        </motion.div>

        {/* Revenue Dashboard */}
        <motion.div 
          className="absolute w-[24vw] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6"
          initial={{ opacity: 0, rotateY: 20, x: -100 }}
          animate={{ 
            opacity: phase >= 2 ? 1 : 0,
            rotateY: phase >= 2 ? 5 : 20,
            x: phase >= 2 ? 40 : -100,
            y: phase >= 2 ? 40 : 0,
            zIndex: phase >= 2 ? 10 : 0
          }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-zinc-400 text-sm font-medium">Monthly Revenue</h3>
            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">Oct 2024</span>
          </div>
          
          <div className="mb-8">
            <motion.div 
              className="text-[3vw] font-display font-semibold leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              €12,450
            </motion.div>
            <motion.div 
              className="text-emerald-500 text-sm mt-2 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 3 ? 1 : 0 }}
            >
              +14% from last month
            </motion.div>
          </div>

          <div className="h-32 flex items-end gap-2 border-b border-zinc-800 pb-2">
            {[40, 60, 45, 80, 50, 90, 75].map((h, i) => (
              <motion.div 
                key={i}
                className="w-full bg-white/10 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: phase >= 3 ? `${h}%` : 0 }}
                transition={{ duration: 1, delay: phase >= 3 ? 0.5 + i * 0.1 : 0 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Refund Notification */}
        <motion.div 
          className="absolute w-[20vw] bg-zinc-800/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ 
            opacity: phase >= 4 ? 1 : 0,
            y: phase >= 4 ? 120 : 50,
            scale: phase >= 4 ? 1 : 0.9,
            zIndex: phase >= 4 ? 30 : 0
          }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            🔔
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1 text-white">Action Required</h4>
            <p className="text-xs text-zinc-300">Client cancelled within free window. Deposit refund pending.</p>
            <button className="mt-3 text-xs bg-white text-black px-3 py-1.5 rounded font-medium">Process Refund</button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function TextReveal({ phase, index, text }: { phase: number, index: number, text: string }) {
  return (
    <motion.p
      className={`text-[1.2vw] ${phase >= index ? 'text-white' : 'text-zinc-600'} transition-colors duration-500`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: phase >= index - 1 ? 1 : 0, x: phase >= index - 1 ? 0 : 20 }}
      transition={{ duration: 0.5, delay: phase === index - 1 ? 0.2 : 0 }}
    >
      {text}
    </motion.p>
  );
}