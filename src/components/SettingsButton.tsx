'use client';

import { useState } from 'react';
import SettingsMenu from './SettingsMenu';
import { getAudio } from '@/lib/audioEngine';

export default function SettingsButton() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    getAudio().resume();
    getAudio().playSFX('click');
    setOpen(true);
  };

  return (
    <>
      <button
        className="fixed top-4 right-4 z-40 w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:brightness-125"
        style={{
          background: 'linear-gradient(135deg, #e94560, #c23152)',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 2px 12px rgba(233,69,96,0.4)',
        }}
        onClick={handleOpen}
        title="Pengaturan"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <SettingsMenu isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
