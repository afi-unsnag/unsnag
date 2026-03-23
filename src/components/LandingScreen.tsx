import React, { Children } from 'react';
import { motion } from 'framer-motion';
interface LandingScreenProps {
  onStart: () => void;
}
export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
          }
        }
      }}>
      
      {/* Logo / Title */}
      <motion.h1
        className="font-heading text-6xl sm:text-7xl font-bold text-warm-dark tracking-tight mb-4"
        variants={{
          hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95
          },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 20
            }
          }
        }}>
        
        unsnag
      </motion.h1>

      {/* Accent line */}
      <motion.div
        className="w-12 h-1 bg-mauve rounded-full mb-8"
        variants={{
          hidden: {
            opacity: 0,
            scaleX: 0
          },
          visible: {
            opacity: 1,
            scaleX: 1,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25
            }
          }
        }} />
      

      {/* Subline */}
      <motion.p
        className="font-body text-lg sm:text-xl text-warm-dark-light max-w-sm leading-relaxed mb-12"
        variants={{
          hidden: {
            opacity: 0,
            y: 15
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 22
            }
          }
        }}>
        
        Move through what you're feeling.
        <br />
        Do what you already know you need to do.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        onClick={onStart}
        className="
          relative px-8 py-4 rounded-xl
          border-[3px] border-warm-dark bg-mauve
          font-heading font-semibold text-lg text-warm-dark
          shadow-chunky-lg cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        "






        variants={{
          hidden: {
            opacity: 0,
            y: 20
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 18
            }
          }
        }}
        whileHover={{
          scale: 1.03
        }}
        whileTap={{
          scale: 0.97,
          y: 3,
          boxShadow: '1px 1px 0px 0px #2D2A26'
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 15
        }}>
        
        I'm stuck on something
      </motion.button>

      {/* Disclaimer */}
      <motion.p
        className="font-body text-xs text-warm-gray mt-16 max-w-xs leading-relaxed"
        variants={{
          hidden: {
            opacity: 0
          },
          visible: {
            opacity: 1,
            transition: {
              delay: 0.8,
              duration: 0.6
            }
          }
        }}>
        
        Not therapy. Not journaling. Just… unsticking.
      </motion.p>
    </motion.div>);

}