import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon } from 'lucide-react';
interface Session {
  id: string;
  timestamp: Date;
  emotions: string[];
  sensations: string[];
  completed: boolean;
  intakeTranscript?: string;
  askTranscript?: string;
  goTranscript?: string;
}
interface HistoryPageProps {
  sessions: Session[];
  onViewSession: (session: Session) => void;
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
    minute: '2-digit'
  });
}
export function HistoryPage({ sessions, onViewSession }: HistoryPageProps) {
  const hasContent = sessions.length > 0;
  return (
    <div className="min-h-screen bg-cream px-5 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <motion.h1
          className="font-heading text-3xl font-bold text-warm-dark mb-6"
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
            stiffness: 300,
            damping: 22
          }}>
          
          Your unsnags
        </motion.h1>

        {!hasContent ?
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-center"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.2
          }}>
          
            <div className="w-16 h-16 rounded-full bg-cream-dark border-2 border-warm-gray-light flex items-center justify-center mb-4">
              <ClockIcon className="w-7 h-7 text-warm-gray" />
            </div>
            <p className="font-body text-sm text-warm-gray max-w-xs">
              No unsnags yet. You'll see your sessions here after you complete
              one.
            </p>
          </motion.div> :

        <div className="space-y-3">
            {sessions.map((session, i) =>
          <motion.button
            key={session.id}
            onClick={() => onViewSession(session)}
            className="w-full text-left rounded-xl border-2 border-warm-dark bg-cream p-4 shadow-chunky-sm cursor-pointer hover:bg-cream-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve"
            initial={{
              opacity: 0,
              y: 16
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: i * 0.08,
              type: 'spring',
              stiffness: 300,
              damping: 22
            }}
            whileTap={{
              scale: 0.98,
              y: 2,
              boxShadow: '1px 1px 0px 0px #2D2A26'
            }}>
            
                <div className="flex items-start justify-between mb-2">
                  <span className="font-body text-xs text-warm-gray">
                    {formatDate(session.timestamp)}
                  </span>
                  {session.completed &&
              <span className="text-[10px] font-body font-semibold text-sage-dark bg-sage/20 px-2 py-0.5 rounded-full">
                      completed
                    </span>
              }
                </div>

                {session.emotions.length > 0 &&
            <div className="flex flex-wrap gap-1.5 mb-2">
                    {session.emotions.map((e) =>
              <span
                key={e}
                className="px-2 py-0.5 rounded text-[11px] font-body font-medium bg-mauve/20 text-warm-dark border border-mauve/40">
                
                        {e}
                      </span>
              )}
                  </div>
            }

                {session.sensations.length > 0 &&
            <div className="flex flex-wrap gap-1.5">
                    {session.sensations.map((s) =>
              <span
                key={s}
                className="px-2 py-0.5 rounded text-[11px] font-body font-medium bg-blush/20 text-warm-dark border border-blush/40">

                        {s}
                      </span>
              )}
                  </div>
            }

                {session.goTranscript &&
            <div className="mt-3 pt-3 border-t border-warm-gray-light/60">
                    <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">decided on</p>
                    <p className="font-body text-sm text-warm-dark leading-snug line-clamp-2">
                      {session.goTranscript}
                    </p>
                  </div>
            }
              </motion.button>
          )}
          </div>
        }
      </div>
    </div>);

}