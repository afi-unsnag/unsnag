import React, { Children } from 'react';
import { motion } from 'framer-motion';
interface CompletionScreenProps {
  onRestart: () => void;
  onGoHome: () => void;
  unsnagCount: number;
}
export function CompletionScreen({
  onRestart,
  onGoHome,
  unsnagCount
}: CompletionScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center"
      initial="hidden"
      animate="visible"
      exit={{
        opacity: 0,
        scale: 0.95
      }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3
          }
        }
      }}>
      
      {/* Celebration burst */}
      <div className="relative mb-8">
        <CelebrationBurst />
        <motion.div
          className="relative z-10 w-24 h-24 rounded-full bg-mauve border-[3px] border-warm-dark shadow-chunky-lg flex items-center justify-center"
          initial={{
            scale: 0
          }}
          animate={{
            scale: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 12,
            delay: 0.1
          }}>
          
          <motion.span
            className="text-4xl"
            initial={{
              scale: 0,
              rotate: -30
            }}
            animate={{
              scale: 1,
              rotate: 0
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 12,
              delay: 0.4
            }}>
            
            ✌️
          </motion.span>
        </motion.div>
      </div>

      {/* Main message */}
      <motion.h2
        className="font-heading text-4xl sm:text-5xl font-bold text-warm-dark mb-3"
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
              damping: 20
            }
          }
        }}>
        
        Unsnagged.
      </motion.h2>

      <motion.p
        className="font-body text-base sm:text-lg text-warm-dark-light max-w-xs leading-relaxed mb-4"
        variants={{
          hidden: {
            opacity: 0,
            y: 12
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
        
        That's it. No homework. No spiraling. Go do your thing.
      </motion.p>

      {/* Saved confirmation */}
      <motion.p
        className="font-body text-xs text-mauve-dark font-medium mb-8"
        variants={{
          hidden: {
            opacity: 0
          },
          visible: {
            opacity: 1,
            transition: {
              delay: 0.6
            }
          }
        }}>
        
        ✓ saved to your history
      </motion.p>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={onRestart}
          className="
            px-8 py-4 rounded-xl border-[3px] border-warm-dark bg-mauve
            font-heading font-semibold text-lg text-warm-dark-light
            shadow-chunky cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          "





          variants={{
            hidden: {
              opacity: 0,
              y: 16
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
          
          Unsnag something else
        </motion.button>

        <motion.button
          onClick={onGoHome}
          className="font-body text-sm text-warm-dark-light underline underline-offset-2 decoration-warm-gray-light cursor-pointer hover:text-warm-dark transition-colors"
          variants={{
            hidden: {
              opacity: 0
            },
            visible: {
              opacity: 1,
              transition: {
                delay: 0.7
              }
            }
          }}>
          
          back to home
        </motion.button>
      </div>
    </motion.div>);

}
/* ---- Celebration particles ---- */
function CelebrationBurst() {
  const particles = [
  {
    x: -50,
    y: -40,
    rotate: -20,
    color: 'bg-mauve',
    size: 'w-3 h-3',
    shape: 'rounded-full',
    delay: 0.15
  },
  {
    x: 55,
    y: -35,
    rotate: 30,
    color: 'bg-blush',
    size: 'w-2.5 h-2.5',
    shape: 'rounded-sm',
    delay: 0.2
  },
  {
    x: -40,
    y: 45,
    rotate: 45,
    color: 'bg-orange',
    size: 'w-2 h-2',
    shape: 'rounded-full',
    delay: 0.25
  },
  {
    x: 50,
    y: 40,
    rotate: -15,
    color: 'bg-tomato',
    size: 'w-3.5 h-3.5',
    shape: 'rounded-sm',
    delay: 0.18
  },
  {
    x: -60,
    y: 5,
    rotate: 60,
    color: 'bg-sage-light',
    size: 'w-2 h-2',
    shape: 'rounded-full',
    delay: 0.3
  },
  {
    x: 65,
    y: 0,
    rotate: -40,
    color: 'bg-warm-gray',
    size: 'w-2.5 h-2.5',
    shape: 'rounded-sm',
    delay: 0.22
  },
  {
    x: 0,
    y: -55,
    rotate: 20,
    color: 'bg-mauve',
    size: 'w-2 h-2',
    shape: 'rounded-full',
    delay: 0.28
  },
  {
    x: -20,
    y: 55,
    rotate: -50,
    color: 'bg-blush',
    size: 'w-3 h-3',
    shape: 'rounded-sm',
    delay: 0.16
  }];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((p, i) =>
      <motion.div
        key={i}
        className={`absolute ${p.color} ${p.size} ${p.shape}`}
        initial={{
          x: 0,
          y: 0,
          scale: 0,
          opacity: 0,
          rotate: 0
        }}
        animate={{
          x: p.x,
          y: p.y,
          scale: [0, 1.2, 1],
          opacity: [0, 1, 0.8],
          rotate: p.rotate
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
          delay: p.delay
        }} />

      )}
    </div>);

}