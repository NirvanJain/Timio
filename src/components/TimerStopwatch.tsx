import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  mode: 'stopwatch' | 'timer';
}

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, '0');
}

export default function TimerStopwatch({ mode }: Props) {
  /* ── Stopwatch state ── */
  const [swElapsed, setSwElapsed] = useState(0); // ms
  const [swRunning, setSwRunning] = useState(false);
  const swStart = useRef(0);
  const swRaf = useRef<number | null>(null);

  /* ── Timer state ── */
  const [timerTarget, setTimerTarget] = useState(0); // ms (what the user sets)
  const [timerRemaining, setTimerRemaining] = useState(0); // ms
  const [timerRunning, setTimerRunning] = useState(false);
  const timerEnd = useRef(0);
  const timerRaf = useRef<number | null>(null);

  /* ──────────────── Stopwatch loop ──────────────── */
  const tickSw = useCallback(() => {
    setSwElapsed(performance.now() - swStart.current);
    swRaf.current = requestAnimationFrame(tickSw);
  }, []);

  const startSw = () => {
    swStart.current = performance.now() - swElapsed;
    setSwRunning(true);
    swRaf.current = requestAnimationFrame(tickSw);
  };

  const stopSw = () => {
    setSwRunning(false);
    if (swRaf.current !== null) cancelAnimationFrame(swRaf.current);
  };

  const resetSw = () => {
    stopSw();
    setSwElapsed(0);
  };

  /* ──────────────── Timer loop ──────────────── */
  const tickTimer = useCallback(() => {
    const left = timerEnd.current - performance.now();
    if (left <= 0) {
      setTimerRemaining(0);
      setTimerRunning(false);
      return;
    }
    setTimerRemaining(left);
    timerRaf.current = requestAnimationFrame(tickTimer);
  }, []);

  const startTimer = () => {
    if (timerRemaining <= 0 && timerTarget <= 0) return;
    const remaining = timerRemaining > 0 ? timerRemaining : timerTarget;
    timerEnd.current = performance.now() + remaining;
    setTimerRunning(true);
    timerRaf.current = requestAnimationFrame(tickTimer);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    if (timerRaf.current !== null) cancelAnimationFrame(timerRaf.current);
  };

  const resetTimer = () => {
    stopTimer();
    setTimerRemaining(timerTarget);
  };

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (swRaf.current !== null) cancelAnimationFrame(swRaf.current);
      if (timerRaf.current !== null) cancelAnimationFrame(timerRaf.current);
    };
  }, []);

  /* ──────────────── Helpers ──────────────── */
  const msToDisplay = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const cs = Math.floor((ms % 1000) / 10); // centiseconds
    return { h, m, s, cs };
  };

  const adjustTimer = (field: 'h' | 'm' | 's', delta: number) => {
    if (timerRunning) return;
    setTimerTarget((prev) => {
      const { h, m, s } = msToDisplay(prev);
      let nh = h,
        nm = m,
        ns = s;
      if (field === 'h') nh = Math.max(0, Math.min(99, h + delta));
      if (field === 'm') nm = Math.max(0, Math.min(59, m + delta));
      if (field === 's') ns = Math.max(0, Math.min(59, s + delta));
      const newMs = (nh * 3600 + nm * 60 + ns) * 1000;
      setTimerRemaining(newMs);
      return newMs;
    });
  };

  /* ──────────────── Render ──────────────── */
  if (mode === 'stopwatch') {
    const { h, m, s, cs } = msToDisplay(swElapsed);

    return (
      <>
        <div className="time-display">
          <div className="time-display__value">
            {pad(h)}:{pad(m)}:{pad(s)}
          </div>
          <div className="time-display__ms">.{pad(cs)}</div>
        </div>

        <div className="controls">
          {!swRunning ? (
            <button className="control-btn control-btn--primary" onClick={startSw}>
              {swElapsed > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button className="control-btn" onClick={stopSw}>
              Stop
            </button>
          )}
          <button className="control-btn" onClick={resetSw}>
            Reset
          </button>
        </div>
      </>
    );
  }

  /* ── Timer mode ── */
  const displayMs = timerRunning || timerRemaining > 0 ? timerRemaining : timerTarget;
  const { h, m, s, cs } = msToDisplay(displayMs);

  return (
    <>
      <div className="time-display">
        <div className="time-display__value">
          {pad(h)}:{pad(m)}:{pad(s)}
        </div>
        <div className="time-display__ms">.{pad(cs)}</div>
      </div>

      {/* Adjust arrows — only when timer is NOT running */}
      {!timerRunning && (
        <div className="adjust-row">
          <div className="adjust-group">
            <span className="adjust-group__label">hr</span>
            <div className="adjust-group__buttons">
              <button className="adjust-btn" onClick={() => adjustTimer('h', 1)}>▲</button>
              <button className="adjust-btn" onClick={() => adjustTimer('h', -1)}>▼</button>
            </div>
          </div>
          <div className="adjust-group">
            <span className="adjust-group__label">min</span>
            <div className="adjust-group__buttons">
              <button className="adjust-btn" onClick={() => adjustTimer('m', 5)}>▲</button>
              <button className="adjust-btn" onClick={() => adjustTimer('m', -5)}>▼</button>
            </div>
          </div>
          <div className="adjust-group">
            <span className="adjust-group__label">sec</span>
            <div className="adjust-group__buttons">
              <button className="adjust-btn" onClick={() => adjustTimer('s', 5)}>▲</button>
              <button className="adjust-btn" onClick={() => adjustTimer('s', -5)}>▼</button>
            </div>
          </div>
        </div>
      )}

      <div className="controls">
        {!timerRunning ? (
          <button className="control-btn control-btn--primary" onClick={startTimer}>
            {timerRemaining > 0 && timerRemaining < timerTarget ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button className="control-btn" onClick={stopTimer}>
            Stop
          </button>
        )}
        <button className="control-btn" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </>
  );
}
