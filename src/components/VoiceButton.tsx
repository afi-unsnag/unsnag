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
  const [recording, setRecording] = useState(false);
  const [textValue, setTextValue] = useState(initialText);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  // Tracks text that was already in the box when recording started, so we can append
  const baseTextRef = useRef('');
  const finalRef = useRef('');

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    // Capture whatever is already typed so we can append voice to it
    baseTextRef.current = textValue.trim() ? textValue.trim() + ' ' : '';
    finalRef.current = '';

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalRef.current += event.results[i][0].transcript + ' ';
        }
      }
      setTextValue(baseTextRef.current + finalRef.current.trimStart());
    };

    recognition.onend = () => {
      setTextValue((baseTextRef.current + finalRef.current).trim());
      setRecording(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [textValue]);

  const stopRecording = useCallback(() => {
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
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const hasText = textValue.trim().length > 0;

  useEffect(() => {
    setTextValue(initialText);
  }, [initialText]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">

      {/* Mic button — hidden if browser has no speech support */}
      {SpeechRecognitionAPI && (
        <>
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {recording && (
                <>
                  <motion.div
                    className="absolute rounded-full border-2 border-mauve"
                    initial={{ width: 88, height: 88, opacity: 0.5 }}
                    animate={{ width: [88, 140], height: [88, 140], opacity: [0.5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }} />
                  <motion.div
                    className="absolute rounded-full border-2 border-mauve"
                    initial={{ width: 88, height: 88, opacity: 0.4 }}
                    animate={{ width: [88, 160], height: [88, 160], opacity: [0.4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }} />
                </>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleMicPress}
              className={`
                relative z-10 rounded-full border-[3px] border-warm-dark
                flex items-center justify-center cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                ${recording ? 'bg-mauve-dark' : 'bg-mauve shadow-chunky-lg'}
              `}
              style={{ width: 88, height: 88 }}
              whileTap={{ scale: 0.92, y: 2 }}
              animate={{ scale: recording ? [1, 1.06, 1] : [1, 1.03, 1] }}
              transition={{ duration: recording ? 0.8 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
              aria-label={recording ? 'Tap to stop recording' : 'Tap to start talking'}>
              <MicIcon className="w-8 h-8 text-warm-dark" strokeWidth={2.5} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={recording ? 'rec' : hasText ? 'add' : 'idle'}
              className={`text-sm font-body font-medium ${recording ? 'text-mauve-dark font-semibold' : 'text-warm-gray'}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}>
              {recording ? 'listening… tap when done' : hasText ? 'tap mic to add more' : 'tap to talk it out'}
            </motion.p>
          </AnimatePresence>
        </>
      )}

      {/* Textarea — always visible */}
      <motion.textarea
        value={textValue}
        onChange={(e) => !recording && setTextValue(e.target.value)}
        placeholder="just get it out…"
        rows={4}
        className={`
          w-full p-3 rounded-xl border-2 bg-cream-dark font-body text-sm text-warm-dark
          placeholder:text-warm-gray resize-none transition-colors
          focus:outline-none focus:border-warm-dark
          ${recording ? 'border-mauve/40 text-warm-gray cursor-default' : 'border-warm-gray-light'}
        `}
        aria-label="What's on your mind"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }} />

      {/* Continue — appears once there's text and not mid-recording */}
      <AnimatePresence>
        {hasText && !recording && (
          <motion.button
            onClick={handleContinue}
            className="
              w-full py-3.5 rounded-xl border-[3px] border-warm-dark bg-mauve
              font-heading font-semibold text-base text-warm-dark
              shadow-chunky cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
            "
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' }}>
            Continue
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
