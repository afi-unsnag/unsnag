import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingScreen } from './components/LandingScreen';
import { LoopStep } from './components/LoopStep';
import { CompletionScreen } from './components/CompletionScreen';
import { NavBar } from './components/NavBar';
import { QuickLogModal } from './components/QuickLogModal';
import { HistoryPage } from './pages/HistoryPage';
import { SavedPage } from './pages/SavedPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { SettingsPage } from './pages/SettingsPage';
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
}
interface QuickLog {
  id: string;
  timestamp: Date;
  note: string;
}
type NavTab = 'home' | 'history' | 'saved' | 'settings';
type AppScreen =
'landing' |
'loop' |
'done' |
'history' |
'saved' |
'session-detail' |
'settings';
/* ---- Mock seed data ---- */
const MOCK_SESSIONS: Session[] = [
{
  id: 'mock-1',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  emotions: ['anxious', 'overwhelmed'],
  sensations: ['tight chest', 'shallow breathing'],
  completed: true,
  intakeTranscript:
  "I have this huge presentation tomorrow and I haven't even finished the slides. I feel like everyone is going to realize I don't know what I'm talking about.",
  understandResponse:
  "Imposter syndrome hits hardest right before something actually matters. That fear isn't proof you're a fraud — it's proof you care.",
  askTranscript:
  "You're a fraud and they're all going to see it. You should just call in sick.",
  insight: {
    whatsYours: ['the unfinished slides', 'the spiral starting', 'caring about doing well'],
    whatsNotYours: ["what other people think", "their expectations of you", "whether they believe you"],
    affirmation: "Caring this much means it matters — that's not weakness."
  },
  goTranscript:
  "I'm going to finish just the next three slides tonight, and then go to sleep. That's enough for now."
},
{
  id: 'mock-2',
  timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
  emotions: ['frustrated', 'guilty'],
  sensations: ['clenched jaw', 'stomach knot'],
  completed: true,
  intakeTranscript:
  'I snapped at my partner again over something so stupid. I just feel so much pressure right now.',
  understandResponse:
  "Snapping isn't about them — it's what happens when you've been holding too much for too long. The pressure had to go somewhere.",
  askTranscript: "You're a terrible partner. You're pushing them away.",
  insight: {
    whatsYours: ['the snap', "the pressure you've been carrying", 'the guilt after'],
    whatsNotYours: ["their ability to handle your stress", "whether they'll stay"],
    affirmation: "Knowing you snapped means you're paying attention. That's the start."
  },
  goTranscript:
  "I'm going to go apologize right now and explain that I'm just stressed about work."
}];

const MOCK_QUICKLOGS: QuickLog[] = [
{
  id: 'qlog-1',
  timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  note: 'That call with Sarah felt off. She sounded distant and I immediately started spiraling about what I did wrong.'
}];

/* ---- App ---- */
export function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [stepIndex, setStepIndex] = useState(0);
  const [unsnagCount, setUnsnagCount] = useState(MOCK_SESSIONS.length);
  // Session data
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [quickLogs, setQuickLogs] = useState<QuickLog[]>(MOCK_QUICKLOGS);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  // Current session state
  const [currentEmotions, setCurrentEmotions] = useState<string[]>([]);
  const [currentSensations, setCurrentSensations] = useState<string[]>([]);
  const [transcripts, setTranscripts] = useState<{
    intake?: string;
    ask?: string;
    go?: string;
  }>({});
  const [currentUnderstandResponse, setCurrentUnderstandResponse] = useState<string | undefined>();
  const [currentInsight, setCurrentInsight] = useState<SessionInsight | undefined>();
  /* ---- Navigation ---- */
  const showNav =
  screen === 'landing' ||
  screen === 'history' ||
  screen === 'saved' ||
  screen === 'settings';
  const activeTab: NavTab =
  screen === 'history' || screen === 'session-detail' ?
  'history' :
  screen === 'saved' ?
  'saved' :
  screen === 'settings' ?
  'settings' :
  'home';
  const handleNavigate = useCallback((tab: NavTab) => {
    if (tab === 'home') setScreen('landing');else
    if (tab === 'history') setScreen('history');else
    if (tab === 'saved') setScreen('saved');else
    if (tab === 'settings') setScreen('settings');
  }, []);
  const handleViewSession = useCallback((session: Session) => {
    setSelectedSession(session);
    setScreen('session-detail');
  }, []);
  /* ---- Loop flow ---- */
const handleStart = useCallback(() => {
    setStepIndex(0);
    setCurrentEmotions([]);
    setCurrentSensations([]);
    setTranscripts({});
    setCurrentUnderstandResponse(undefined);
    setCurrentInsight(undefined);
    setScreen('loop');
  }, []);
  const handleStartFromSaved = useCallback((note: string) => {
    setStepIndex(0);
    setCurrentEmotions([]);
    setCurrentSensations([]);
    setTranscripts({
      intake: note
    });
    setCurrentUnderstandResponse(undefined);
    setCurrentInsight(undefined);
    setScreen('loop');
  }, []);
  const handleSaveTranscript = useCallback(
    (step: 'intake' | 'ask' | 'go', text: string) => {
      setTranscripts((prev) => ({
        ...prev,
        [step]: text
      }));
    },
    []
  );
  const handleNextStep = useCallback(() => {
    setStepIndex((s) => s + 1);
  }, []);

  const handleComplete = useCallback((goTranscript: string) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
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
    setSessions((prev) => [newSession, ...prev]);
    setUnsnagCount((c) => c + 1);
    setScreen('done');
  }, [currentEmotions, currentSensations, transcripts, currentUnderstandResponse, currentInsight]);
  const handleToggleEmotion = useCallback((emotion: string) => {
    setCurrentEmotions((prev) =>
    prev.includes(emotion) ?
    prev.filter((e) => e !== emotion) :
    [...prev, emotion]
    );
  }, []);
  const handleToggleSensation = useCallback((sensation: string) => {
    setCurrentSensations((prev) =>
    prev.includes(sensation) ?
    prev.filter((s) => s !== sensation) :
    [...prev, sensation]
    );
  }, []);
  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);
  const handleGoHome = useCallback(() => {
    setScreen('landing');
  }, []);
  /* ---- Quick log ---- */
  const handleSaveQuickLog = useCallback((note: string) => {
    const newLog: QuickLog = {
      id: `qlog-${Date.now()}`,
      timestamp: new Date(),
      note
    };
    setQuickLogs((prev) => [newLog, ...prev]);
  }, []);
  /* ---- Render ---- */
  return (
    <main className="w-full min-h-full bg-cream font-body">
      <AnimatePresence mode="wait">
        {screen === 'landing' &&
        <motion.div
          key="landing"
          className="min-h-screen pb-20"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0,
            y: -20
          }}
          transition={{
            duration: 0.3
          }}>
          
            <LandingScreen onStart={handleStart} />
          </motion.div>
        }

        {screen === 'loop' &&
        <motion.div
          key={`loop-${stepIndex}`}
          className="min-h-screen"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.2
          }}>
          
            <LoopStep
            stepIndex={stepIndex}
            onNext={handleNextStep}
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
        }

        {screen === 'done' &&
        <motion.div
          key="done"
          className="min-h-screen"
          initial={{
            opacity: 0,
            scale: 0.97
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.3
          }}>
          
            <CompletionScreen
            onRestart={handleRestart}
            onGoHome={handleGoHome}
            unsnagCount={unsnagCount} />
          
          </motion.div>
        }

        {screen === 'history' &&
        <motion.div
          key="history"
          className="min-h-screen"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.2
          }}>
          
            <HistoryPage
            sessions={sessions}
            onViewSession={handleViewSession} />
          
          </motion.div>
        }

        {screen === 'saved' &&
        <motion.div
          key="saved"
          className="min-h-screen"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.2
          }}>
          
            <SavedPage
            quickLogs={quickLogs}
            onStartFromSaved={(log) => handleStartFromSaved(log.note)} />
          </motion.div>
        }

        {screen === 'session-detail' && selectedSession &&
        <motion.div
          key="session-detail"
          className="min-h-screen"
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: -20
          }}
          transition={{
            duration: 0.2
          }}>
          
            <SessionDetailPage
            session={selectedSession}
            onBack={() => setScreen('history')} />
          
          </motion.div>
        }

        {screen === 'settings' &&
        <motion.div
          key="settings"
          className="min-h-screen"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: 0.2
          }}>
          
            <SettingsPage />
          </motion.div>
        }
      </AnimatePresence>

      {/* Quick log FAB — only on landing */}
      {screen === 'landing' && <QuickLogModal onSave={handleSaveQuickLog} />}

      {/* Bottom nav — only on non-loop screens */}
      {showNav && <NavBar active={activeTab} onNavigate={handleNavigate} />}
    </main>);

}