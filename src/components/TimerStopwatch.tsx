import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  mode: 'stopwatch' | 'timer';
}

type EditField = 'h' | 'm' | 's' | null;

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

  /* ── Inline editing state ── */
  const [editField, setEditField] = useState<EditField>(null);
  const [editBuffer, setEditBuffer] = useState(''); // digits typed so far
  const segmentRefs = useRef<Record<string, HTMLSpanElement | null>>({ h: null, m: null, s: null });
  const arrowClickedRef = useRef(false); // suppress edit mode when arrow is clicked

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
    commitEdit(); // commit any pending edit before starting
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
    setEditField(null);
    setEditBuffer('');
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
    const cs = Math.floor((ms % 1000) / 10);
    return { h, m, s, cs };
  };

  const adjustTimer = (field: 'h' | 'm' | 's', delta: number) => {
    if (timerRunning) return;
    setTimerTarget((prev) => {
      const { h, m, s } = msToDisplay(prev);
      let nh = h, nm = m, ns = s;

      if (field === 'h') {
        nh = Math.max(0, Math.min(99, h + delta));
      } else if (field === 'm') {
        // Snap to nearest multiple of 5 first, then step
        const snapped = m % 5 === 0 ? m : (delta > 0 ? Math.ceil(m / 5) * 5 : Math.floor(m / 5) * 5);
        nm = Math.max(0, Math.min(59, snapped === m ? m + delta : snapped));
      } else if (field === 's') {
        // Snap to nearest multiple of 5 first, then step
        const snapped = s % 5 === 0 ? s : (delta > 0 ? Math.ceil(s / 5) * 5 : Math.floor(s / 5) * 5);
        ns = Math.max(0, Math.min(59, snapped === s ? s + delta : snapped));
      }

      const newMs = (nh * 3600 + nm * 60 + ns) * 1000;
      setTimerRemaining(newMs);
      return newMs;
    });
  };


  /* ──────────────── Inline edit logic ──────────────── */
  const commitEdit = useCallback(() => {
    if (editField === null) return;
    const val = parseInt(editBuffer, 10);
    if (!isNaN(val) && editBuffer !== '') {
      setTimerTarget((prev) => {
        const { h, m, s } = msToDisplay(prev);
        let nh = h, nm = m, ns = s;
        if (editField === 'h') nh = Math.max(0, Math.min(99, val));
        if (editField === 'm') nm = Math.max(0, Math.min(59, val));
        if (editField === 's') ns = Math.max(0, Math.min(59, val));
        const newMs = (nh * 3600 + nm * 60 + ns) * 1000;
        setTimerRemaining(newMs);
        return newMs;
      });
    }
    setEditField(null);
    setEditBuffer('');
  }, [editField, editBuffer]);

  const startEdit = (field: EditField) => {
    if (timerRunning) return;
    commitEdit(); // commit previous field first
    setEditField(field);
    setEditBuffer('');
    // Focus the span so keydown fires
    setTimeout(() => {
      if (field) segmentRefs.current[field]?.focus();
    }, 0);
  };

  const nextField = (current: EditField): EditField => {
    if (current === 'h') return 'm';
    if (current === 'm') return 's';
    return null;
  };

  const handleSegmentKeyDown = (e: React.KeyboardEvent, field: 'h' | 'm' | 's') => {
    if (timerRunning) return;

    if (e.key === 'ArrowUp') { e.preventDefault(); adjustTimer(field, field === 'h' ? 1 : 5); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); adjustTimer(field, field === 'h' ? -1 : -5); return; }

    if (e.key === 'Escape') { setEditField(null); setEditBuffer(''); return; }
    if (e.key === 'Enter') { commitEdit(); return; }

    if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      const next = nextField(field);
      if (next) startEdit(next);
      return;
    }

    if (e.key === 'Backspace') {
      setEditBuffer((prev) => prev.slice(0, -1));
      return;
    }

    if (/^\d$/.test(e.key)) {
      const maxLen = field === 'h' ? 2 : 2;
      const newBuffer = (editBuffer + e.key).slice(-maxLen);
      setEditBuffer(newBuffer);

      // Auto-advance: if buffer is full or value would exceed max
      const val = parseInt(newBuffer, 10);
      const max = field === 'h' ? 99 : 59;
      const shouldAdvance =
        newBuffer.length === maxLen ||
        (newBuffer.length === 1 && val > Math.floor(max / 10));

      if (shouldAdvance) {
        // Commit immediately and move to next field
        const { h, m, s } = msToDisplay(timerTarget);
        let nh = h, nm = m, ns = s;
        const clampedVal = Math.min(val, max);
        if (field === 'h') nh = clampedVal;
        if (field === 'm') nm = clampedVal;
        if (field === 's') ns = clampedVal;
        const newMs = (nh * 3600 + nm * 60 + ns) * 1000;
        setTimerTarget(newMs);
        setTimerRemaining(newMs);
        setEditBuffer('');
        const next = nextField(field);
        if (next) {
          setEditField(next);
          setTimeout(() => segmentRefs.current[next]?.focus(), 0);
        } else {
          setEditField(null);
        }
      }
      return;
    }
  };

  /* Close edit on outside click */
  useEffect(() => {
    if (editField === null) return;
    const handler = (e: MouseEvent) => {
      const el = e.target as Node;
      const isSegment = Object.values(segmentRefs.current).some((r) => r?.contains(el));
      if (!isSegment) commitEdit();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editField, commitEdit]);

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
            <button className="control-btn" onClick={stopSw}>Stop</button>
          )}
          <button className="control-btn" onClick={resetSw}>Reset</button>
        </div>
      </>
    );
  }

  /* ── Timer mode ── */
  const displayMs = timerRunning || timerRemaining > 0 ? timerRemaining : timerTarget;
  const { h, m, s } = msToDisplay(displayMs);

  // What to show for each segment while editing
  const displayH = editField === 'h' ? (editBuffer === '' ? '--' : editBuffer.padStart(2, '0')) : pad(h);
  const displayM = editField === 'm' ? (editBuffer === '' ? '--' : editBuffer.padStart(2, '0')) : pad(m);
  const displayS = editField === 's' ? (editBuffer === '' ? '--' : editBuffer.padStart(2, '0')) : pad(s);

  const isEditable = !timerRunning;

  const onArrowMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();             // prevent focus moving to the button
    arrowClickedRef.current = true; // flag: "an arrow was just pressed"
  };

  const onArrowClick = (field: 'h' | 'm' | 's', delta: number) => {
    adjustTimer(field, delta);
    // Reset after current microtask so subsequent non-arrow clicks work
    requestAnimationFrame(() => { arrowClickedRef.current = false; });
  };

  const handleSegmentClick = (field: EditField) => {
    if (!isEditable || arrowClickedRef.current) return;
    startEdit(field);
  };

  const handleSegmentFocus = (field: 'h' | 'm' | 's') => {
    if (!isEditable || editField === field || arrowClickedRef.current) return;
    startEdit(field);
  };

  return (
    <>
      <div className="timer-picker">

        {/* ── Hours column ── */}
        <div className="timer-col">
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('h', 1)} aria-label="Increase hours">▲</button>
          )}
          <span
            ref={(el) => { segmentRefs.current['h'] = el; }}
            className={`timer-seg${isEditable ? ' timer-seg--editable' : ''}${editField === 'h' ? ' timer-seg--active' : ''}`}
            tabIndex={isEditable ? 0 : -1}
            onClick={() => handleSegmentClick('h')}
            onFocus={() => handleSegmentFocus('h')}
            onKeyDown={(e) => handleSegmentKeyDown(e, 'h')}
            aria-label={`Hours: ${h}. Click or focus to edit.`}
          >
            {displayH}
          </span>
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('h', -1)} aria-label="Decrease hours">▼</button>
          )}
          <span className="picker-label">hr</span>
        </div>

        <span className="timer-colon">:</span>

        {/* ── Minutes column ── */}
        <div className="timer-col">
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('m', 5)} aria-label="Increase minutes">▲</button>
          )}
          <span
            ref={(el) => { segmentRefs.current['m'] = el; }}
            className={`timer-seg${isEditable ? ' timer-seg--editable' : ''}${editField === 'm' ? ' timer-seg--active' : ''}`}
            tabIndex={isEditable ? 0 : -1}
            onClick={() => handleSegmentClick('m')}
            onFocus={() => handleSegmentFocus('m')}
            onKeyDown={(e) => handleSegmentKeyDown(e, 'm')}
            aria-label={`Minutes: ${m}. Click or focus to edit.`}
          >
            {displayM}
          </span>
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('m', -5)} aria-label="Decrease minutes">▼</button>
          )}
          <span className="picker-label">min</span>
        </div>

        <span className="timer-colon">:</span>

        {/* ── Seconds column ── */}
        <div className="timer-col">
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('s', 5)} aria-label="Increase seconds">▲</button>
          )}
          <span
            ref={(el) => { segmentRefs.current['s'] = el; }}
            className={`timer-seg${isEditable ? ' timer-seg--editable' : ''}${editField === 's' ? ' timer-seg--active' : ''}`}
            tabIndex={isEditable ? 0 : -1}
            onClick={() => handleSegmentClick('s')}
            onFocus={() => handleSegmentFocus('s')}
            onKeyDown={(e) => handleSegmentKeyDown(e, 's')}
            aria-label={`Seconds: ${s}. Click or focus to edit.`}
          >
            {displayS}
          </span>
          {isEditable && (
            <button className="picker-arrow" onMouseDown={onArrowMouseDown} onClick={() => onArrowClick('s', -5)} aria-label="Decrease seconds">▼</button>
          )}
          <span className="picker-label">sec</span>
        </div>
      </div>

      {isEditable && editField === null && (
        <div className="timer-hint">click a number to edit</div>
      )}
      {isEditable && editField !== null && (
        <div className="timer-hint">type digits · ↑↓ adjust · tab next · enter done</div>
      )}

      <div className="controls">
        {!timerRunning ? (
          <button className="control-btn control-btn--primary" onClick={startTimer}>
            {timerRemaining > 0 && timerRemaining < timerTarget ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button className="control-btn" onClick={stopTimer}>Stop</button>
        )}
        <button className="control-btn" onClick={resetTimer}>Reset</button>
      </div>
    </>
  );
}

