import { motion } from 'framer-motion';

export function Scene5() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1], delay: 0.5 }}
        className="text-center"
      >
        <h1 className="text-[8vw] font-display italic font-semibold tracking-tight text-white leading-none">
          StudioOS
        </h1>
        <motion.p 
          className="mt-6 text-[1.2vw] uppercase tracking-[0.4em] text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          Ink meets Silicon Valley
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-[10vh] w-[1px] h-[10vh] bg-gradient-to-b from-emerald-500 to-transparent"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, delay: 2 }}
        style={{ transformOrigin: "top" }}
      />
    </motion.div>
  );
}