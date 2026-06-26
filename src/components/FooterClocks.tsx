import { useState, useEffect } from 'react';

interface CityConfig {
  label: string;
  timezone: string;
}

const CITIES: CityConfig[] = [
  { label: 'Tokyo', timezone: 'Asia/Tokyo' },
  { label: 'Mumbai', timezone: 'Asia/Kolkata' },
  { label: 'London', timezone: 'Europe/London' },
  { label: 'San Francisco', timezone: 'America/Los_Angeles' },
];

function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function FooterClocks() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="footer">
      {CITIES.map((city) => (
        <div className="clock" key={city.timezone}>
          <div className="clock__city">{city.label}</div>
          <div className="clock__time">{formatTime(now, city.timezone)}</div>
        </div>
      ))}
    </footer>
  );
}
