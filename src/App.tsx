import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_QUOTES, SCROLL_QUOTES, type Quote } from './quotes';
import { trackEvent } from './services/analytics';
import { AdminDashboard } from './admin/AdminDashboard';

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash.startsWith('#/admin/') ||
    hash === '#admin'
  );
}

// -------------------------------------------------------------
// 1. Initial Quote Screen (Unchanged)
// -------------------------------------------------------------
function InitialQuoteScreen({ onContinue }: { onContinue: () => void }) {
  const [quote] = useState<Quote>(() => {
    const randomIndex = Math.floor(Math.random() * INITIAL_QUOTES.length);
    return INITIAL_QUOTES[randomIndex];
  });
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContinue(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="screen">
      <div className="quote-container">
        <p className="quote-text">"{quote.text}"</p>
        <p className="quote-author">— {quote.author}</p>

        <div className={`continue-wrapper ${showContinue ? 'visible' : ''}`}>
          <button
            type="button"
            className="continue-text"
            onClick={onContinue}
            aria-label="Continue to mindset message"
          >
            continue →
          </button>
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 2. Opening Mindset Message Screen
// -------------------------------------------------------------
function MindsetMessageScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="screen">
      <div className="mindset-container">
        <h1 className="mindset-title">
          It has always been about your mindset.
        </h1>

        <div className="mindset-body">
          <p className="mindset-stanza">
            I can help you pause.<br />
            I can help you find your way back to what matters.<br />
            I can help you take that first step.
          </p>

          <p className="mindset-stanza">
            But the choice to change, to focus, and to keep going—<br />
            <strong className="mindset-accent">that has always been yours.</strong>
          </p>

          <p className="mindset-stanza">
            I can help you start.
          </p>

          <p className="mindset-final">
            You take it from there.
          </p>
        </div>

        <button
          type="button"
          className="mindset-continue-btn"
          onClick={onContinue}
          aria-label="Continue to notification reminder"
        >
          Continue →
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 3. Pre-Scroll Notification Reminder Screen
// -------------------------------------------------------------
function NotificationReminderScreen({ onReady }: { onReady: () => void }) {
  return (
    <main className="screen">
      <div className="reminder-container">
        <h1 className="reminder-header">Before we start.</h1>
        <p className="reminder-body">
          Turn off your notifications or put your phone on silent.
        </p>
        <p className="reminder-subbody">
          Give yourself 30 seconds without interruptions.
        </p>
        <button
          type="button"
          className="reminder-btn"
          onClick={onReady}
          aria-label="I'm ready to scroll"
        >
          I'm ready →
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 3. Upward-Only Scroll Challenge Screen
// -------------------------------------------------------------
const SECTION_TITLES = [
  'Scroll down.',
  'Keep going.',
  'Almost there.',
  'Stay with it.',
  'Don’t stop.',
  'Keep scrolling.',
  'Breathe.',
  'Stay present.',
  'Keep going.',
  'Almost there.',
  'Stay with it.',
  'Nearly done.',
];

function getSectionTitle(index: number) {
  if (index === 0) return SECTION_TITLES[0];
  const cycle = SECTION_TITLES.slice(1);
  return cycle[(index - 1) % cycle.length];
}

function ScrollChallengeScreen({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [isWarning, setIsWarning] = useState(false);

  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const activeMsRef = useRef(0);
  const lastActiveTimeRef = useRef(0);
  const hasStartedRef = useRef(false);
  const mountTimeRef = useRef(0);
  const completedRef = useRef(false);

  const advanceSection = useCallback(() => {
    if (completedRef.current || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setIsWarning(false);
    lastActiveTimeRef.current = Date.now();
    hasStartedRef.current = true;

    setDragY(-window.innerHeight);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDragY(0);
      currentDragYRef.current = 0;
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, 340);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioningRef.current || completedRef.current) return;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
    lastActiveTimeRef.current = Date.now();
    hasStartedRef.current = true;
    setIsWarning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isTransitioningRef.current || completedRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff <= 0) {
      currentDragYRef.current = diff;
      setDragY(diff);
      lastActiveTimeRef.current = Date.now();
      setIsWarning(false);
    } else {
      currentDragYRef.current = 0;
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || isTransitioningRef.current || completedRef.current) return;
    isDraggingRef.current = false;

    if (currentDragYRef.current < -45) {
      advanceSection();
    } else {
      setDragY(0);
      currentDragYRef.current = 0;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTransitioningRef.current || completedRef.current) return;
    startYRef.current = e.clientY;
    isDraggingRef.current = true;
    lastActiveTimeRef.current = Date.now();
    hasStartedRef.current = true;
    setIsWarning(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isTransitioningRef.current || completedRef.current) return;
    const diff = e.clientY - startYRef.current;
    if (diff <= 0) {
      currentDragYRef.current = diff;
      setDragY(diff);
      lastActiveTimeRef.current = Date.now();
      setIsWarning(false);
    } else {
      currentDragYRef.current = 0;
      setDragY(0);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current || isTransitioningRef.current || completedRef.current) return;
    isDraggingRef.current = false;
    if (currentDragYRef.current < -45) {
      advanceSection();
    } else {
      setDragY(0);
      currentDragYRef.current = 0;
    }
  };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 10) {
        advanceSection();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        advanceSection();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [advanceSection]);

  useEffect(() => {
    const TICK_MS = 100;
    mountTimeRef.current = Date.now();

    const interval = setInterval(() => {
      if (completedRef.current) return;

      const now = Date.now();

      if (hasStartedRef.current) {
        const timeSinceActive = now - lastActiveTimeRef.current;

        if (timeSinceActive < 700 || isTransitioningRef.current) {
          activeMsRef.current += TICK_MS;
          const left = Math.max(0, 30 - Math.floor(activeMsRef.current / 1000));
          setRemainingSeconds(left);
          setIsWarning(false);

          if (activeMsRef.current >= 30000) {
            completedRef.current = true;
            clearInterval(interval);
            onComplete();
            return;
          }
        } else if (timeSinceActive >= 1000) {
          setIsWarning(true);
        }
      } else {
        if (now - mountTimeRef.current >= 1000) {
          setIsWarning(true);
        }
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [onComplete]);

  const currentTitle = getSectionTitle(currentIndex);
  const nextTitle = getSectionTitle(currentIndex + 1);

  const currentTransform = `translateY(${dragY}px)`;
  const nextTransform = `translateY(calc(100% + ${dragY}px))`;
  const transitionStyle = isTransitioning
    ? 'transform 340ms cubic-bezier(0.2, 0.9, 0.4, 1)'
    : 'none';

  return (
    <div
      className="reels-feed-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="reel-section current-reel"
        style={{
          transform: currentTransform,
          transition: transitionStyle,
        }}
      >
        <div className="scroll-center-stack">
          <p className="scroll-title">{currentTitle}</p>

          <div className="scroll-timer-block" aria-hidden="true">
            <span className="scroll-timer-number">{remainingSeconds}</span>
            <span className="scroll-timer-unit">SECONDS</span>
          </div>

          <div className="scroll-down-animation" aria-hidden="true">
            <div className="scroll-track-indicator">
              <div className="scroll-track-pill" />
            </div>
          </div>
        </div>
      </div>

      <div
        className="reel-section next-reel"
        style={{
          transform: nextTransform,
          transition: transitionStyle,
        }}
      >
        <div className="scroll-center-stack">
          <p className="scroll-title">{nextTitle}</p>

          <div className="scroll-timer-block" aria-hidden="true">
            <span className="scroll-timer-number">{remainingSeconds}</span>
            <span className="scroll-timer-unit">SECONDS</span>
          </div>

          <div className="scroll-down-animation" aria-hidden="true">
            <div className="scroll-track-indicator">
              <div className="scroll-track-pill" />
            </div>
          </div>
        </div>
      </div>

      {isWarning && (
        <div className="scroll-warning-overlay" role="alert">
          <div className="scroll-warning-inner">
            <p className="warning-title">Keep scrolling.</p>
            <p className="warning-subtitle">Don’t stop yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Post-Scroll Quote Screen (~4 seconds)
// -------------------------------------------------------------
function PostScrollQuoteScreen({ onComplete }: { onComplete: () => void }) {
  const [quote] = useState<Quote>(() => {
    const randomIndex = Math.floor(Math.random() * SCROLL_QUOTES.length);
    return SCROLL_QUOTES[randomIndex];
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="screen">
      <div className="quote-container">
        <p className="quote-text">"{quote.text}"</p>
        <p className="quote-author">{quote.author}</p>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 4. Goal Input Screen
// -------------------------------------------------------------
function GoalInputScreen({
  onGoalSubmitted,
}: {
  onGoalSubmitted: (goal: string) => void;
}) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (goal.trim().length > 0) {
      onGoalSubmitted(goal.trim());
    }
  };

  return (
    <main className="screen">
      <form className="flow-container" onSubmit={handleSubmit}>
        <h1 className="flow-title">What did you come here to do?</h1>
        <input
          type="text"
          className="flow-input"
          placeholder="Type your goal..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          autoFocus
        />
        {goal.trim().length > 0 && (
          <button type="submit" className="flow-action-btn">
            Continue →
          </button>
        )}
      </form>
    </main>
  );
}

// -------------------------------------------------------------
// 5. Read Goal 3 Times Screen
// -------------------------------------------------------------
function ReadGoalScreen({
  goal,
  onComplete,
}: {
  goal: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <main className="screen">
      <div className="flow-container">
        <p className="flow-title" style={{ marginBottom: 12 }}>
          Read this slowly.
        </p>
        <div className="goal-display-box">{goal}</div>
        <div className="counter-step-text">{step} / 3</div>
        <button
          type="button"
          className="read-goal-btn"
          onClick={handleNext}
          aria-label="I read it"
        >
          <span>I read it</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 6. Brain Reset Menu Screen
// -------------------------------------------------------------
type ResetExercise = 'breathe' | 'focus' | 'numberHunt' | 'urgeSurfing';

function BrainResetMenuScreen({
  onSelectExercise,
  onReady,
}: {
  onSelectExercise: (exercise: ResetExercise) => void;
  onReady: () => void;
}) {
  return (
    <main className="screen">
      <div className="flow-container">
        <h1 className="flow-title" style={{ marginBottom: 10 }}>
          BRAIN RESET
        </h1>
        <p className="reset-menu-subtitle">
          Choose one short reset. Then go do your goal.
        </p>

        <div className="reset-options-list">
          <button
            type="button"
            className="reset-option-item reset-featured-item"
            onClick={() => onSelectExercise('urgeSurfing')}
          >
            <span className="reset-featured-title">Urge Surfing</span>
            <span className="reset-featured-desc">
              Notice the urge to scroll without acting on it.
            </span>
          </button>
          <button
            type="button"
            className="reset-option-item"
            onClick={() => onSelectExercise('breathe')}
          >
            Breathe
          </button>
          <button
            type="button"
            className="reset-option-item"
            onClick={() => onSelectExercise('focus')}
          >
            Focus
          </button>
          <button
            type="button"
            className="reset-option-item"
            onClick={() => onSelectExercise('numberHunt')}
          >
            Number Hunt
          </button>
          <button
            type="button"
            className="reset-option-item ready-button"
            onClick={onReady}
          >
            I'M READY
          </button>
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 7. Exercise: Breathe
// -------------------------------------------------------------
function BreatheExerciseScreen({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [durationMinutes, setDurationMinutes] = useState<1 | 3 | 5>(1);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseSec, setPhaseSec] = useState(4);
  const [isCompleted, setIsCompleted] = useState(false);

  const changeDuration = (min: 1 | 3 | 5) => {
    setDurationMinutes(min);
    setSecondsLeft(min * 60);
    setPhase('inhale');
    setPhaseSec(4);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsCompleted(true);
          trackEvent('breathe_completed');
          return 0;
        }
        return prev - 1;
      });

      setPhaseSec((prev) => {
        if (prev > 1) return prev - 1;

        setPhase((currentPhase) => {
          if (currentPhase === 'inhale') {
            return 'hold';
          }
          if (currentPhase === 'hold') {
            return 'exhale';
          }
          return 'inhale';
        });

        if (phase === 'inhale') return 2;
        if (phase === 'hold') return 6;
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, phase]);

  const formatRemaining = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="screen">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
        aria-label="Exit breathe exercise"
      >
        ← Back
      </button>

      <div className="flow-container">
        <div className="breathe-tabs">
          <button
            type="button"
            className={`breathe-tab-btn ${durationMinutes === 1 ? 'active' : ''}`}
            onClick={() => changeDuration(1)}
          >
            1 minute
          </button>
          <button
            type="button"
            className={`breathe-tab-btn ${durationMinutes === 3 ? 'active' : ''}`}
            onClick={() => changeDuration(3)}
          >
            3 minutes
          </button>
          <button
            type="button"
            className={`breathe-tab-btn ${durationMinutes === 5 ? 'active' : ''}`}
            onClick={() => changeDuration(5)}
          >
            5 minutes
          </button>
        </div>

        <div className="breathe-visual-wrapper">
          <div className={`breathe-circle ${phase}`} />
          <div style={{ zIndex: 2, textAlign: 'center' }}>
            <p className="breathe-phase-title">{phase.toUpperCase()}</p>
            <p className="breathe-phase-sec">{phaseSec}s</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#888888', marginBottom: 16 }}>
          {formatRemaining(secondsLeft)} remaining
        </p>

        <button type="button" className="flow-action-btn" onClick={onDone}>
          {isCompleted ? 'DONE' : 'Done'}
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 8. Exercise: Focus
// -------------------------------------------------------------
function FocusExerciseScreen({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          trackEvent('focus_completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="screen">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
        aria-label="Exit focus exercise"
      >
        ← Back
      </button>

      <div className="flow-container">
        <p className="flow-title" style={{ marginBottom: 0 }}>
          Look at the dot. Don't look away.
        </p>
        <div className="focus-dot" />
        <div className="timer-countdown-text">{secondsLeft}</div>
        <button
          type="button"
          className="flow-action-btn"
          onClick={onDone}
          style={{ marginTop: 24 }}
        >
          {secondsLeft === 0 ? 'DONE' : 'Done'}
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 9. Exercise: Number Hunt (Card Memory Game)
// -------------------------------------------------------------
function shuffleNumbers(): number[] {
  const arr = Array.from({ length: 10 }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function NumberHuntScreen({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');

  const [cards] = useState<number[]>(() => shuffleNumbers());

  const [target, setTarget] = useState(1);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!timerStarted || gameState === 'completed') return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const ms = Date.now() - startTimeRef.current;
      setElapsedTime(ms / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [timerStarted, gameState]);

  const handleCardTap = (index: number) => {
    if (gameState !== 'playing' || isLocked) return;

    if (revealedIndices.includes(index)) return;

    if (!timerStarted) {
      setTimerStarted(true);
    }

    const cardValue = cards[index];

    if (cardValue === target) {
      const newRevealed = [...revealedIndices, index];
      setRevealedIndices(newRevealed);

      if (target === 10) {
        setGameState('completed');
        trackEvent('number_hunt_completed');
      } else {
        setTarget((prev) => prev + 1);
      }
    } else {
      setIsLocked(true);
      setWrongIndex(index);
      setMistakes((prev) => prev + 1);

      setTimeout(() => {
        setTarget(1);
        setRevealedIndices([]);
        setWrongIndex(null);
        setIsLocked(false);
      }, 650);
    }
  };

  return (
    <main className="screen">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
        aria-label="Exit number hunt"
      >
        ← Back
      </button>

      {gameState === 'playing' && (
        <div className="hunt-playing-container">
          <div className="hunt-top-bar">
            <div className="hunt-target-label">
              {wrongIndex !== null ? (
                <span className="hunt-wrong-indicator">Wrong</span>
              ) : (
                <span>Find {target}</span>
              )}
            </div>
            <div className="hunt-stats-display">
              <span>Time: {elapsedTime.toFixed(1)}s</span>
              <span>Mistakes: {mistakes}</span>
            </div>
          </div>

          <div className="hunt-cards-grid">
            {cards.map((value, index) => {
              const isFound = revealedIndices.includes(index);
              const isWrong = wrongIndex === index;
              const isRevealed = isFound || isWrong;

              return (
                <button
                  key={index}
                  type="button"
                  className={`hunt-card-btn ${isFound ? 'found' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleCardTap(index)}
                  aria-label={`Card ${index + 1}`}
                >
                  {isRevealed ? value : '?'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flow-container">
          <h1 className="hunt-complete-title">Done.</h1>
          <div className="hunt-complete-stats">
            <p>Time: {elapsedTime.toFixed(1)}s</p>
            <p>Mistakes: {mistakes}</p>
          </div>
          <button type="button" className="flow-action-btn" onClick={onDone}>
            DONE
          </button>
        </div>
      )}
    </main>
  );
}

// -------------------------------------------------------------
// 10. Exercise: Urge Surfing (60-Second Mindfulness Wave)
// -------------------------------------------------------------
function getWavePath(elapsedSeconds: number): string {
  const t = Math.min(60, Math.max(0, elapsedSeconds));

  let envelope = 0;
  if (t <= 28) {
    const s = t / 28;
    envelope = Math.sin((Math.PI / 2) * s) ** 2;
  } else if (t <= 36) {
    envelope = 1.0;
  } else if (t <= 54) {
    const s = (t - 36) / 18;
    envelope = Math.cos((Math.PI / 2) * s) ** 2;
  } else {
    envelope = 0;
  }

  const width = 340;
  const baselineY = 90;
  const maxAmplitude = 50;
  const currentAmp = envelope * maxAmplitude;

  const pointsCount = 68;
  const points: [number, number][] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const x = (i / pointsCount) * width;
    const u = i / pointsCount;
    // Asymmetric wave crest profile
    const profile = (Math.sin(Math.PI * u) ** 2) * (1 + 0.28 * Math.sin(2 * Math.PI * u));
    const y = baselineY - currentAmp * (profile / 1.08);
    points.push([x, y]);
  }

  return `M ${points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L ')}`;
}

function getGuidance(t: number): { key: string; line1: string; line2?: string } {
  if (t < 7) {
    return { key: '1', line1: 'Notice the urge to scroll.' };
  }
  if (t < 14) {
    return { key: '2', line1: "Don't fight it." };
  }
  if (t < 21) {
    return { key: '3', line1: 'Just watch it rise.' };
  }
  if (t < 28) {
    return { key: '4', line1: 'Let the feeling be there.' };
  }
  if (t < 36) {
    return { key: '5', line1: "You don't have to act on it." };
  }
  if (t < 43) {
    return { key: '6', line1: 'Watch it change.' };
  }
  if (t < 51) {
    return { key: '7', line1: 'The urge can pass without you acting on it.' };
  }
  if (t < 56) {
    return { key: '8', line1: 'It came.' };
  }
  return { key: '9', line1: 'It came.', line2: "And now it's passing." };
}

function UrgeSurfingScreen({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [stage, setStage] = useState<'start' | 'active' | 'final'>('start');
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== 'active') return;

    startRef.current = performance.now();

    const tick = (now: number) => {
      const diffSec = (now - (startRef.current ?? now)) / 1000;
      if (diffSec >= 60) {
        setElapsed(60);
        setStage('final');
        trackEvent('urge_surfing_completed');
      } else {
        setElapsed(diffSec);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stage]);

  const remainingSeconds = Math.max(0, Math.ceil(60 - elapsed));
  const guidance = getGuidance(elapsed);

  if (stage === 'start') {
    return (
      <main className="screen">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label="Exit urge surfing"
        >
          ← Back
        </button>

        <div className="flow-container">
          <h1 className="flow-title" style={{ marginBottom: 16 }}>
            Urge Surfing
          </h1>
          <p className="urge-text">Notice the urge to scroll.</p>
          <p className="urge-text" style={{ marginTop: 8 }}>
            You don't have to act on it.
          </p>
          <button
            type="button"
            className="flow-action-btn"
            onClick={() => setStage('active')}
          >
            START
          </button>
        </div>
      </main>
    );
  }

  if (stage === 'active') {
    return (
      <main className="screen">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label="Exit urge surfing"
        >
          ← Back
        </button>

        <div className="flow-container">
          <div key={guidance.key} className="urge-guidance-box">
            <p className="urge-guidance-line">{guidance.line1}</p>
            {guidance.line2 && (
              <p className="urge-guidance-line" style={{ marginTop: 6 }}>
                {guidance.line2}
              </p>
            )}
          </div>

          <div className="urge-wave-wrapper">
            <svg
              viewBox="0 0 340 140"
              className="urge-wave-svg"
              aria-hidden="true"
            >
              <path
                d={getWavePath(elapsed)}
                fill="none"
                stroke="#111111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="urge-timer-subtle">{remainingSeconds}s</div>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="flow-container">
        <h1 className="flow-title" style={{ marginBottom: 14 }}>
          The urge doesn't control you.
        </h1>
        <p className="urge-text">You can choose what happens next.</p>
        <button
          type="button"
          className="flow-action-btn"
          onClick={onDone}
          aria-label="Done"
        >
          <span>DONE →</span>
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// 11. Final Commitment Check Screen
// -------------------------------------------------------------
const COMMITMENT_QUESTIONS = [
  'Are you ready to put your phone down and start?',
  'Are you willing to give your full attention to this one thing?',
  'Are you ready to stop scrolling now?',
  'Will you start your task immediately?',
  'Are you ready to spend the next few minutes doing, not scrolling?',
  'Can you leave this screen and begin?',
  'Are you choosing your goal over another scroll?',
  'Are you ready to focus on what actually matters right now?',
  'Will you give your attention to the thing you came here for?',
  'Are you ready?',
];

const EXIT_MESSAGES = [
  'Good.',
  'You know what you came here to do.',
  'Now go do it.',
  'Put the phone down.',
  'Go.',
];

type CommitmentStage =
  | 'question'
  | 'noPause1'
  | 'noPause2'
  | 'noQuestion'
  | 'exitSequence'
  | 'sessionEnded';

function FinalCommitmentScreen({
  usedQuestionIndices,
  onQuestionUsed,
}: {
  usedQuestionIndices: number[];
  onQuestionUsed: (idx: number) => void;
}) {
  const [stage, setStage] = useState<CommitmentStage>('question');
  const [exitStep, setExitStep] = useState(0);

  // Pick random question from unused pool
  const [questionIndex] = useState<number>(() => {
    const unasked = COMMITMENT_QUESTIONS.map((_, i) => i).filter(
      (i) => !usedQuestionIndices.includes(i),
    );
    const pool = unasked.length > 0 ? unasked : COMMITMENT_QUESTIONS.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  });

  useEffect(() => {
    onQuestionUsed(questionIndex);
  }, [questionIndex, onQuestionUsed]);

  // Handle NO branch sequence: That's okay -> Take one breath -> Are you sure question
  useEffect(() => {
    if (stage === 'noPause1') {
      const timer = setTimeout(() => {
        setStage('noPause2');
      }, 1800);
      return () => clearTimeout(timer);
    }
    if (stage === 'noPause2') {
      const timer = setTimeout(() => {
        setStage('noQuestion');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Handle Final Exit Sequence: Good -> You know... -> Now go... -> Put the phone... -> Go -> End
  useEffect(() => {
    if (stage !== 'exitSequence') return;

    let delay = 2200;
    if (exitStep === 0) delay = 1800;
    if (exitStep === 4) delay = 3500;

    const timer = setTimeout(() => {
      if (exitStep < 4) {
        setExitStep((prev) => prev + 1);
        if (exitStep + 1 === 4) {
          trackEvent('session_completed');
        }
      } else {
        setStage('sessionEnded');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [stage, exitStep]);

  if (stage === 'sessionEnded') {
    return <main className="screen" />;
  }

  return (
    <main className="screen">
      {stage === 'question' && (
        <div className="commitment-container">
          <h1 className="commitment-question">
            {COMMITMENT_QUESTIONS[questionIndex]}
          </h1>
          <div className="commitment-buttons-row">
            <button
              type="button"
              className="commitment-btn"
              onClick={() => {
                trackEvent('commitment_yes');
                setExitStep(0);
                setStage('exitSequence');
              }}
            >
              YES
            </button>
            <button
              type="button"
              className="commitment-btn"
              onClick={() => {
                trackEvent('commitment_no');
                setStage('noPause1');
              }}
            >
              NO
            </button>
          </div>
        </div>
      )}

      {stage === 'noPause1' && (
        <div className="commitment-container" key="noPause1">
          <p className="commitment-text-prompt">That's okay.</p>
        </div>
      )}

      {stage === 'noPause2' && (
        <div className="commitment-container" key="noPause2">
          <p className="commitment-text-prompt">Take one breath.</p>
        </div>
      )}

      {stage === 'noQuestion' && (
        <div className="commitment-container" key="noQuestion">
          <h1 className="commitment-question">
            Are you sure you want to keep scrolling?
          </h1>
          <div className="commitment-buttons-col">
            <button
              type="button"
              className="commitment-choice-btn"
              onClick={() => {
                trackEvent('commitment_no');
                setStage('sessionEnded');
              }}
            >
              YES, I'LL KEEP SCROLLING
            </button>
            <button
              type="button"
              className="commitment-choice-btn"
              onClick={() => {
                trackEvent('commitment_yes');
                setExitStep(0);
                setStage('exitSequence');
              }}
            >
              NO, I'M READY
            </button>
          </div>
        </div>
      )}

      {stage === 'exitSequence' && (
        <div className="commitment-container" key={`exit-${exitStep}`}>
          {exitStep === 4 ? (
            <h1 className="final-line-go">Go.</h1>
          ) : (
            <p className="final-line active">{EXIT_MESSAGES[exitStep]}</p>
          )}
        </div>
      )}
    </main>
  );
}

// -------------------------------------------------------------
// Master App Controller
// -------------------------------------------------------------
type AppScreen =
  | 'initialQuote'
  | 'mindsetMessage'
  | 'notificationReminder'
  | 'scrollChallenge'
  | 'postScrollPause'
  | 'postScrollQuote'
  | 'goalInput'
  | 'readGoal'
  | 'brainResetMenu'
  | 'exerciseBreathe'
  | 'exerciseFocus'
  | 'exerciseNumberHunt'
  | 'exerciseUrgeSurfing'
  | 'finalCommitment';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => isAdminPath());
  const [screen, setScreen] = useState<AppScreen>('initialQuote');
  const [userGoal, setUserGoal] = useState('');
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);

  // Listen to browser navigation changes
  useEffect(() => {
    const checkRoute = () => {
      setIsAdminRoute(isAdminPath());
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // Track page_visit for public visitors
  useEffect(() => {
    if (!isAdminRoute) {
      trackEvent('page_visit');
    }
  }, [isAdminRoute]);

  // 1. Initial quote -> Mindset Message
  const handleInitialContinue = () => {
    trackEvent('session_started');
    setScreen('mindsetMessage');
  };

  // 2. Mindset Message -> Notification Reminder
  const handleMindsetContinue = () => {
    setScreen('notificationReminder');
  };

  // 3. Notification Reminder -> Scroll Challenge
  const handleReminderReady = () => {
    trackEvent('scroll_started');
    setScreen('scrollChallenge');
  };

  // 4. Scroll Challenge completes 30s active scroll -> 500ms pause
  const handleScrollComplete = () => {
    trackEvent('scroll_completed');
    setScreen('postScrollPause');
  };

  // 5. Pause 500ms -> Post-scroll Quote
  useEffect(() => {
    if (screen === 'postScrollPause') {
      const timer = setTimeout(() => {
        setScreen('postScrollQuote');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // 6. Post-scroll Quote (~4s) -> Goal Input
  const handleQuoteComplete = () => {
    setScreen('goalInput');
  };

  // 7. Goal Input -> Read Goal 3 times
  const handleGoalSubmitted = (goal: string) => {
    trackEvent('goal_entered');
    setUserGoal(goal);
    setScreen('readGoal');
  };

  // 8. Read Goal confirmed 3 times -> Brain Reset Menu
  const handleReadGoalComplete = () => {
    trackEvent('brain_reset_opened');
    setScreen('brainResetMenu');
  };

  // 9. Brain Reset menu handlers
  const handleSelectExercise = (exercise: ResetExercise) => {
    if (exercise === 'breathe') {
      trackEvent('breathe_started');
      setScreen('exerciseBreathe');
    }
    if (exercise === 'focus') {
      trackEvent('focus_started');
      setScreen('exerciseFocus');
    }
    if (exercise === 'numberHunt') {
      trackEvent('number_hunt_started');
      setScreen('exerciseNumberHunt');
    }
    if (exercise === 'urgeSurfing') {
      trackEvent('urge_surfing_started');
      setScreen('exerciseUrgeSurfing');
    }
  };

  const handleReturnToResetMenu = () => {
    setScreen('brainResetMenu');
  };

  // 10. Brain Reset completed -> Final Commitment Check
  const handleReady = () => {
    setScreen('finalCommitment');
  };

  const handleQuestionUsed = useCallback((idx: number) => {
    setUsedQuestionIndices((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }, []);

  if (isAdminRoute) {
    return (
      <AdminDashboard
        onNavigateHome={() => {
          if (
            window.location.hash.startsWith('#/admin') ||
            window.location.hash === '#admin'
          ) {
            window.location.hash = '';
          } else {
            window.history.pushState({}, '', '/');
          }
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // Rendering screen routing
  switch (screen) {
    case 'initialQuote':
      return <InitialQuoteScreen onContinue={handleInitialContinue} />;

    case 'mindsetMessage':
      return <MindsetMessageScreen onContinue={handleMindsetContinue} />;

    case 'notificationReminder':
      return <NotificationReminderScreen onReady={handleReminderReady} />;

    case 'scrollChallenge':
      return <ScrollChallengeScreen onComplete={handleScrollComplete} />;

    case 'postScrollPause':
      return <main className="screen" />;

    case 'postScrollQuote':
      return <PostScrollQuoteScreen onComplete={handleQuoteComplete} />;

    case 'goalInput':
      return <GoalInputScreen onGoalSubmitted={handleGoalSubmitted} />;

    case 'readGoal':
      return (
        <ReadGoalScreen
          goal={userGoal}
          onComplete={handleReadGoalComplete}
        />
      );

    case 'brainResetMenu':
      return (
        <BrainResetMenuScreen
          onSelectExercise={handleSelectExercise}
          onReady={handleReady}
        />
      );

    case 'exerciseBreathe':
      return (
        <BreatheExerciseScreen
          onDone={handleReturnToResetMenu}
          onBack={handleReturnToResetMenu}
        />
      );

    case 'exerciseFocus':
      return (
        <FocusExerciseScreen
          onDone={handleReturnToResetMenu}
          onBack={handleReturnToResetMenu}
        />
      );

    case 'exerciseNumberHunt':
      return (
        <NumberHuntScreen
          onDone={handleReturnToResetMenu}
          onBack={handleReturnToResetMenu}
        />
      );

    case 'exerciseUrgeSurfing':
      return (
        <UrgeSurfingScreen
          onDone={handleReturnToResetMenu}
          onBack={handleReturnToResetMenu}
        />
      );

    case 'finalCommitment':
      return (
        <FinalCommitmentScreen
          usedQuestionIndices={usedQuestionIndices}
          onQuestionUsed={handleQuestionUsed}
        />
      );

    default:
      return <InitialQuoteScreen onContinue={handleInitialContinue} />;
  }
}
