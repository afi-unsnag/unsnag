import React, { useEffect, useRef, useState } from 'react';
import { createNoticeAudio, type NoticeAudioHandle } from '../audio/noticeStepAudio';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { aiMessage } from '../lib/ai';
import { ProgressDots } from './ProgressDots';
import { EmotionChips } from './EmotionChips';
import { SensationChips } from './SensationChips';
import { AiInsight } from './AiInsight';
/*
  Step indices (internal):
  0 = Intake ("What's going on?")
  1 = Unload (U)
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
    case 0: return -1; // intake — no progress
    case 1: return 0;  // unload
    case 2: return 1;  // name
    case 3: return 2;  // sensation
    case 4: return 3;  // notice
    case 5: return 4;  // ask
    case 6: return 4;  // insight shares ask dot
    case 7: return 5;  // go
    default: return -1;
  }
}
const TOTAL_PROGRESS_DOTS = 6;
interface LoopStepProps {
  stepIndex: number;
  onNext: () => void;
  onGoHome: () => void;
  onBack: () => void;
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
  onBack,
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
  const [showDiscard, setShowDiscard] = useState(false);
  return (
    <motion.div
      className="flex flex-col min-h-screen px-5 pt-4 pb-8"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

      {/* Discard confirmation */}
      <AnimatePresence>
        {showDiscard && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-warm-dark/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscard(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto bg-cream border-[3px] border-warm-dark rounded-2xl p-6 shadow-chunky"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <h3 className="font-heading text-lg font-bold text-warm-dark mb-2">Are you sure?</h3>
              <p className="font-body text-sm text-warm-dark-light mb-5">This will discard your current session.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDiscard(false)}
                  className="px-4 py-2 rounded-lg border-2 border-warm-gray-light font-heading font-semibold text-sm text-warm-dark-light cursor-pointer hover:border-warm-dark transition-colors"
                >
                  Keep going
                </button>
                <motion.button
                  onClick={onGoHome}
                  className="px-4 py-2 rounded-lg border-2 border-warm-dark bg-tomato font-heading font-semibold text-sm text-cream cursor-pointer shadow-chunky-sm"
                  whileTap={{ scale: 0.96, y: 1 }}
                >
                  Discard
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top bar: back button + progress + close button */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={stepIndex === 0 ? onGoHome : onBack}
          className="
            w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark
            flex items-center justify-center cursor-pointer
            hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          "
          whileTap={{ scale: 0.92, y: 1 }}
          aria-label={stepIndex === 0 ? 'Go home' : 'Go back'}>
          <ArrowLeftIcon className="w-4 h-4 text-warm-dark-light" strokeWidth={2.5} />
        </motion.button>

        {progressIndex >= 0
          ? <ProgressDots currentStep={progressIndex} totalSteps={TOTAL_PROGRESS_DOTS} />
          : <div />
        }

        <motion.button
          onClick={() => setShowDiscard(true)}
          className="
            w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark
            flex items-center justify-center cursor-pointer
            hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
          "
          whileTap={{ scale: 0.92, y: 1 }}
          aria-label="Close session">
          <XIcon className="w-4 h-4 text-warm-dark-light" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Step content */}
      <div className="flex flex-col items-center max-w-md w-full mx-auto pt-8">
        {stepIndex === 0 &&
          <IntakeStep
            initialTranscript={initialIntakeTranscript}
            onNext={(t) => { onSaveTranscript('intake', t); onNext(); }} />
        }
        {stepIndex === 1 &&
          <UnderstandStep onNext={onNext} transcript={transcripts.intake} onSaveResponse={onSaveUnderstandResponse} />
        }
        {stepIndex === 2 &&
          <NameStep emotions={emotions} onToggle={onToggleEmotion} onNext={onNext} />
        }
        {stepIndex === 3 &&
          <SensationStep sensations={sensations} onToggle={onToggleSensation} onNext={onNext} />
        }
        {stepIndex === 4 && <NoticeStep onNext={onNext} />}
        {stepIndex === 5 &&
          <AskStep onNext={(t) => { onSaveTranscript('ask', t); onNext(); }} />
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
          <GoStep onNext={(t) => onComplete(t)} />
        }
      </div>
    </motion.div>
  );
}

/* ============================================================
   STEP 0 — INTAKE
   ============================================================ */
function IntakeStep({ onNext, initialTranscript }: { onNext: (transcript: string) => void; initialTranscript?: string; }) {
  return (
    <StepShell label="unload" prompt="What's going on right now?" subtext="No filter. Just dump it.">
      <VoiceButton onComplete={onNext} initialText={initialTranscript} />
    </StepShell>
  );
}

/* ============================================================
   STEP 1 — UNDERSTAND
   ============================================================ */
const UNDERSTAND_SYSTEM_PROMPT = `You are the voice of Unsnag. Someone just shared something hard. Give them exactly 2 sentences.

Your job is NOT to analyze what they said or weigh in on their situation. Your job is to hold up a mirror to the human experience of carrying something like this — the exhaustion of being someone who holds it all together, the weight of living in a world that expects you to fix things fast and feel things never. Speak to the woman who is so used to being capable that she has forgotten she is also allowed to be tired.

Sentence 1: Name something true about what it costs to carry this kind of thing — not this specific thing, but the human experience of feeling stuck, overwhelmed, or like you're failing at something that matters. Ground it in what it means to be a person, not a verdict on their choices.
Sentence 2: A single short line that gives them permission to just be here with it. Not a prompt to act. Not a reframe. Just a soft landing. Something like "You don't have to fix this right now." or "It makes sense that you needed a minute."

Rules:
- 2 sentences. Hard limit.
- No blame, no praise, no evaluation of their choices or anyone else's.
- No over-advocacy ("you deserve so much better") — that's noise, not support.
- No therapy-speak. No "I hear you", "that makes sense", "it's valid", "you are not alone".
- Not too specific to what they said — this is about the human experience, not their situation.
- Warm, grounded, and real. Like a friend who has been through it too.

Return plain text only.`;

function UnderstandStep({ onNext, transcript, onSaveResponse }: { onNext: () => void; transcript?: string; onSaveResponse?: (text: string) => void; }) {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (import.meta.env.VITE_MOCK_AI === 'true') {
        await new Promise((r) => setTimeout(r, 400));
        if (!cancelled) {
          const text = '[MOCK] AI response skipped — VITE_MOCK_AI=true';
          setResponse(text);
          onSaveResponse?.(text);
        }
        return;
      }

      const res = await aiMessage({
        model: 'claude-sonnet-4-6',
        max_tokens: 150,
        system: UNDERSTAND_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: transcript
            ? `Here's what they shared: "${transcript}"`
            : 'They didn\'t share details — give a grounded, general validation.',
        }],
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
    <StepShell prompt="Of course this is hard.">
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

      {response &&
        <motion.p
          className="font-body text-sm text-warm-dark-light text-center leading-relaxed mb-8 max-w-xs"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}>
          {response}
        </motion.p>
      }

      {error &&
        <motion.p
          className="font-body text-sm text-warm-dark-light text-center leading-relaxed mb-8 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}>
          That urge to fix it, the guilt, the loop — that's your old learned behavior. We're not doing that right now.
        </motion.p>
      }

      {(response || error) && <ContinueButton onClick={onNext} delay={0.1} />}
    </StepShell>
  );
}

/* ============================================================
   STEP 2 — NAME
   ============================================================ */
function NameStep({ emotions, onToggle, onNext }: { emotions: string[]; onToggle: (e: string) => void; onNext: () => void; }) {
  const hasSelection = emotions.length > 0;
  return (
    <StepShell
      label="name"
      prompt="What are you feeling right now?"
      subtext="Naming it actually turns the volume down.">
      <p className="font-body text-xs text-warm-dark-light text-center mb-4">Tap anything that fits. No wrong answers.</p>
      <EmotionChips selected={emotions} onToggle={onToggle} />
      {hasSelection && <ContinueButton onClick={onNext} delay={0} />}
    </StepShell>
  );
}

/* ============================================================
   STEP 3 — SENSATION
   ============================================================ */
function SensationStep({ sensations, onToggle, onNext }: { sensations: string[]; onToggle: (s: string) => void; onNext: () => void; }) {
  const hasSelection = sensations.length > 0;
  return (
    <StepShell
      label="sensation"
      prompt="Where are you feeling this?"
      subtext="Feelings live in the body, even when we ignore them. Finding it is what lets it move.">
      <p className="font-body text-xs text-warm-dark-light text-center mb-4">Tap anything that fits. No wrong answers.</p>
      <SensationChips selected={sensations} onToggle={onToggle} />
      {hasSelection && <ContinueButton onClick={onNext} delay={0} />}
    </StepShell>
  );
}

/* ============================================================
   STEP 4 — NOTICE — ~90s, breathing animation + audio
   ============================================================ */
function NoticeStep({ onNext }: { onNext: () => void }) {
  const TOTAL_SECONDS = 90;
  const DEV_INSTANT_SKIP = import.meta.env.DEV;
  type Phase = 'idle' | 'running' | 'done';
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<NoticeAudioHandle | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.stopImmediate();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running') return;
    if (secondsLeft <= 0) {
      setPhase('done');
      audioRef.current?.endWithChime();
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase !== 'running') return;
    if (DEV_INSTANT_SKIP) { setCanSkip(true); return; }
    const timer = window.setTimeout(() => setCanSkip(true), 30000);
    return () => window.clearTimeout(timer);
  }, [phase, DEV_INSTANT_SKIP]);

  const handleBegin = async () => {
    const audio = createNoticeAudio();
    audioRef.current = audio;
    await audio.startAmbient();
    setSecondsLeft(TOTAL_SECONDS);
    setPhase('running');
  };

  const handleSkipOrLeave = () => {
    audioRef.current?.stopImmediate();
    audioRef.current = null;
    onNext();
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current?.setMuted(next);
  };

  const running = phase === 'running';
  const done = phase === 'done';

  const timeStr = running
    ? `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`
    : '';

  return (
    <StepShell
      label="notice"
      prompt="Just feel it. Don't fix it."
      subtext="Science says a feeling fully felt lasts about 90 seconds. That's all we're asking for."
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <div
          className="relative my-2 flex items-center justify-center"
          style={{ width: 168, height: 168 }}
          aria-live={phase === 'running' ? 'polite' : 'off'}
        >
          {running && (
            <>
              <motion.div
                className="pointer-events-none absolute z-0 rounded-full bg-mauve/20"
                animate={{ width: [100, 135, 100], height: [100, 135, 100] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="pointer-events-none absolute z-0 rounded-full border-2 border-mauve bg-mauve/30"
                animate={{ width: [68, 90, 68], height: [68, 90, 68] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}

          {phase === 'idle' && (
            <motion.button
              type="button"
              onClick={() => void handleBegin()}
              className="
                relative z-[11] flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full
                border-[3px] border-warm-dark bg-mauve shadow-chunky cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              "
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96, boxShadow: '1px 1px 0px 0px #2D2A26' }}
              aria-label="Start timer"
            >
              <span className="font-heading font-bold text-sm text-warm-dark-light leading-tight">Start</span>
              <span className="font-heading font-bold text-sm text-warm-dark-light leading-tight">timer</span>
            </motion.button>
          )}

          {running && (
            <span
              className="relative z-[11] font-heading text-2xl font-bold tabular-nums text-warm-dark-light"
              aria-label={secondsLeft > 0 ? `About ${timeStr} left` : 'Time complete'}
            >
              {timeStr}
            </span>
          )}

          {done && (
            <motion.span
              className="relative z-[11] font-heading text-lg font-bold text-mauve-dark"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              okay
            </motion.span>
          )}
        </div>

        {phase === 'idle' && (
          <motion.p
            className="text-center font-body text-sm text-warm-dark-light"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Focus on what you just named. Imagine pulling up a chair and giving it a seat. Let it be here. Don't analyze it, don't explain it — just let it stay.
          </motion.p>
        )}

        <AnimatePresence>
          {running && (
            <motion.button
              type="button"
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 font-body text-xs text-warm-dark-light/60 hover:text-warm-dark-light transition-colors cursor-pointer focus:outline-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
              {muted ? 'Unmute' : 'Mute'}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.button
              type="button"
              onClick={onNext}
              className="
                mt-1 w-full max-w-[280px] px-7 py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve
                font-heading font-semibold text-base text-warm-dark-light
                shadow-chunky cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
              "
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' }}
            >
              Continue
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canSkip && running && (
            <motion.button
              type="button"
              onClick={handleSkipOrLeave}
              className="font-body text-xs text-warm-dark-light underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-warm-dark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {DEV_INSTANT_SKIP ? 'Skip timer (testing)' : "Skip rest — I'm ready"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </StepShell>
  );
}

/* ============================================================
   STEP 5 — ASK
   ============================================================ */
function AskStep({ onNext }: { onNext: (transcript: string) => void; }) {
  return (
    <StepShell
      label="ask"
      prompt="What does the feeling actually want to say?"
      subtext="Let it come out raw. Unfiltered. Whatever it is.">
      <motion.p
        className="font-body text-xs text-warm-dark-light italic text-center mb-6 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}>
        "I don't know… you're doing it again… they're gonna leave…"
      </motion.p>
      <VoiceButton onComplete={onNext} />
    </StepShell>
  );
}

/* ============================================================
   STEP 7 — GO
   ============================================================ */
function GoStep({ onNext }: { onNext: (transcript: string) => void; }) {
  return (
    <StepShell
      label="go"
      prompt="What's one small thing you can do differently now?"
      subtext="Normally you would have reacted a certain way. What's available to you now that wasn't before?">
      <VoiceButton onComplete={onNext} />
    </StepShell>
  );
}

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */
function StepShell({ label, prompt, subtext, children }: { label?: string; prompt: string; subtext?: string; children: React.ReactNode; }) {
  return (
    <div className="flex flex-col items-center w-full">
      {label &&
        <motion.span
          className="font-body text-xs uppercase tracking-widest text-warm-dark-light font-semibold mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}>
          {label}
        </motion.span>
      }

      <motion.h2
        className="font-heading text-2xl sm:text-3xl font-bold text-warm-dark text-center leading-snug mb-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 22 }}>
        {prompt}
      </motion.h2>

      {subtext &&
        <motion.p
          className="font-body text-sm text-warm-dark-light text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}>
          {subtext}
        </motion.p>
      }

      <motion.div
        className="w-full flex flex-col items-center mt-2"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 22 }}>
        {children}
      </motion.div>
    </div>
  );
}

function ContinueButton({ onClick, delay = 0.3, disabled = false }: { onClick: () => void; delay?: number; disabled?: boolean; }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        mt-8 w-full max-w-[280px] py-3.5 rounded-xl border-[3px]
        font-heading font-semibold text-base
        focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        transition-all duration-150
        ${disabled
          ? 'border-warm-gray-light bg-cream-dark text-warm-dark-light cursor-not-allowed opacity-60'
          : 'border-warm-dark bg-mauve text-warm-dark shadow-chunky cursor-pointer'}
      `}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 22 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97, y: disabled ? 0 : 2, boxShadow: disabled ? 'none' : '1px 1px 0px 0px #2D2A26' }}>
      continue
    </motion.button>
  );
}
