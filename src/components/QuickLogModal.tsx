import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function QuickLogModal({ isOpen, onClose, onSave }: QuickLogModalProps) {
  const [note, setNote] = useState('');

  const handleSave = useCallback(() => {
    if (note.trim()) {
      onSave(note.trim());
      setNote('');
      onClose();
    }
  }, [note, onSave, onClose]);

  const handleClose = useCallback(() => {
    setNote('');
    onClose();
  }, [onClose]);

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

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="what happened…"
              className="
                w-full p-3.5 rounded-lg border-2 border-warm-gray-light bg-cream-dark
                font-body text-base text-warm-dark-light placeholder:text-warm-gray
                resize-none focus:border-warm-dark transition-colors
              "
              rows={4}
              aria-label="Quick note"
            />

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
