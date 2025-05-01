import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSpring, useMotionValue, useTransform, MotionValue, animate } from 'framer-motion';

interface AnimationConfig {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  duration?: number;
}

export const useAnimateOnScroll = (config: AnimationConfig = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    duration = 0.3
  } = config;

  const [ref, inView] = useInView({
    threshold,
    triggerOnce
  });

  const animation = {
    initial: { opacity: 0, y: 20 },
    animate: inView 
      ? { opacity: 1, y: 0, transition: { delay, duration } }
      : { opacity: 0, y: 20 }
  };

  return { ref, inView, animation };
};

export const useAnimateNumber = (
  end: number,
  duration: number = 1,
  delay: number = 0
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, Math.round);
  const springConfig = { duration: duration * 1000, delay: delay * 1000 };

  useEffect(() => {
    setIsAnimating(true);
    
    const animation = animate(motionValue, end, {
      ...springConfig,
      onComplete: () => setIsAnimating(false)
    });
    
    return () => {
      animation.stop();
      setIsAnimating(false);
    };
  }, [end, motionValue, springConfig]);

  return { value: rounded, isAnimating };
};

export const useAnimateList = (
  items: any[],
  baseDelay: number = 0,
  stagger: number = 0.1
) => {
  return items.map((item, index) => ({
    ...item,
    animation: {
      initial: { opacity: 0, x: -20 },
      animate: { 
        opacity: 1, 
        x: 0,
        transition: { delay: baseDelay + index * stagger }
      },
      exit: { 
        opacity: 0, 
        x: 20,
        transition: { delay: index * stagger * 0.5 }
      }
    }
  }));
};

export const useAnimatePresence = (
  isVisible: boolean,
  animation: 'fade' | 'slide' | 'scale' | 'rotate' = 'fade',
  config: AnimationConfig = {}
) => {
  const { delay = 0, duration = 0.3 } = config;

  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 }
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 }
    },
    rotate: {
      initial: { rotate: -5, scale: 0.95, opacity: 0 },
      animate: { rotate: 0, scale: 1, opacity: 1 },
      exit: { rotate: 5, scale: 0.95, opacity: 0 }
    }
  };

  return {
    ...animations[animation],
    transition: { delay, duration }
  };
};

export const useParallax = (
  scrollY: MotionValue<number>,
  range: [number, number] = [0, 1],
  output: [number, number] = [-10, 10]
) => {
  return useTransform(scrollY, range, output);
}; 