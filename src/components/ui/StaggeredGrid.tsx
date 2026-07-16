'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface StaggeredGridProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  gap?: number;
}

/**
 * StaggeredGrid - Automatic staggered animations for child elements
 */
export default function StaggeredGrid({
  children,
  className = '',
  minWidth = 280,
  gap = 24,
}: StaggeredGridProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className={`grid ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap }}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}