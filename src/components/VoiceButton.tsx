import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicIcon } from 'lucide-react';

interface VoiceButtonProps {
  onComplete: (transcript: string) => void;
  initialText?: string;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

export function VoiceButton({ onComplete, initialText = '' }: VoiceButtonProps) {
  const speechAvailable = Boolean(SpeechRecognitionAPI);
  const [recording, setRecording] = useState(false);
  const [textValue, setTextValue] = useState(initialText);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const baseTextRef = useRef('');
  const finalRef = useRef('');
  const activeRef = useRef(false); // true while user intends to be recording

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    baseTextRef.current = textValue.trim() ? textValue.trim() + ' ' : '';
    finalRef.current = '';

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTextValue(baseTextRef.current + finalRef.current.trimStart() + interim);
    };

    recognition.onend = () => {
      if (activeRef.current) {
        // Browser cut us off — restart seamlessly to capture more
        try { recognition.start(); } catch { /* already started */ }
        return;
      }
      setTextValue((baseTextRef.current + finalRef.current).trim());
      setRecording(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      setRecording(false);
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    recognition.start();
    setRecording(true);
  }, [textValue]);

  const stopRecording = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const handleMicPress = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  const handleContinue = useCallback(() => {
    const text = textValue.trim();
    if (text) onComplete(text);
  }, [textValue, onComplete]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const hasText = textValue.trim().length > 0;

  useEffect(() => {
    setTextValue(initialText);
  }, [initialText]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {/* Option B: single composer — textarea + mic in one surface */}
      <motion.div
        className={`
          relative w-full rounded-xl border-2 bg-cream-dark transition-colors
          ${recording ? 'border-mauve shadow-[0_0_0_3px_rgba(226,198,253,0.35)]' : 'border-warm-gray-light'}
          focus-within:border-warm-dark
        `}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <textarea
          value={textValue}
          onChange={(e) => !recording && setTextValue(e.target.value)}
          placeholder={
            speechAvailable
              ? 'Type here, or tap the mic to speak…'
              : 'just get it out…'
          }
          rows={5}
          className={`
            w-full rounded-xl bg-transparent font-body text-base text-warm-dark-light
            placeholder:text-warm-gray resize-none transition-colors
            focus:outline-none focus:ring-0
            ${speechAvailable ? 'p-3 pr-[3.25rem] pb-14' : 'p-3'}
            ${recording ? 'text-warm-dark-light/90 cursor-default' : ''}
          `}
          aria-label="What's on your mind"
        />

        {speechAvailable && (
          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
            <AnimatePresence>
              {recording && (
                <motion.span
                  className="font-body text-[11px] font-medium text-mauve-dark mr-1"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  listening…
                </motion.span>
              )}
            </AnimatePresence>

            <div className="relative flex items-center justify-center">
              <AnimatePresence>
                {recording && (
                  <>
                    <motion.div
                      className="absolute rounded-full border-2 border-mauve"
                      initial={{ width: 44, height: 44, opacity: 0.5 }}
                      animate={{ width: [44, 64], height: [44, 64], opacity: [0.5, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="absolute rounded-full border-2 border-mauve"
                      initial={{ width: 44, height: 44, opacity: 0.35 }}
                      animate={{ width: [44, 72], height: [44, 72], opacity: [0.35, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.35 }}
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={handleMicPress}
                className={`
                  relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                  border-[3px] border-warm-dark cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream-dark
                  ${recording ? 'bg-mauve-dark' : 'bg-mauve shadow-chunky-sm'}
                `}
                whileTap={{ scale: 0.94, y: 1 }}
                animate={{ scale: recording ? [1, 1.05, 1] : 1 }}
                transition={{ duration: recording ? 0.85 : 0.2, repeat: recording ? Infinity : 0, ease: 'easeInOut' }}
                aria-label={recording ? 'Stop recording' : 'Start voice input'}
                aria-pressed={recording}
              >
                <MicIcon className="h-5 w-5 text-warm-dark-light" strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {speechAvailable && recording && (
        <p className="font-body text-xs text-warm-dark-light text-center px-1 -mt-0.5">
          Tap the mic again when you’re done.
        </p>
      )}

      <AnimatePresence>
        {hasText && !recording && (
          <motion.button
            type="button"
            onClick={handleContinue}
            className="
              w-full py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve
              font-heading font-semibold text-base text-warm-dark-light
              shadow-chunky cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
            "
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' }}
          >
            Continue
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
