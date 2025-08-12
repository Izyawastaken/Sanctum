import React, { useEffect, useMemo, useState } from 'react';

const ACCENT_KEY = 'sanctum-accent';

export default function AccentPicker() {
  const initial = useMemo(() => localStorage.getItem(ACCENT_KEY) || getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ff9800', []);
  const [accent, setAccent] = useState(initial.trim() || '#ff9800');

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    localStorage.setItem(ACCENT_KEY, accent);
    const circle = document.querySelector('.accent-circle') as HTMLElement | null;
    if (circle) circle.style.background = accent;
  }, [accent]);

  return (
    <div className="accent-picker-container" title="Pick accent color">
      <span className="accent-circle" />
      <input type="color" aria-label="Pick accent color" value={accent} onChange={e => setAccent(e.target.value)} />
    </div>
  );
} 