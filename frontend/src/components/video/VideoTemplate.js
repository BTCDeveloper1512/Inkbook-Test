import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  open: 5000,
  customer: 14000,
  studio: 14000,
  handshake: 8000,
  close: 6000
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', top: '10%', left: '-20%' }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[40vw] h-[40vw] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', bottom: '0%', right: '-10%' }}
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene1 key="open" />}
        {currentScene === 1 && <Scene2 key="customer" />}
        {currentScene === 2 && <Scene3 key="studio" />}
        {currentScene === 3 && <Scene4 key="handshake" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </div>
  );
}
