import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnimation } from 'framer-motion';
import { variants, transitions } from '@/lib/animation-utils';

type AnimationType = keyof typeof variants;

interface ScrollAnimationConfig {
  threshold?: number;
  triggerOnce?: boolean;
  animation?: AnimationType;
  delay?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

export const useScrollAnimation = (config: ScrollAnimationConfig = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    animation = 'fadeIn',
    delay = 0,
    stagger = false,
    staggerDelay = 0.1
  } = config;

  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold,
    triggerOnce
  });

  useEffect(() => {
    if (inView) {
      controls.start(variants[animation].animate);
    } else {
      controls.start(variants[animation].initial);
    }
  }, [controls, inView, animation]);

  const getAnimationProps = (index?: number) => ({
    ref,
    initial: variants[animation].initial,
    animate: controls,
    transition: {
      delay: stagger ? delay + (index || 0) * staggerDelay : delay,
      ...transitions.smooth
    }
  });

  return { ref, inView, controls, getAnimationProps };
}; 