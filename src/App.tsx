import { useState, useEffect } from 'react';
import TimerStopwatch from './components/TimerStopwatch';
import FooterClocks from './components/FooterClocks';

type Mode = 'stopwatch' | 'timer';
type Theme = 'light' | 'dark';

function App() {
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('timio-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('timio-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <span className="header__brand">Timio</span>

        <div className="header__tabs">
          <button
            className={`header__tab ${mode === 'stopwatch' ? 'header__tab--active' : ''}`}
            onClick={() => setMode('stopwatch')}
          >
            Stopwatch
          </button>
          <button
            className={`header__tab ${mode === 'timer' ? 'header__tab--active' : ''}`}
            onClick={() => setMode('timer')}
          >
            Timer
          </button>
        </div>

        <button className="header__toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '●'}
        </button>
      </header>

      {/* ── Main ── */}
      <main className="main">
        <TimerStopwatch mode={mode} />
      </main>

      {/* ── Footer ── */}
      <FooterClocks />
    </div>
  );
}

export default App;
