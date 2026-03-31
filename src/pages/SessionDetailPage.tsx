import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';

interface SessionInsight {
  whatsYours: string[];
  whatsNotYours: string[];
  affirmation: string;
}
interface Session {
  id: string;
  timestamp: Date;
  emotions: string[];
  sensations: string[];
  completed: boolean;
  intakeTranscript?: string;
  understandResponse?: string;
  askTranscript?: string;
  insight?: SessionInsight;
  goTranscript?: string;
}
interface SessionDetailPageProps {
  session: Session;
  onBack: () => void;
}

function StepRow({ letter, label, children }: { letter: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full border-2 border-warm-dark bg-mauve flex items-center justify-center flex-shrink-0">
          <span className="font-heading font-bold text-sm text-warm-dark-light">{letter}</span>
        </div>
        <div className="flex-1 w-px bg-warm-gray-light mt-2" />
      </div>
      <div className="flex-1 pb-8">
        <p className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider mb-3">{label}</p>
        {children}
      </div>
    </div>
  );
}

export function SessionDetailPage({ session, onBack }: SessionDetailPageProps) {
  const dateStr = session.timestamp.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-cream px-5 pt-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Top bar */}
        <div className="flex items-center mb-6">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-lg border-2 border-warm-gray-light bg-cream-dark flex items-center justify-center cursor-pointer hover:border-warm-dark hover:shadow-chunky-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            whileTap={{ scale: 0.92, y: 1 }}
            aria-label="Back to history">
            <ArrowLeftIcon className="w-4 h-4 text-warm-dark-light" strokeWidth={2.5} />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}>

          <h1 className="font-heading text-2xl font-bold text-warm-dark mb-1">Session</h1>
          <p className="font-body text-sm text-warm-dark-light mb-8">{dateStr}</p>

          {/* UNSNAG timeline */}
          <div>

            {/* U — Unload */}
            <StepRow letter="U" label="Unload">
              {session.intakeTranscript && (
                <div className="p-4 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-sm text-warm-dark-light leading-relaxed mb-3">
                  "{session.intakeTranscript}"
                </div>
              )}
              {session.understandResponse && (
                <p className="font-body text-sm text-warm-dark-light leading-relaxed italic">
                  {session.understandResponse}
                </p>
              )}
            </StepRow>

            {/* N — Name */}
            <StepRow letter="N" label="Name">
              {session.emotions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {session.emotions.map((e) => (
                    <span key={e} className="px-3 py-1 rounded-lg text-xs font-body font-medium bg-mauve/20 text-warm-dark border border-mauve/40">
                      {e}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-warm-dark-light italic">no emotions named</p>
              )}
            </StepRow>

            {/* S — Sensation */}
            <StepRow letter="S" label="Sensation">
              {session.sensations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {session.sensations.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg text-xs font-body font-medium bg-blush/20 text-warm-dark-light border border-blush/40">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-warm-dark-light italic">no sensations noted</p>
              )}
            </StepRow>

            {/* N — Notice */}
            <StepRow letter="N" label="Notice">
              <p className="font-body text-sm text-warm-dark-light italic">
                You let it be there without fixing it.
              </p>
            </StepRow>

            {/* A — Ask */}
            <StepRow letter="A" label="Ask">
              {session.askTranscript ? (
                <div className="p-4 rounded-xl border-2 border-warm-gray-light bg-cream-dark font-body text-sm text-warm-dark-light leading-relaxed">
                  "{session.askTranscript}"
                </div>
              ) : (
                <p className="font-body text-sm text-warm-dark-light italic">nothing recorded</p>
              )}
            </StepRow>

            {/* Insight — between Ask and Go */}
            {session.insight && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-2 border-warm-gray-light bg-cream-dark flex items-center justify-center flex-shrink-0">
                    <span className="font-heading font-bold text-xs text-warm-dark-light">✦</span>
                  </div>
                  <div className="flex-1 w-px bg-warm-gray-light mt-2" />
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-heading text-xs font-semibold text-warm-dark-light uppercase tracking-wider mb-3">Untangled</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border-2 border-tomato bg-cream p-4">
                        <p className="font-heading font-bold text-xs text-tomato mb-2">What's yours to be accountable for</p>
                        <ul className="space-y-1.5">
                          {session.insight.whatsYours.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-tomato flex-shrink-0" />
                              <span className="font-body text-xs text-warm-dark-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border-2 border-orange bg-cream p-4">
                        <p className="font-heading font-bold text-xs text-orange-dark mb-2">What's not yours to be accountable for</p>
                        <ul className="space-y-1.5">
                          {session.insight.whatsNotYours.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-orange flex-shrink-0" />
                              <span className="font-body text-xs text-warm-dark-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* G — Go */}
            <StepRow letter="G" label="Go">
              {session.goTranscript ? (
                <div className="p-4 rounded-xl border-2 border-warm-dark bg-mauve font-body text-sm text-warm-dark font-medium leading-relaxed">
                  "{session.goTranscript}"
                </div>
              ) : (
                <p className="font-body text-sm text-warm-dark-light italic">nothing recorded</p>
              )}
            </StepRow>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
