import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingTourProps {
  onComplete: () => void;
  userName?: string;
}

const tourSteps = [
  {
    title: 'Welcome to Unsnag',
    body: "This is where you move through what's stuck — not fix it, not analyze it, just feel it. Takes about 5–8 minutes. No homework after.",
    tourTarget: null,
    mode: 'overlay' as const,
  },
  {
    title: 'Start here',
    body: "When something's looping in your head — a fight, a worry, something you can't shake — tap this button. You'll talk or type about what's going on, and we'll walk you through it.",
    tourTarget: 'cta-button',
    mode: 'elevate' as const,
  },
  {
    title: 'Your history',
    body: "Every session saves here. Over time you'll see the same triggers showing up differently — that's the pattern losing its grip.",
    tourTarget: 'nav-history',
    mode: 'spotlight' as const,
  },
  {
    title: 'Saved for later',
    body: "Something came up but the timing's wrong? Save it here. Come back when you have a few minutes.",
    tourTarget: 'nav-saved',
    mode: 'spotlight' as const,
  },
  {
    title: 'Settings',
    body: "Manage your account and subscription here.",
    tourTarget: 'nav-settings',
    mode: 'spotlight' as const,
  },
  {
    title: "That's it — you're ready to go.",
    body: "Next time something's stuck in your head, open Unsnag and tap the button. You'll know what to do.",
    tourTarget: null,
    mode: 'overlay' as const,
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

export function OnboardingTour({ onComplete, userName }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipBottom, setTooltipBottom] = useState<number | null>(null);
  const [arrowLeft, setArrowLeft] = useState<number | null>(null);
  const prevTargetRef = useRef<Element | null>(null);
  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  const title = step === 0 && userName
    ? `Welcome to Unsnag, ${userName}`
    : current.title;

  // Measure target and apply elevation or spotlight
  useEffect(() => {
    // Clean up previous elevated target
    if (prevTargetRef.current) {
      const prev = prevTargetRef.current as HTMLElement;
      prev.style.position = '';
      prev.style.zIndex = '';
      prev.style.pointerEvents = '';
      prevTargetRef.current = null;
    }

    if (!current.tourTarget) {
      setTargetRect(null);
      setTooltipBottom(null);
      setArrowLeft(null);
      return;
    }

    const el = document.querySelector(`[data-tour="${current.tourTarget}"]`);
    if (!el) return;

    const htmlEl = el as HTMLElement;

    if (current.mode === 'elevate') {
      // Elevate above overlay, but disable clicking
      htmlEl.style.position = 'relative';
      htmlEl.style.zIndex = '70';
      htmlEl.style.pointerEvents = 'none';
      prevTargetRef.current = el;
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const radius = parseFloat(style.borderRadius) || 12;

      setTooltipBottom(window.innerHeight - rect.top + 12);
      setArrowLeft(rect.left + rect.width / 2);

      if (current.mode === 'spotlight') {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: radius,
        });
      } else {
        setTargetRect(null);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
    };
  }, [current.tourTarget, current.mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevTargetRef.current) {
        const prev = prevTargetRef.current as HTMLElement;
        prev.style.position = '';
        prev.style.zIndex = '';
        prev.style.pointerEvents = '';
      }
    };
  }, []);

  const padding = 8;

  const renderBackdrop = () => {
    if (!targetRect) {
      return (
        <motion.div
          className="absolute inset-0 bg-warm-dark/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      );
    }

    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;
    const r = targetRect.borderRadius + padding;

    return (
      <motion.svg
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(45, 42, 38, 0.55)"
          mask="url(#spotlight-mask)"
        />
        <rect
          x={x} y={y} width={w} height={h} rx={r} ry={r}
          fill="none" stroke="#E2C6FD" strokeWidth={3}
        />
      </motion.svg>
    );
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!current.tourTarget || tooltipBottom === null) {
      return {
        top: '50%',
        left: '1rem',
        right: '1rem',
        transform: 'translateY(-50%)',
      };
    }
    return {
      bottom: tooltipBottom,
      left: '1rem',
      right: '1rem',
    };
  };

  const getArrowStyle = (): React.CSSProperties | null => {
    if (!current.tourTarget || arrowLeft === null) return null;
    return { left: Math.min(Math.max(arrowLeft - 16, 16), window.innerWidth - 48) };
  };

  const arrowStyle = getArrowStyle();

  return (
    <div className="fixed inset-0 z-[60]">
      {renderBackdrop()}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="absolute max-w-sm mx-auto"
          style={getTooltipStyle()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="relative bg-cream border-[3px] border-warm-dark rounded-2xl p-5 shadow-chunky">
            <h3 className="font-heading text-lg font-bold text-warm-dark mb-2">
              {title}
            </h3>
            <p className="font-body text-sm text-warm-dark-light leading-relaxed mb-4">
              {current.body}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === step ? 'bg-mauve-dark' : 'bg-warm-gray-light'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3 items-center">
                {step === 0 && (
                  <button
                    onClick={onComplete}
                    className="font-body text-xs text-warm-dark-light cursor-pointer hover:text-warm-dark transition-colors"
                  >
                    Skip
                  </button>
                )}
                <motion.button
                  onClick={() => {
                    if (isLast) {
                      onComplete();
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  className="
                    px-4 py-2 rounded-lg border-2 border-warm-dark bg-mauve
                    font-heading font-semibold text-sm text-warm-dark-light
                    shadow-chunky-sm cursor-pointer
                  "
                  whileTap={{ scale: 0.96, y: 1 }}
                >
                  {isLast ? "Got it!" : 'Next'}
                </motion.button>
              </div>
            </div>

            {arrowStyle && (
              <div
                className="absolute -bottom-3 w-4 h-4 rotate-45 bg-cream border-r-[3px] border-b-[3px] border-warm-dark"
                style={arrowStyle}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
