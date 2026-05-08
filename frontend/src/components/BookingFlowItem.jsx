import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

export function BookingFlowItem({ children, label, className = "" }) {
  const itemRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animRef = useRef(null);
  const [reps, setReps] = useState(8);

  // Calculate how many label repetitions needed to fill viewport
  useEffect(() => {
    const calc = () => {
      const part = marqueeInnerRef.current?.querySelector('[data-part]');
      if (!part) return;
      const w = part.offsetWidth;
      if (!w) return;
      setReps(Math.max(8, Math.ceil(window.innerWidth / w) + 3));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [label]);

  // Seamless infinite scroll animation
  useEffect(() => {
    const t = setTimeout(() => {
      const part = marqueeInnerRef.current?.querySelector('[data-part]');
      if (!part) return;
      const w = part.offsetWidth;
      if (!w) return;
      animRef.current?.kill();
      animRef.current = gsap.to(marqueeInnerRef.current, {
        x: -w,
        duration: 14,
        ease: 'none',
        repeat: -1,
      });
    }, 60);
    return () => {
      clearTimeout(t);
      animRef.current?.kill();
    };
  }, [label, reps]);

  const closestEdge = (mx, my, w, h) =>
    ((mx - w / 2) ** 2 + my ** 2) < ((mx - w / 2) ** 2 + (my - h) ** 2) ? 'top' : 'bottom';

  const onEnter = (e) => {
    const r = itemRef.current?.getBoundingClientRect();
    if (!r) return;
    const dir = closestEdge(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    gsap.timeline({ defaults: { duration: 0.52, ease: 'expo.out' } })
      .set(marqueeRef.current, { y: dir === 'top' ? '-101%' : '101%' })
      .set(marqueeInnerRef.current, { y: dir === 'top' ? '101%' : '-101%' })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' });
  };

  const onLeave = (e) => {
    const r = itemRef.current?.getBoundingClientRect();
    if (!r) return;
    const dir = closestEdge(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    gsap.timeline({ defaults: { duration: 0.52, ease: 'expo.out' } })
      .to(marqueeRef.current, { y: dir === 'top' ? '-101%' : '101%' })
      .to(marqueeInnerRef.current, { y: dir === 'top' ? '101%' : '-101%' });
  };

  return (
    <div
      ref={itemRef}
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Card content – always above marquee */}
      <div className="relative z-10">{children}</div>

      {/* Flowing marquee overlay (zinc-900 brand colour) */}
      <div
        ref={marqueeRef}
        className="absolute inset-0 pointer-events-none"
        style={{ transform: 'translate3d(0, 101%, 0)', background: '#18181b' }}
      >
        <div className="overflow-hidden w-full h-full flex items-center">
          <div
            ref={marqueeInnerRef}
            className="flex items-center h-full"
            style={{ width: 'fit-content' }}
          >
            {Array.from({ length: reps }).map((_, i) => (
              <span
                key={i}
                data-part=""
                className="flex items-center gap-3 flex-shrink-0"
                style={{ padding: '0 2vw' }}
              >
                <span
                  className="font-playfair font-semibold text-white whitespace-nowrap uppercase tracking-widest"
                  style={{ fontSize: '11px' }}
                >
                  {label}
                </span>
                <span className="text-white/20" style={{ fontSize: '9px' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
