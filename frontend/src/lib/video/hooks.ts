import { useState, useEffect, useRef } from 'react';

type SceneDurations = Record<string, number>;

export function useVideoPlayer({ durations }: { durations: SceneDurations }) {
  const keys = Object.keys(durations);
  const [sceneIndex, setSceneIndex] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      (window as any).startRecording?.();
    }

    const duration = durations[keys[sceneIndex]];
    const timer = setTimeout(() => {
      const next = sceneIndex + 1;
      if (next >= keys.length) {
        (window as any).stopRecording?.();
        setSceneIndex(0);
      } else {
        setSceneIndex(next);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [sceneIndex]);

  return { currentScene: sceneIndex };
}
