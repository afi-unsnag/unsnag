import { motion } from 'framer-motion';

interface LandingScreenProps {
  onStart: () => void;
  userName?: string;
}

export function LandingScreen({
  onStart,
  userName,
}: LandingScreenProps) {
  const greeting = userName ? `\u{1F44B} Hey, ${userName}!` : '\u{1F44B} Hey!';

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center gap-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } },
      }}
    >
      {/* Logo */}
      <motion.h1
        className="font-heading text-6xl sm:text-7xl font-bold text-warm-dark tracking-tight"
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
        }}
      >
        unsnag
      </motion.h1>

      {/* Accent line */}
      <motion.div
        className="w-12 h-1 bg-mauve rounded-full -mt-4"
        variants={{
          hidden: { opacity: 0, scaleX: 0 },
          visible: { opacity: 1, scaleX: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
        }}
      />

      {/* Greeting + question */}
      <motion.div
        className="flex flex-col items-center gap-1"
        variants={{
          hidden: { opacity: 0, y: 15 },
          visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } },
        }}
      >
        <p className="font-body text-lg sm:text-xl text-warm-dark-light">{greeting}</p>
        <p className="font-body text-lg sm:text-xl text-warm-dark-light">Feeling stuck?</p>
      </motion.div>

      {/* CTA */}
      <motion.button
        onClick={onStart}
        data-tour="cta-button"
        className="
          w-full max-w-sm py-5 rounded-xl
          border-[3px] border-warm-dark bg-mauve
          font-heading font-semibold text-xl text-warm-dark-light
          shadow-chunky-lg cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        "
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 18 } },
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97, y: 3, boxShadow: '1px 1px 0px 0px #2D2A26' }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      >
        Let's move through it
      </motion.button>

      {/* Footnote */}
      <motion.p
        className="font-body text-sm text-warm-dark-light opacity-50 max-w-xs leading-relaxed"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 0.5, transition: { delay: 0.6, duration: 0.6 } },
        }}
      >
        Every time you use Unsnag, you trust yourself a little more — and need everyone else's approval a little less.
      </motion.p>
    </motion.div>
  );
}
