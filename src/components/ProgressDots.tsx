import React from 'react';
import { motion } from 'framer-motion';
interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}
export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <nav
      aria-label="Progress"
      className="flex items-center justify-center gap-3">
      
      {Array.from({
        length: totalSteps
      }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;
        return (
          <motion.div
            key={index}
            className="relative flex items-center justify-center"
            animate={{
              scale: isCurrent ? 1 : 0.85
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25
            }}>
            
            {/* Pulse ring for current */}
            {isCurrent &&
            <motion.div
              className="absolute rounded-full border-2 border-mauve"
              initial={{
                width: 12,
                height: 12,
                opacity: 0.6
              }}
              animate={{
                width: [12, 24],
                height: [12, 24],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut'
              }} />

            }

            <motion.div
              className={`
                rounded-full border-2 border-warm-dark
                ${isCurrent ? 'w-3.5 h-3.5 bg-mauve' : ''}
                ${isCompleted ? 'w-3 h-3 bg-warm-dark' : ''}
                ${isUpcoming ? 'w-3 h-3 bg-transparent border-warm-gray-light' : ''}
              `}
              layout
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30
              }} />
            
          </motion.div>);

      })}
    </nav>);

}