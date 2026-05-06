import React, { useRef, useMemo } from 'react';
import './GradualBlur.css';

const CURVE_FUNCTIONS = {
  linear: p => p,
  bezier: p => p * p * (3 - 2 * p),
  'ease-in': p => p * p,
  'ease-out': p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const getGradientDirection = position =>
  ({ top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' })[position] || 'to bottom';

export default function GradualBlur({
  position = 'bottom',
  strength = 2,
  height = '6rem',
  divCount = 6,
  exponential = false,
  zIndex = 10,
  opacity = 1,
  curve = 'ease-out',
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);

  const blurDivs = useMemo(() => {
    const divs = [];
    const increment = 100 / divCount;
    const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear;
    const direction = getGradientDirection(position);

    for (let i = 1; i <= divCount; i++) {
      const progress = curveFunc(i / divCount);
      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const divStyle = {
        position: 'absolute',
        inset: '0',
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity,
      };

      divs.push(<div key={i} style={divStyle} />);
    }
    return divs;
  }, [position, strength, divCount, exponential, curve, opacity]);

  const isHorizontal = position === 'left' || position === 'right';

  const containerStyle = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex,
    ...(isHorizontal
      ? { width: height, height: '100%', [position]: 0, top: 0, bottom: 0 }
      : { height, width: '100%', [position]: 0, left: 0, right: 0 }),
    ...style,
  };

  return (
    <div ref={containerRef} className={`gradual-blur ${className}`} style={containerStyle}>
      <div className="gradual-blur-inner">{blurDivs}</div>
    </div>
  );
}
