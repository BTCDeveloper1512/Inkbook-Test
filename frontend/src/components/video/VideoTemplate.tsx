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
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-body selection:bg-emerald-500 selection:text-white">
      {/* Background Layer (Persistent) */}
      <div className="absolute inset-0 z-0">
        <video
          src={`${import.meta.env.BASE_URL}videos/ink_swirl.mp4`}
          className="w-full h-full object-cover opacity-30 mix-blend-screen"
          autoPlay
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
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