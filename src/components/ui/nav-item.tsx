import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/animation-utils';

interface NavItemProps {
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon: Icon, children, className }, ref) => {
    return (
      <NavLink
        ref={ref}
        to={to}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent/50 rounded-md',
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            className
          )
        }
      >
        <motion.div
          initial="initial"
          whileHover="hover"
          animate="visible"
          className="relative flex items-center gap-2 w-full"
        >
          {Icon && (
            <motion.div
              variants={{
                initial: { scale: 0.9, rotate: -5 },
                visible: { scale: 1, rotate: 0 },
                hover: { scale: 1.1, rotate: 5 }
              }}
              transition={transitions.spring}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          )}
          <motion.span
            variants={{
              hover: { x: 4 }
            }}
            transition={transitions.smooth}
          >
            {children}
          </motion.span>
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary/50"
            initial={{ scaleX: 0 }}
            variants={{
              hover: { scaleX: 1 }
            }}
            transition={transitions.smooth}
            style={{ originX: 0 }}
          />
        </motion.div>
      </NavLink>
    );
  }
); 