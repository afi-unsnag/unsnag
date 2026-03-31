import { motion } from 'framer-motion';

interface LandingScreenProps {
  onStart: () => void;
  userName?: string;
  sessionCount?: number;
  quickLogCount?: number;
  onNavigateToHistory?: () => void;
  onNavigateToSaved?: () => void;
}

export function LandingScreen({
  onStart,
  userName,
  sessionCount = 0,
  quickLogCount = 0,
  onNavigateToHistory,
  onNavigateToSaved,
}: LandingScreenProps) {
  const greeting = userName ? `👋 Hey, ${userName}!` : '👋 Hey!';

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

      {/* Stat cards */}
      <motion.div
        className="w-full max-w-sm flex gap-3 -mt-2"
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
        }}
      >
        {/* Unsnags — taps to history */}
        <button
          onClick={onNavigateToHistory}
          className="flex-1 rounded-xl border-[3px] border-warm-dark bg-tomato/80 py-3 flex flex-col items-center gap-0.5 cursor-pointer hover:bg-tomato transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark"
        >
          <span className="font-heading text-2xl font-bold text-warm-dark leading-none">{sessionCount}</span>
          <span className="font-body text-xs text-warm-dark/70">unsnags</span>
        </button>

        {/* For later — taps to saved */}
        <button
          onClick={onNavigateToSaved}
          className="flex-1 rounded-xl border-[3px] border-warm-dark bg-orange-dark/80 py-3 flex flex-col items-center gap-0.5 cursor-pointer hover:bg-orange-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark"
        >
          <span className="font-heading text-2xl font-bold text-warm-dark leading-none">{quickLogCount}</span>
          <span className="font-body text-xs text-warm-dark/60">for later</span>
        </button>
      </motion.div>

      {/* Footnote */}
      <motion.p
        className="font-body text-sm text-warm-dark-light opacity-50 max-w-xs leading-relaxed"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 0.5, transition: { delay: 0.6, duration: 0.6 } },
        }}
      >
        Every time you use Unsnag, you're building a new default response.
      </motion.p>
    </motion.div>
  );
}
