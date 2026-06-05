'use client';

import { useState, useEffect } from 'react';
import { getAudio } from '@/lib/audioEngine';

interface CountdownTimerProps {
  endAt: number | null;
  label: string;
  onExpired?: () => void;
}

export default function CountdownTimer({ endAt, label, onExpired }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endAt) return;

    const update = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);

      if (left <= 0 && onExpired) {
        onExpired();
      }
      if (left === 10 || left === 5 || left === 3 || left === 2 || left === 1) {
        getAudio().playSFX('tick');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endAt, onExpired]);

  if (!endAt || remaining <= 0) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining <= 10;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
      isUrgent ? 'animate-pulse-glow' : ''
    }`} style={{
      background: isUrgent ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isUrgent ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)'}`,
    }}>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className={`font-mono font-black text-lg ${
        isUrgent ? 'text-[var(--accent-red)]' : 'text-[var(--text-primary)]'
      }`}>
        {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`}
      </span>
    </div>
  );
}
