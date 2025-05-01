import { MotionProps, Variants, Transition, Target } from 'framer-motion';

// Animation variants
export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  slideRight: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  },
  rotate: {
    initial: { rotate: -5, scale: 0.95, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: 5, scale: 0.95, opacity: 0 }
  }
} satisfies Record<string, Variants>;

// Special animation variants that don't follow the standard pattern
export const specialVariants = {
  success: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    }
  },
  error: {
    initial: { scale: 1 },
    animate: {
      x: [-10, 10, -10, 10, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  }
} satisfies Record<string, Variants>;

// Stagger container
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Transition presets
export const transitions = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30
  },
  smooth: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  }
} satisfies Record<string, Transition>;

// Hover effects
export const hover = {
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  },
  lift: {
    whileHover: { y: -4 },
    whileTap: { y: 0 }
  },
  glow: {
    whileHover: { 
      boxShadow: '0 0 8px rgba(var(--primary-rgb), 0.5)'
    }
  }
} satisfies Record<string, { whileHover?: Target; whileTap?: Target }>;

// List item animation generator
export const getListItemAnimation = (index: number): MotionProps => ({
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { delay: index * 0.1 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { delay: index * 0.05 }
  }
});

// Page transition
export const pageTransition: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: transitions.smooth
};

// Loading animations
export const loading = {
  spinner: {
    animate: { 
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
} as const; 