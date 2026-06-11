import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

type Props = {
  /** Final value the counter should land on. */
  to: number;
  /** Animation length in ms (default 1800). */
  duration?: number;
  /** Optional prefix (e.g. "+"). */
  prefix?: string;
  /** Optional suffix (e.g. "€" or "k"). */
  suffix?: string;
  /** Force a fixed character width so the layout doesn't reflow as digits grow. */
  monospaceDigits?: boolean;
};

/**
 * Counts up from 0 to `to` once when it enters the viewport.
 * Respects `prefers-reduced-motion` by jumping straight to the final value.
 */
export default function AnimatedCounter({
  to,
  duration = 1800,
  prefix,
  suffix,
  monospaceDigits = false
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(reducedMotion ? to : 0);

  useEffect(() => {
    if (!inView || reducedMotion) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reducedMotion]);

  return (
    <span
      ref={ref}
      style={monospaceDigits ? { fontVariantNumeric: 'tabular-nums' } : undefined}
    >
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
