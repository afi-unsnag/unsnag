import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, ArrowLeftIcon, Trash2Icon } from 'lucide-react';

interface Session {
  id: string;
  timestamp: Date;
  emotions: string[];
  sensations: string[];
  completed: boolean;
  intakeTranscript?: string;
  askTranscript?: string;
  goTranscript?: string;
  aiTitle?: string;
  aiTakeaway?: string;
}

interface HistoryPageProps {
  sessions: Session[];
  onViewSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onDeleteAllSessions: () => void;
  onBack: () => void;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function HistoryPage({ sessions, onViewSession, onDeleteSession, onDeleteAllSessions, onBack }: HistoryPageProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const hasContent = sessions.length > 0;

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
          Your History
        </motion.h1>

        {!hasContent ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-cream-dark border-2 border-warm-gray-light flex items-center justify-center mb-4">
              <ClockIcon className="w-7 h-7 text-warm-dark-light" />
            </div>
            <p className="font-body text-sm text-warm-dark-light max-w-xs">
              No unsnags yet. You'll see your sessions here after you complete one.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  className="rounded-xl border-2 border-warm-dark bg-white shadow-chunky-sm overflow-hidden"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <AnimatePresence mode="wait">
                    {confirmDeleteId === session.id ? (
                      /* Confirm delete inline */
                      <motion.div
                        key="confirm"
                        className="p-4 flex items-center justify-between gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <p className="font-body text-sm text-warm-dark-light">Delete this session?</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { onDeleteSession(session.id); setConfirmDeleteId(null); }}
                            className="px-3 py-1.5 rounded-lg border-2 border-tomato bg-tomato font-heading font-semibold text-xs text-cream cursor-pointer focus:outline-none"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="font-body text-xs text-warm-dark-light underline cursor-pointer hover:text-warm-dark transition-colors"
                          >
                            cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Normal card */
                      <motion.div
                        key="card"
                        className="p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-body text-xs text-warm-dark-light">
                            {formatDate(session.timestamp)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                            className="flex-shrink-0 p-1 text-warm-dark-light hover:text-tomato transition-colors cursor-pointer focus:outline-none"
                            aria-label="Delete session"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>

                        <button
                          onClick={() => onViewSession(session)}
                          className="w-full text-left focus:outline-none"
                        >
                          <p className="font-heading font-semibold text-sm text-warm-dark leading-snug line-clamp-1 mb-2">
                            {session.aiTitle || session.intakeTranscript || 'Session'}
                          </p>

                          {(session.emotions.length > 0 || session.sensations.length > 0) && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {session.emotions.map((e) => (
                                <span key={e} className="px-2 py-0.5 rounded text-[11px] font-body font-medium bg-tomato/15 text-warm-dark border border-tomato/40">
                                  {e}
                                </span>
                              ))}
                              {session.sensations.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded text-[11px] font-body font-medium bg-mauve/20 text-warm-dark border border-mauve/40">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {(session.aiTakeaway || session.goTranscript) && (
                            <div className="mt-2 pt-2 border-t border-warm-gray-light/60">
                              <p className="font-heading text-[10px] font-semibold uppercase tracking-wider text-warm-dark-light/60 mb-0.5">Takeaway</p>
                              <p className="font-body text-xs text-warm-dark-light line-clamp-1">
                                {session.aiTakeaway || session.goTranscript}
                              </p>
                            </div>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Delete all */}
            <div className="mt-8 flex flex-col items-center">
              <AnimatePresence mode="wait">
                {confirmDeleteAll ? (
                  <motion.div
                    key="confirm-all"
                    className="flex flex-col items-center gap-3 text-center"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="font-body text-sm text-warm-dark-light">Delete all sessions? This can't be undone.</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { onDeleteAllSessions(); setConfirmDeleteAll(false); }}
                        className="px-4 py-2 rounded-lg border-2 border-tomato bg-tomato font-heading font-semibold text-sm text-cream cursor-pointer focus:outline-none"
                      >
                        Yes, delete all
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAll(false)}
                        className="font-body text-sm text-warm-dark-light underline cursor-pointer hover:text-warm-dark transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="delete-all-btn"
                    onClick={() => setConfirmDeleteAll(true)}
                    className="font-body text-xs text-warm-dark-light/60 underline underline-offset-2 decoration-warm-gray-light cursor-pointer hover:text-tomato transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    Delete all sessions
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
