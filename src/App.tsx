// Import React state hooks and the app's child components used in the layout.
import { useState, useEffect } from 'react';
import TimerStopwatch from './components/TimerStopwatch';
import FooterClocks from './components/FooterClocks';

// Define the accepted modes and theme values for the app state.
type Mode = 'stopwatch' | 'timer';
type Theme = 'light' | 'dark';

function App() {
  // Track whether the app is showing the stopwatch or timer view.
  const [mode, setMode] = useState<Mode>('stopwatch');

  // Load the saved theme from localStorage when the component first starts.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('timio-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  // Keep the page theme attribute and saved theme value in sync whenever the theme changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('timio-theme', theme);
  }, [theme]);

  // Toggle between light and dark mode for the app.
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app">
      {/* Header section with the app name, mode switcher, and theme toggle. */}
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

      {/* Main content area renders the active stopwatch or timer component. */}
      <main className="main">
        <TimerStopwatch mode={mode} />
      </main>

      {/* Footer area displays the additional clock widgets beneath the main timer content. */}
      <FooterClocks />
    </div>
  );
}

export default App;
