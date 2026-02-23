import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ target, duration = 2, suffix = "" }) {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, threshold: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      let startTime = null;
      const startValue = 0;
      const endValue = target;

      const updateCounter = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(updateCounter);
      
      // Animate the container
      controls.start({
        scale: [1, 1.15, 1],
        transition: { duration: 0.4, ease: "easeOut" }
      });
    }
  }, [isInView, target, duration, controls]);

  return (
    <motion.div
      ref={counterRef}
      animate={controls}
      className="stat-number"
    >
      {count}{suffix}
    </motion.div>
  );
}