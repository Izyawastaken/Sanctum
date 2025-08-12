import React, { useEffect } from 'react';

const ACCENT_KEY = 'sanctum-accent';

export default function RootTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme || savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent', savedAccent);
    }
  }, []);

  return <>{children}</>;
} 