import { useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { aiMessage } from './lib/ai';
import { checkAccessStatus, type AccessStatus } from './lib/subscription';
import { AuthScreen } from './components/AuthScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { LandingScreen } from './components/LandingScreen';
import { LoopStep } from './components/LoopStep';
import { CompletionScreen } from './components/CompletionScreen';
import { NavBar } from './components/NavBar';
import { HistoryPage } from './pages/HistoryPage';
import { SavedPage } from './pages/SavedPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingTour } from './components/OnboardingTour';

/* ---- Data types ---- */
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
  aiTitle?: string;
  aiTakeaway?: string;
}
interface QuickLog {
  id: string;
  timestamp: Date;
  note: string;
}
type NavTab = 'home' | 'history' | 'saved' | 'settings';

/* ---- AI session summary generator ---- */
async function generateSessionSummaries(
  intakeTranscript: string | undefined,
  goTranscript: string | undefined,
  emotions: string[],
  askTranscript?: string | undefined,
): Promise<{ title: string; takeaway: string } | null> {
  if (!intakeTranscript && !goTranscript) return null;
  try {
    const call = (system: string, content: string) =>
      aiMessage({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 40,
        system,
        messages: [{ role: 'user', content }],
      }).then((r) => r.json() as Promise<{ content: Array<{ type: string; text?: string }> }>);

    const [titleData, takeawayData] = await Promise.all([
      intakeTranscript
        ? call(
            'Write a 4–6 word title describing what this person was processing internally — their experience, not anyone else\'s behavior or character. Focus on what they were feeling or navigating, not on labeling other people. No blame, no characterization of others. Use second person ("you", "your") — never "her", "his", "she", "he", or "they". No quotes, no punctuation, plain text only.',
            `Emotions: ${emotions.join(', ')}. They said: "${intakeTranscript}"`,
          )
        : null,
      (goTranscript || askTranscript)
        ? call(
            'Write a short takeaway (max 8 words) that captures the internal shift or insight this person reached — how they are seeing this differently now, what clicked for them. Focus on perspective change, not action steps. Use second person ("you", "your") — never "her", "his", "she", "he", or "they". No blame, no judgment, no characterizing others. No quotes, plain text only.',
            [
              askTranscript ? `What the feeling said: "${askTranscript}"` : '',
              goTranscript ? `What they said at the end: "${goTranscript}"` : '',
            ].filter(Boolean).join('\n'),
          )
        : null,
    ]);

    return {
      title: titleData?.content?.find((b) => b.type === 'text')?.text?.trim() ?? '',
      takeaway: takeawayData?.content?.find((b) => b.type === 'text')?.text?.trim() ?? '',
    };
  } catch {
    return null;
  }
}

/* ---- Streak calculator ---- */
function calcStreak(sessions: Session[]): number {
  const completed = sessions.filter((s) => s.completed);
  if (completed.length === 0) return 0;

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const dateSet = new Set(completed.map((s) => fmt(s.timestamp)));
  const dates = [...dateSet].sort().reverse(); // most-recent first

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Streak is broken if the most recent session isn't today or yesterday
  if (dates[0] !== fmt(today) && dates[0] !== fmt(yesterday)) return 0;

  let streak = 0;
  const cursor = new Date(dates[0]);
  for (const d of dates) {
    if (d === fmt(cursor)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ---- DB row → app type mappers ---- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSession(row: any): Session {
  return {
    id: row.id,
    timestamp: new Date(row.created_at),
    emotions: row.emotions ?? [],
    sensations: row.sensations ?? [],
    completed: row.completed ?? false,
    intakeTranscript: row.intake_transcript ?? undefined,
    understandResponse: row.understand_response ?? undefined,
    askTranscript: row.ask_transcript ?? undefined,
    insight: row.insight ?? undefined,
    goTranscript: row.go_transcript ?? undefined,
    aiTitle: row.ai_title ?? undefined,
    aiTakeaway: row.ai_takeaway ?? undefined,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuickLog(row: any): QuickLog {
  return { id: row.id, timestamp: new Date(row.created_at), note: row.note };
}

/* ---- App ---- */
export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [unsnagCount, setUnsnagCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quickLogs, setQuickLogs] = useState<QuickLog[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  // In-progress loop screens (not routed — transient flow)
  const [loopScreen, setLoopScreen] = useState<'idle' | 'loop' | 'done'>('idle');
  // Current loop state
  const [currentEmotions, setCurrentEmotions] = useState<string[]>([]);
  const [currentSensations, setCurrentSensations] = useState<string[]>([]);
  const [transcripts, setTranscripts] = useState<{ intake?: string; ask?: string; go?: string }>({});
  const [currentUnderstandResponse, setCurrentUnderstandResponse] = useState<string | undefined>();
  const [currentInsight, setCurrentInsight] = useState<SessionInsight | undefined>();
  const [currentSavedLogId, setCurrentSavedLogId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const summaryBackfillRan = useRef(false);

  /* ---- Auth ---- */
  useEffect(() => {
    const checkOnboarding = async (u: User) => {
      const localDone = localStorage.getItem(`onboarding-done-${u.id}`);
      if (localDone) {
        // Migrate old localStorage flag to database
        await supabase.from('profiles').update({ onboarding_done: true }).eq('id', u.id);
        setShowOnboarding(false);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_done')
          .eq('id', u.id)
          .single();
        setShowOnboarding(!profile?.onboarding_done);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) void checkOnboarding(u);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void checkOnboarding(u);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ---- Check trial / subscription access ---- */
  useEffect(() => {
    if (!user) return;

    // If Stripe redirected back after successful checkout, wait briefly for
    // the webhook to land before re-checking (webhook is near-instant).
    const params = new URLSearchParams(window.location.search);
    const delay = params.get('checkout') === 'success' ? 2000 : 0;
    if (delay) window.history.replaceState({}, '', window.location.pathname);

    const run = () => checkAccessStatus(user.id).then(setAccessStatus);
    if (delay) { setTimeout(run, delay); } else { void run(); }
  }, [user]);

  /* ---- Load data when user logs in ---- */
  useEffect(() => {
    if (!user) return;

    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map(rowToSession);
          setSessions(mapped);
          setUnsnagCount(mapped.length);
        }
      });

    supabase
      .from('quick_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setQuickLogs(data.map(rowToQuickLog));
      });
  }, [user]);

  /* ---- Backfill AI summaries for existing sessions ---- */
  useEffect(() => {
    if (summaryBackfillRan.current) return;
    if (import.meta.env.VITE_MOCK_AI === 'true') return;
    const needsSummary = sessions.filter(
      (s) => s.completed && !s.aiTitle && (s.intakeTranscript || s.goTranscript),
    );
    if (needsSummary.length === 0) return;

    summaryBackfillRan.current = true;

    void (async () => {
      for (const session of needsSummary) {
        const summaries = await generateSessionSummaries(
          session.intakeTranscript,
          session.goTranscript,
          session.emotions,
          session.askTranscript,
        );
        if (!summaries?.title && !summaries?.takeaway) continue;
        await supabase
          .from('sessions')
          .update({ ai_title: summaries.title || null, ai_takeaway: summaries.takeaway || null })
          .eq('id', session.id);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id
              ? { ...s, aiTitle: summaries.title || undefined, aiTakeaway: summaries.takeaway || undefined }
              : s,
          ),
        );
      }
    })();
  }, [sessions]);

  /* ---- Navigation ---- */
  const currentPath = location.pathname;
  const showNav = loopScreen === 'idle' && ['/', '/history', '/saved', '/settings'].some(
    (p) => currentPath === p || (p === '/history' && currentPath.startsWith('/history/')),
  );
  const activeTab: NavTab =
    currentPath.startsWith('/history') ? 'history' :
    currentPath === '/saved' ? 'saved' :
    currentPath === '/settings' ? 'settings' : 'home';

  const handleNavigate = useCallback((tab: NavTab) => {
    setLoopScreen('idle');
    if (tab === 'home') navigate('/');
    else if (tab === 'history') navigate('/history');
    else if (tab === 'saved') navigate('/saved');
    else if (tab === 'settings') navigate('/settings');
  }, [navigate]);

  const handleViewSession = useCallback((session: Session) => {
    setSelectedSession(session);
    navigate(`/history/${session.id}`);
  }, [navigate]);

  /* ---- Loop flow ---- */
  const resetLoop = useCallback(() => {
    setStepIndex(0);
    setCurrentEmotions([]);
    setCurrentSensations([]);
    setTranscripts({});
    setCurrentUnderstandResponse(undefined);
    setCurrentInsight(undefined);
    setCurrentSavedLogId(null);
  }, []);

  const handleStart = useCallback(() => {
    resetLoop();
    setLoopScreen('loop');
  }, [resetLoop]);

  const handleStartFromSaved = useCallback((log: QuickLog) => {
    resetLoop();
    setCurrentSavedLogId(log.id);
    setTranscripts({ intake: log.note });
    setLoopScreen('loop');
  }, [resetLoop]);

  const handleSaveTranscript = useCallback((step: 'intake' | 'ask' | 'go', text: string) => {
    setTranscripts((prev) => ({ ...prev, [step]: text }));
  }, []);

  const handleNextStep = useCallback(() => {
    setStepIndex((s) => s + 1);
    window.scrollTo(0, 0);
  }, []);

  const handlePrevStep = useCallback(() => {
    setStepIndex((s) => Math.max(0, s - 1));
    window.scrollTo(0, 0);
  }, []);

  const handleComplete = useCallback(async (goTranscript: string) => {
    const newSession: Session = {
      id: `local-${Date.now()}`,
      timestamp: new Date(),
      emotions: [...currentEmotions],
      sensations: [...currentSensations],
      completed: true,
      intakeTranscript: transcripts.intake,
      understandResponse: currentUnderstandResponse,
      askTranscript: transcripts.ask,
      insight: currentInsight,
      goTranscript,
    };

    // Optimistically update UI
    setSessions((prev) => [newSession, ...prev]);
    setUnsnagCount((c) => c + 1);

    // Remove the saved log that was used to start this session
    const logId = currentSavedLogId;
    if (logId) {
      setQuickLogs((prev) => prev.filter((l) => l.id !== logId));
      setCurrentSavedLogId(null);
    }

    setLoopScreen('done');

    // Persist to Supabase
    if (user) {
      const { data, error } = await supabase.from('sessions').insert({
        user_id: user.id,
        emotions: currentEmotions,
        sensations: currentSensations,
        completed: true,
        intake_transcript: transcripts.intake ?? null,
        understand_response: currentUnderstandResponse ?? null,
        ask_transcript: transcripts.ask ?? null,
        insight: currentInsight ?? null,
        go_transcript: goTranscript,
      }).select().single();

      if (!error && data) {
        const saved = rowToSession(data);
        setSessions((prev) => [saved, ...prev.filter((s) => s.id !== newSession.id)]);

        // Generate AI title + takeaway in the background
        if (import.meta.env.VITE_MOCK_AI !== 'true') {
          void generateSessionSummaries(transcripts.intake, goTranscript, currentEmotions, transcripts.ask)
            .then(async (summaries) => {
              if (!summaries?.title && !summaries?.takeaway) return;
              await supabase
                .from('sessions')
                .update({ ai_title: summaries.title || null, ai_takeaway: summaries.takeaway || null })
                .eq('id', data.id);
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === data.id
                    ? { ...s, aiTitle: summaries.title || undefined, aiTakeaway: summaries.takeaway || undefined }
                    : s,
                ),
              );
            });
        }
      }

      // Delete the saved log from DB (logId already captured above)
      if (logId) {
        await supabase.from('quick_logs').delete().eq('id', logId);
      }
    }
  }, [user, currentEmotions, currentSensations, transcripts, currentUnderstandResponse, currentInsight, currentSavedLogId]);

  const handleToggleEmotion = useCallback((emotion: string) => {
    setCurrentEmotions((prev) => prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]);
  }, []);

  const handleToggleSensation = useCallback((sensation: string) => {
    setCurrentSensations((prev) => prev.includes(sensation) ? prev.filter((s) => s !== sensation) : [...prev, sensation]);
  }, []);

  const handleGoHome = useCallback(() => {
    setLoopScreen('idle');
    navigate('/');
  }, [navigate]);

  const handleDeleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (user) await supabase.from('sessions').delete().eq('id', id);
  }, [user]);

  const handleDeleteAllSessions = useCallback(async () => {
    setSessions([]);
    setUnsnagCount(0);
    if (user) await supabase.from('sessions').delete().eq('user_id', user.id);
  }, [user]);

  /* ---- Quick log ---- */
  const handleSaveQuickLog = useCallback(async (note: string) => {
    const optimistic: QuickLog = { id: `local-${Date.now()}`, timestamp: new Date(), note };
    setQuickLogs((prev) => [optimistic, ...prev]);

    if (user) {
      const { data, error } = await supabase.from('quick_logs').insert({
        user_id: user.id,
        note,
      }).select().single();

      if (!error && data) {
        setQuickLogs((prev) => [rowToQuickLog(data), ...prev.filter((l) => l.id !== optimistic.id)]);
      }
    }
  }, [user]);

  /* ---- Quick log delete ---- */
  const handleDeleteQuickLog = useCallback(async (id: string) => {
    setQuickLogs((prev) => prev.filter((l) => l.id !== id));
    if (user) await supabase.from('quick_logs').delete().eq('id', id);
  }, [user]);

  const handleDeleteAllQuickLogs = useCallback(async () => {
    setQuickLogs([]);
    if (user) await supabase.from('quick_logs').delete().eq('user_id', user.id);
  }, [user]);

  /* ---- Loading state ---- */
  if (user === undefined || (user && accessStatus === 'loading')) {
    return <div className="min-h-screen bg-cream" />;
  }

  /* ---- Unauthenticated routes ---- */
  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<AuthScreen initialMode="signin" />} />
        <Route path="/signup" element={<AuthScreen initialMode="signup" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  /* ---- Paywall ---- */
  if (accessStatus === 'expired') {
    return <PaywallScreen user={user} onAccessGranted={() => setAccessStatus('subscribed')} />;
  }

  /* ---- Authenticated app ---- */
  // Loop/done are overlay screens on top of "/" — not separate routes
  const renderLoopOverlay = () => {
    if (loopScreen === 'loop') {
      return (
        <motion.div key={`loop-${stepIndex}`} className="min-h-screen"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <LoopStep
            stepIndex={stepIndex}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            onGoHome={handleGoHome}
            emotions={currentEmotions}
            onToggleEmotion={handleToggleEmotion}
            sensations={currentSensations}
            onToggleSensation={handleToggleSensation}
            onSaveTranscript={handleSaveTranscript}
            transcripts={transcripts}
            onSaveUnderstandResponse={setCurrentUnderstandResponse}
            onSaveInsight={setCurrentInsight}
            onComplete={handleComplete}
            initialIntakeTranscript={transcripts.intake} />
        </motion.div>
      );
    }
    if (loopScreen === 'done') {
      return (
        <motion.div key="done" className="min-h-screen"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <CompletionScreen onRestart={handleStart} onGoHome={handleGoHome} unsnagCount={unsnagCount} />
        </motion.div>
      );
    }
    return null;
  };

  return (
    <main className="w-full min-h-full bg-cream font-body">
      <AnimatePresence mode="wait">
        {loopScreen !== 'idle' ? renderLoopOverlay() : (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div key="landing" className="min-h-screen pb-20"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <LandingScreen
                  onStart={showOnboarding ? () => {} : handleStart}
                  userName={user.user_metadata?.full_name?.split(' ')[0] ?? undefined}
                />
                {showOnboarding && (
                  <OnboardingTour
                    userName={user.user_metadata?.full_name?.split(' ')[0] ?? undefined}
                    onComplete={async () => {
                      localStorage.setItem(`onboarding-done-${user.id}`, '1'); // keep for backward compat
                      await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id);
                      setShowOnboarding(false);
                    }}
                  />
                )}
              </motion.div>
            } />

            <Route path="/history" element={
              <motion.div key="history" className="min-h-screen"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <HistoryPage
                  sessions={sessions}
                  onViewSession={handleViewSession}
                  onDeleteSession={handleDeleteSession}
                  onDeleteAllSessions={handleDeleteAllSessions}
                  onBack={handleGoHome}
                />
              </motion.div>
            } />

            <Route path="/history/:id" element={(() => {
              const session = selectedSession ?? sessions.find((s) => s.id === location.pathname.split('/').pop());
              if (!session) return <Navigate to="/history" replace />;
              return (
                <motion.div key="session-detail" className="min-h-screen"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <SessionDetailPage
                    session={session}
                    onBack={() => navigate('/history')}
                  />
                </motion.div>
              );
            })()} />

            <Route path="/saved" element={
              <motion.div key="saved" className="min-h-screen"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <SavedPage quickLogs={quickLogs} onStartFromSaved={handleStartFromSaved} onSave={handleSaveQuickLog} onDeleteQuickLog={handleDeleteQuickLog} onDeleteAllQuickLogs={handleDeleteAllQuickLogs} onBack={handleGoHome} />
              </motion.div>
            } />

            <Route path="/settings" element={
              <motion.div key="settings" className="min-h-screen"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <SettingsPage user={user} accessStatus={accessStatus} onBack={handleGoHome} />
              </motion.div>
            } />

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AnimatePresence>

      {showNav && <NavBar active={activeTab} onNavigate={showOnboarding ? () => {} : handleNavigate} />}
    </main>
  );
}
