import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { variants, transitions, hover, loading, staggerContainer } from '@/lib/animation-utils';

type AnimationType = keyof typeof variants;
type HoverType = keyof typeof hover | 'none';

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  onClick?: () => void;
  whileHover?: HoverType;
  whileTap?: 'scale' | 'none';
  isLoading?: boolean;
  staggerChildren?: boolean;
}

const getHoverEffect = (type: HoverType) => {
  if (type === 'none') return {};
  return hover[type]?.whileHover || {};
};

const getTapEffect = (type: 'scale' | 'none') => {
  if (type === 'none') return {};
  return hover.scale.whileTap;
};

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.3,
  className,
  onClick,
  whileHover = 'none',
  whileTap = 'scale',
  isLoading = false,
  staggerChildren = false,
  ...props
}) => {
  const animationVariant = variants[animation];
  const hoverEffect = getHoverEffect(whileHover);
  const tapEffect = getTapEffect(whileTap);

  return (
    <AnimatePresence>
      <motion.div
        {...animationVariant}
        transition={{ 
          duration, 
          delay,
          ...(animation === 'success' || animation === 'error' 
            ? transitions.spring 
            : transitions.smooth)
        }}
        className={cn('relative', className)}
        onClick={onClick}
        whileHover={hoverEffect}
        whileTap={tapEffect}
        {...(staggerChildren && staggerContainer)}
        {...(isLoading && loading.pulse)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedContainer; 