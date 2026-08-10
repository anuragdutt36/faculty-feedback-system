import React, { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

interface AnimatedCounterProps {
  from?: number;
  to: number | string;
  duration?: number;
  className?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  from = 0, 
  to, 
  duration = 2.5,
  className = "",
  suffix = ""
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    let target = to;
    if (typeof target === 'string') {
      const parsed = parseInt(target.replace(/,/g, ''), 10);
      if (isNaN(parsed)) {
        if (ref.current) ref.current.textContent = target + suffix;
        return;
      }
      target = parsed;
    }

    if (isInView && ref.current) {
      const controls = animate(from, target as number, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = Math.round(value).toLocaleString() + suffix;
          }
        }
      });
      return () => controls.stop();
    }
  }, [isInView, from, to, duration, suffix]);

  return <span ref={ref} className={className}>{from}</span>;
};
