import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookmarkIcon, PlusIcon, ArrowLeftIcon } from 'lucide-react';
import { QuickLogModal } from '../components/QuickLogModal';

interface QuickLog {
  id: string;
  timestamp: Date;
  note: string;
}

interface SavedPageProps {
  quickLogs: QuickLog[];
  onStartFromSaved: (log: QuickLog) => void;
  onSave: (note: string) => void;
  onBack: () => void;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SavedPage({ quickLogs, onStartFromSaved, onSave, onBack }: SavedPageProps) {
  const [showModal, setShowModal] = useState(false);
  const hasContent = quickLogs.length > 0;

  return (
    <div className="min-h-screen bg-cream px-5 pt-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark flex items-center justify-center cursor-pointer hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            whileTap={{ scale: 0.92, y: 1 }}
            aria-label="Go home">
            <ArrowLeftIcon className="w-4 h-4 text-warm-dark-light" strokeWidth={2.5} />
          </motion.button>
        </div>
        <motion.h1
          className="font-heading text-3xl font-bold text-warm-dark mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          Saved for later
        </motion.h1>

        {!hasContent ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-cream-dark border-2 border-warm-gray-light flex items-center justify-center mb-4">
              <BookmarkIcon className="w-7 h-7 text-warm-dark-light" />
            </div>
            <p className="font-body text-sm text-warm-dark-light max-w-xs">
              Nothing saved yet. Tap + to log something you're not ready to work through right now.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {quickLogs.map((log, i) => (
              <motion.div
                key={log.id}
                className="rounded-xl border-2 border-warm-gray-light bg-cream-dark p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <span className="font-body text-xs text-warm-dark-light block mb-1.5">
                  {formatDate(log.timestamp)}
                </span>
                <p className="font-body text-sm text-warm-dark-light leading-relaxed">
                  {log.note}
                </p>
                <button
                  type="button"
                  onClick={() => onStartFromSaved(log)}
                  className="
                    mt-3 px-4 py-2 rounded-lg border-2 border-mauve-dark bg-mauve
                    font-heading text-sm font-semibold text-warm-dark-light
                    hover:bg-mauve-dark hover:shadow-chunky-sm transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream-dark
                    cursor-pointer
                  "
                >
                  Start now
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating action button */}
      <motion.button
        onClick={() => setShowModal(true)}
        className="
          fixed bottom-24 right-5 z-40
          w-14 h-14 rounded-full border-[3px] border-warm-dark bg-mauve
          flex items-center justify-center
          shadow-chunky cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream
        "
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92, y: 2, boxShadow: '1px 1px 0px 0px #2D2A26' }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        aria-label="Save something for later"
      >
        <PlusIcon className="w-6 h-6 text-warm-dark-light" strokeWidth={3} />
      </motion.button>

      <QuickLogModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={onSave}
      />
    </div>
  );
}
