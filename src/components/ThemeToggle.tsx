"use client";
import { useEffect, useState } from 'react';
import { Sun, Moon, TreePine } from 'lucide-react';

const themes = [
  { name: 'Wooden', value: 'wooden', icon: <TreePine className="h-5 w-5" /> },
  { name: 'Light', value: 'light', icon: <Sun className="h-5 w-5" /> },
  { name: 'Dark', value: 'dark', icon: <Moon className="h-5 w-5" /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState('wooden');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'wooden');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: string) => {
    if (theme === newTheme) return;
    setIsAnimating(true);
    setTimeout(() => {
      setTheme(newTheme);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="flex gap-2 items-center">
      {themes.map((t) => (
        <button
          key={t.value}
          aria-label={`Switch to ${t.name} theme`}
          className={`relative overflow-hidden rounded-full p-2.5 border ${theme === t.value 
            ? 'border-accent-gold bg-amber-600 text-accent-goldLight shadow-inner' 
            : 'border-amber-300 bg-amber-100/80 text-amber-900 hover:bg-amber-200 shadow-amber'} 
            focus:outline-none focus:ring-2 focus:ring-amber-400/50 
            transition-all duration-300 ease-in-out hover:scale-110 active:scale-95`}
          onClick={() => handleThemeChange(t.value)}
        >
          <span className={`relative z-10 ${isAnimating ? 'animate-pulse-slow' : ''}`}>
            {t.icon}
          </span>
          {theme === t.value && (
            <span className="absolute inset-0 bg-amber-600 opacity-80 animate-pulse-slow"></span>
          )}
        </button>
      ))}
    </div>
  );
}
