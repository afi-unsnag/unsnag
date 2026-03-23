import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { ProgressDots } from './ProgressDots';
import { EmotionChips } from './EmotionChips';
import { SensationChips } from './SensationChips';
import { AiInsight } from './AiInsight';
/*
  Step indices (internal):
  0 = Intake ("What's going on?")
  1 = Understand (U)
  2 = Name (N) — emotions get a name
  3 = Sensation (S)
  4 = Notice (N)
  5 = Ask (A)
  6 = AI Insight
  7 = Go (G)
*/
/** Maps internal step index to progress dot index (-1 = no dot shown) */
function getProgressIndex(step: number): number {
  switch (step) {
    case 0:
      return -1;
    // intake — no progress
    case 1:
      return 0;
    // understand
    case 2:
      return 1;
    // name
    case 3:
      return 2;
    // sensation
    case 4:
      return 3;
    // notice
    case 5:
      return 4;
    // ask
    case 6:
      return 4;
    // insight shares ask dot
    case 7:
      return 5;
    // go
    default:
      return -1;
  }
}
const TOTAL_PROGRESS_DOTS = 6;
interface LoopStepProps {
  stepIndex: number;
  onNext: () => void;
  onGoHome: () => void;
  emotions: string[];
  onToggleEmotion: (e: string) => void;
  sensations: string[];
  onToggleSensation: (s: string) => void;
  onSaveTranscript: (step: 'intake' | 'ask' | 'go', text: string) => void;
  transcripts: { intake?: string; ask?: string; go?: string };
  onSaveUnderstandResponse: (text: string) => void;
  onSaveInsight: (insight: { whatsYours: string[]; whatsNotYours: string[]; affirmation: string }) => void;
  onComplete: (goTranscript: string) => void;
  initialIntakeTranscript?: string;
}
export function LoopStep({
  stepIndex,
  onNext,
  onGoHome,
  emotions,
  onToggleEmotion,
  sensations,
  onToggleSensation,
  onSaveTranscript,
  transcripts,
  onSaveUnderstandResponse,
  onSaveInsight,
  onComplete,
  initialIntakeTranscript,
}: LoopStepProps) {
  const progressIndex = getProgressIndex(stepIndex);
  return (
    <motion.div
      className="flex flex-col min-h-screen px-5 pt-4 pb-8"
      initial={{
        opacity: 0,
        x: 50
      }}
      animate={{
        opacity: 1,
        x: 0
      }}
      exit={{
        opacity: 0,
        x: -50
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28
      }}>
      
      {/* Top bar: home button + progress */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={onGoHome}
          className="
            w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark
            flex items-center justify-center cursor-pointer
            hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          "





          whileTap={{
            scale: 0.92,
            y: 1
          }}
          aria-label="Go home">
          
          <HomeIcon className="w-4 h-4 text-warm-gray" strokeWidth={2.5} />
        </motion.button>

        {progressIndex >= 0 ?
        <ProgressDots
          currentStep={progressIndex}
          totalSteps={TOTAL_PROGRESS_DOTS} /> :


        <div />
        }

        {/* Spacer to balance the home button */}
        <div className="w-9" />
      </div>

      {/* Step content — anchored to top, not centered */}
      <div className="flex flex-col items-center max-w-md w-full mx-auto pt-8">
        {stepIndex === 0 &&
        <IntakeStep
          initialTranscript={initialIntakeTranscript}
          onNext={(t) => {
            onSaveTranscript('intake', t);
            onNext();
          }} />

        }
        {stepIndex === 1 && <UnderstandStep onNext={onNext} transcript={transcripts.intake} onSaveResponse={onSaveUnderstandResponse} />}
        {stepIndex === 2 &&
        <NameStep
          emotions={emotions}
          onToggle={onToggleEmotion}
          onNext={onNext} />

        }
        {stepIndex === 3 &&
        <SensationStep
          sensations={sensations}
          onToggle={onToggleSensation}
          onNext={onNext} />

        }
        {stepIndex === 4 && <NoticeStep onNext={onNext} />}
        {stepIndex === 5 &&
        <AskStep
          onNext={(t) => {
            onSaveTranscript('ask', t);
            onNext();
          }} />

        }
        {stepIndex === 6 && (
          <AiInsight
            onContinue={onNext}
            intakeTranscript={transcripts.intake}
            askTranscript={transcripts.ask}
            emotions={emotions}
            sensations={sensations}
            onSaveInsight={onSaveInsight}
          />
        )}
        {stepIndex === 7 &&
        <GoStep
          onNext={(t) => onComplete(t)} />

        }
      </div>
    </motion.div>);

}
/* ============================================================
   STEP 0 — INTAKE
   ============================================================ */
function IntakeStep({
  onNext,
  initialTranscript
}: {
  onNext: (transcript: string) => void;
  initialTranscript?: string;
}) {
  return (
    <StepShell
      prompt="Okay, what's going on?"
      subtext="No filter. Just dump it.">
      
      <VoiceButton onComplete={onNext} initialText={initialTranscript} />
    </StepShell>);

}
/* ============================================================
   STEP 1 — UNDERSTAND
   ============================================================ */
const UNDERSTAND_SYSTEM_PROMPT = `You are the voice of Unsnag. Someone just vented. Give them 2 sentences — that's it.

Sentence 1: Name WHY this is hard, grounded in something real about human psychology or how people are wired — not that it's hard, but the actual reason. Make it feel like you see them specifically.
Sentence 2: One short line that moves them forward without telling them what to do or how to feel. Something like "Let's just feel what's actually here."

Rules:
- 2 sentences. Hard limit.
- No judgment on their choices or actions — no "you did the right thing", no "that was brave", nothing that evaluates what they did.
- No therapy-speak. No "I hear you", no "that makes sense", no "it's valid".
- Specific to what they said. Not generic.
- Warm but direct. No coddling.

Return plain text only.`;

function UnderstandStep({ onNext, transcript, onSaveResponse }: {onNext: () => void; transcript?: string; onSaveResponse?: (text: string) => void;}) {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          system: UNDERSTAND_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: transcript
                ? `Here's what they shared: "${transcript}"`
                : 'They didn\'t share details — give a grounded, general validation.',
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json() as { content: Array<{ type: string; text?: string }> };
      if (cancelled) return;

      const text = data.content.find((b) => b.type === 'text')?.text?.trim() ?? '';
      if (!cancelled) {
        setResponse(text);
        onSaveResponse?.(text);
      }
    })().catch((err: unknown) => {
      if (cancelled) return;
      console.error('[UnderstandStep]', err);
      setError(true);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StepShell label="understand" prompt="Makes sense that you feel this way.">
      {/* Loading dots */}
      {!response && !error &&
      <motion.div
        className="flex gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-mauve"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
      }

      {/* API response */}
      {response &&
      <motion.p
        className="font-body text-sm text-warm-dark-light text-center leading-relaxed mb-8 max-w-xs"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}>
        {response}
      </motion.p>
      }

      {/* Fallback if API fails */}
      {error &&
      <motion.p
        className="font-body text-sm text-warm-dark-light text-center leading-relaxed mb-8 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        That urge to fix it, the guilt, the loop — that's your old learned behavior. We're not doing that right now.
      </motion.p>
      }

      {(response || error) && <ContinueButton onClick={onNext} delay={0.1} />}
    </StepShell>);
}
/* ============================================================
   STEP 2 — NAME (give the emotions a name)
   ============================================================ */
function NameStep({
  emotions,
  onToggle,
  onNext




}: {emotions: string[];onToggle: (e: string) => void;onNext: () => void;}) {
  return (
    <StepShell
      label="name"
      prompt="Can you name what you're feeling?"
      subtext="Tap anything that fits. No wrong answers.">
      
      <EmotionChips selected={emotions} onToggle={onToggle} />
      <ContinueButton onClick={onNext} delay={0.5} />
    </StepShell>);

}
/* ============================================================
   STEP 3 — SENSATION
   ============================================================ */
function SensationStep({
  sensations,
  onToggle,
  onNext




}: {sensations: string[];onToggle: (s: string) => void;onNext: () => void;}) {
  return (
    <StepShell
      label="sensation"
      prompt="Where are you feeling this?"
      subtext="Not in your head. In your body.">
      
      <SensationChips selected={sensations} onToggle={onToggle} />
      <ContinueButton onClick={onNext} delay={0.5} />
    </StepShell>);

}
/* ============================================================
   STEP 4 — NOTICE — 90 second timer (user-initiated)
   ============================================================ */
function NoticeStep({ onNext }: {onNext: () => void;}) {
  const TOTAL_SECONDS = 90;
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [finished, setFinished] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  useEffect(() => {
    if (!started || finished) return;
    if (seconds <= 0) {
      setFinished(true);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, seconds, finished]);
  // Show skip after 30 seconds of running
  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => setCanSkip(true), 30000);
    return () => clearTimeout(timer);
  }, [started]);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const progress = started ? 1 - seconds / TOTAL_SECONDS : 0;
  return (
    <StepShell
      label="notice"
      prompt="Now just… let it be there."
      subtext="Don't fix it. Don't push it away. Just let it move through you.">
      
      {/* Breathing circle with timer */}
      <div
        className="relative flex items-center justify-center my-4"
        style={{
          width: 160,
          height: 160
        }}>
        
        {/* Progress ring */}
        <svg
          className="absolute w-full h-full -rotate-90"
          viewBox="0 0 160 160">
          
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="#E8E3DB"
            strokeWidth="4" />
          
          <motion.circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="#C9A4E8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 68}
            style={{ strokeDashoffset: 2 * Math.PI * 68 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 68 * (1 - progress)
            }}
            transition={{
              duration: 0.5,
              ease: 'easeOut'
            }} />
          
        </svg>

        {/* Outer pulse */}
        <motion.div
          className="absolute rounded-full bg-mauve/15"
          animate={{
            width: [80, 105, 80],
            height: [80, 105, 80]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut'
          }} />
        
        {/* Inner circle */}
        <motion.div
          className="absolute rounded-full bg-mauve/30 border-2 border-mauve/50"
          animate={{
            width: [55, 72, 55],
            height: [55, 72, 55]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut'
          }} />
        

        {/* Timer display — static, no blinking */}
        {started && !finished &&
        <span className="relative z-10 font-heading text-2xl font-bold text-warm-dark tabular-nums">
            {timeStr}
          </span>
        }

        {!started &&
        <span className="relative z-10 font-heading text-2xl font-bold text-warm-gray tabular-nums">
            1:30
          </span>
        }

        {finished &&
        <motion.span
          className="relative z-10 font-heading text-lg font-bold text-mauve-dark"
          initial={{
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15
          }}>
          
            okay
          </motion.span>
        }
      </div>

      {/* Start button — before timer begins */}
      {!started &&
      <motion.button
        onClick={() => setStarted(true)}
        className="
            mt-4 px-7 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve
            font-heading font-semibold text-base text-warm-dark
            shadow-chunky cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          "





        initial={{
          opacity: 0,
          y: 12
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 18,
          delay: 0.3
        }}
        whileHover={{
          scale: 1.03
        }}
        whileTap={{
          scale: 0.97,
          y: 2,
          boxShadow: '1px 1px 0px 0px #2D2A26'
        }}>
        
          I'm ready — start
        </motion.button>
      }

      {/* Ready button after timer completes */}
      <AnimatePresence>
        {finished &&
        <motion.button
          onClick={onNext}
          className="
              mt-4 px-7 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve
              font-heading font-semibold text-base text-warm-dark
              shadow-chunky cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
            "





          initial={{
            opacity: 0,
            y: 12,
            scale: 0.9
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 18
          }}
          whileHover={{
            scale: 1.03
          }}
          whileTap={{
            scale: 0.97,
            y: 2,
            boxShadow: '1px 1px 0px 0px #2D2A26'
          }}>
          
            I'm ready
          </motion.button>
        }
      </AnimatePresence>

      {/* Skip option after 30s */}
      <AnimatePresence>
        {canSkip && !finished &&
        <motion.button
          onClick={onNext}
          className="mt-6 font-body text-xs text-warm-gray underline underline-offset-2 decoration-warm-gray-light cursor-pointer hover:text-warm-dark transition-colors"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.4
          }}>
          
            I'm ready
          </motion.button>
        }
      </AnimatePresence>
    </StepShell>);

}
/* ============================================================
   STEP 5 — ASK
   ============================================================ */
function AskStep({ onNext }: {onNext: (transcript: string) => void;}) {
  return (
    <StepShell
      label="ask"
      prompt="What does that voice want to say?"
      subtext="Let it come out raw. Unfiltered. Whatever it is.">
      
      <motion.p
        className="font-body text-xs text-warm-gray italic text-center mb-6 max-w-xs"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          delay: 0.4
        }}>
        
        "I don't know… you're doing it again… they're gonna leave…"
      </motion.p>
      <VoiceButton onComplete={onNext} />
    </StepShell>);

}
/* ============================================================
   STEP 7 — GO
   ============================================================ */
function GoStep({ onNext }: {onNext: (transcript: string) => void;}) {
  return (
    <StepShell
      label="go"
      prompt="Where do you go from here?"
      subtext="What would you normally do? And now — what's one small different thing?">
      
      <VoiceButton onComplete={onNext} />
    </StepShell>);

}
/* ============================================================
   SHARED COMPONENTS
   ============================================================ */
function StepShell({
  label,
  prompt,
  subtext,
  children





}: {label?: string;prompt: string;subtext?: string;children: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center w-full">
      {label &&
      <motion.span
        className="font-body text-xs uppercase tracking-widest text-warm-gray font-semibold mb-4"
        initial={{
          opacity: 0,
          y: 8
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.05
        }}>
        
          {label}
        </motion.span>
      }

      <motion.h2
        className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center leading-snug mb-2"
        initial={{
          opacity: 0,
          y: 12
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.1,
          type: 'spring',
          stiffness: 300,
          damping: 22
        }}>
        
        {prompt}
      </motion.h2>

      {subtext &&
      <motion.p
        className="font-body text-sm text-warm-gray text-center mb-8"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          delay: 0.2
        }}>
        
          {subtext}
        </motion.p>
      }

      <motion.div
        className="w-full flex flex-col items-center mt-2"
        initial={{
          opacity: 0,
          y: 14
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.2,
          type: 'spring',
          stiffness: 300,
          damping: 22
        }}>
        
        {children}
      </motion.div>
    </div>);

}
function ContinueButton({
  onClick,
  delay = 0.3



}: {onClick: () => void;delay?: number;}) {
  return (
    <motion.button
      onClick={onClick}
      className="
        mt-8 px-7 py-3 rounded-xl border-2 border-warm-gray-light bg-cream-dark
        font-heading font-semibold text-sm text-warm-dark
        cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150
      "






      initial={{
        opacity: 0,
        y: 8
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 22
      }}
      whileTap={{
        scale: 0.97,
        y: 2
      }}>
      
      continue
    </motion.button>);

}