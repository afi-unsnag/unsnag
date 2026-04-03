import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MicIcon } from 'lucide-react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function QuickLogModal({ isOpen, onClose, onSave }: QuickLogModalProps) {
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState(false);
  const speechAvailable = Boolean(SpeechRecognitionAPI);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const baseTextRef = useRef('');
  const finalRef = useRef('');
  const activeRef = useRef(false);

  const stopRecording = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    baseTextRef.current = note.trim() ? note.trim() + ' ' : '';
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
      setNote(baseTextRef.current + finalRef.current.trimStart() + interim);
    };

    recognition.onend = () => {
      if (activeRef.current) {
        try { recognition.start(); } catch { /* already started */ }
        return;
      }
      setNote((baseTextRef.current + finalRef.current).trim());
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
  }, [note]);

  const handleMicPress = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
    return () => {
      activeRef.current = false;
      recognitionRef.current?.abort();
    };
  }, [isOpen, stopRecording]);

  const handleSave = useCallback(() => {
    if (note.trim()) {
      stopRecording();
      onSave(note.trim());
      setNote('');
      onClose();
    }
  }, [note, onSave, onClose, stopRecording]);

  const handleClose = useCallback(() => {
    stopRecording();
    setNote('');
    onClose();
  }, [onClose, stopRecording]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-warm-dark/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal sheet */}
          <motion.div
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-cream border-t-[3px] border-l-[3px] border-r-[3px] border-warm-dark
              rounded-t-2xl p-6 pb-24
              max-w-lg mx-auto
            "
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 text-warm-dark-light hover:text-warm-dark transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve rounded"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <h3 className="font-heading text-xl font-bold text-warm-dark mb-1">
              Save this for later
            </h3>
            <p className="font-body text-sm text-warm-dark-light mb-5">
              Save it for when you're ready.
            </p>

            <div className={`
              relative w-full rounded-lg border-2 bg-cream-dark transition-colors
              ${recording ? 'border-mauve shadow-[0_0_0_3px_rgba(226,198,253,0.35)]' : 'border-warm-gray-light'}
              focus-within:border-warm-dark
            `}>
              <textarea
                value={note}
                onChange={(e) => !recording && setNote(e.target.value)}
                placeholder={speechAvailable ? 'Type here, or tap the mic to speak...' : 'what happened...'}
                className={`
                  w-full rounded-lg bg-transparent
                  font-body text-base text-warm-dark-light placeholder:text-warm-gray
                  resize-none focus:outline-none focus:ring-0
                  ${speechAvailable ? 'p-3.5 pr-14 pb-10' : 'p-3.5'}
                  ${recording ? 'text-warm-dark-light/90 cursor-default' : ''}
                `}
                rows={4}
                aria-label="Quick note"
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
                        listening...
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    onClick={handleMicPress}
                    className={`
                      relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                      border-2 border-warm-dark cursor-pointer
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream-dark
                      ${recording ? 'bg-mauve-dark' : 'bg-mauve shadow-chunky-sm'}
                    `}
                    whileTap={{ scale: 0.94, y: 1 }}
                    animate={{ scale: recording ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: recording ? 0.85 : 0.2, repeat: recording ? Infinity : 0, ease: 'easeInOut' }}
                    aria-label={recording ? 'Stop recording' : 'Start voice input'}
                    aria-pressed={recording}
                  >
                    <MicIcon className="h-4 w-4 text-warm-dark-light" strokeWidth={2.5} />
                  </motion.button>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <motion.button
                onClick={handleSave}
                className={`
                  px-6 py-2.5 rounded-lg border-2 font-heading font-semibold text-sm cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
                  ${note.trim() ? 'border-warm-dark bg-mauve text-warm-dark shadow-chunky-sm' : 'border-warm-gray-light bg-cream-dark text-warm-dark-light cursor-not-allowed'}
                `}
                whileTap={note.trim() ? { scale: 0.96, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' } : {}}
                disabled={!note.trim()}
              >
                save
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
