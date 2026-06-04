'use client';

import { useState, useEffect } from 'react';
import { getAudio, AudioSettings } from '@/lib/audioEngine';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const [settings, setSettings] = useState<AudioSettings>({
    masterVolume: 0.7,
    bgmVolume: 0.4,
    sfxVolume: 0.6,
    muted: false,
  });

  useEffect(() => {
    setSettings(getAudio().getSettings());
  }, [isOpen]);

  const update = (partial: Partial<AudioSettings>) => {
    const audio = getAudio();
    audio.updateSettings(partial);
    setSettings(audio.getSettings());
  };

  const testSFX = () => {
    const audio = getAudio();
    audio.resume();
    audio.playSFX('scan');
  };

  const testBGM = () => {
    const audio = getAudio();
    audio.resume();
    audio.playBGM('lobby');
    setTimeout(() => audio.stopBGM(), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="card relative z-10 w-full max-w-md animate-fade-in-up"
        onClick={e => e.stopPropagation()}
        style={{ background: '#141428', border: '1px solid rgba(233,69,96,0.2)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Pengaturan</h2>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Mute toggle */}
        <div className="flex items-center justify-between mb-6 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div>
            <p className="font-bold text-sm">Suara</p>
            <p className="text-xs text-[var(--text-secondary)]">Aktifkan atau matikan semua suara</p>
          </div>
          <button
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.muted ? 'bg-white/10' : 'bg-[var(--accent-green)]'}`}
            onClick={() => update({ muted: !settings.muted })}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
              style={{ transform: settings.muted ? 'translateX(2px)' : 'translateX(26px)' }}
            />
          </button>
        </div>

        {/* Volume sliders */}
        <div className="space-y-5">
          <VolumeSlider
            label="Master Volume"
            desc="Volume keseluruhan"
            value={settings.masterVolume}
            onChange={v => update({ masterVolume: v })}
            disabled={settings.muted}
          />
          <VolumeSlider
            label="Musik (BGM)"
            desc="Background music tiap fase"
            value={settings.bgmVolume}
            onChange={v => update({ bgmVolume: v })}
            disabled={settings.muted}
          />
          <VolumeSlider
            label="Efek Suara (SFX)"
            desc="Suara aksi, voting, transisi"
            value={settings.sfxVolume}
            onChange={v => update({ sfxVolume: v })}
            disabled={settings.muted}
          />
        </div>

        {/* Test buttons */}
        <div className="flex gap-3 mt-6">
          <button className="btn-secondary text-xs flex-1" onClick={testSFX} disabled={settings.muted}>
            Test SFX
          </button>
          <button className="btn-secondary text-xs flex-1" onClick={testBGM} disabled={settings.muted}>
            Test BGM (3 detik)
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-[var(--text-secondary)] mt-4 text-center">
          Pengaturan disimpan otomatis di browser kamu.
        </p>
      </div>
    </div>
  );
}

function VolumeSlider({ label, desc, value, onChange, disabled }: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const pct = Math.round(value * 100);

  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
        </div>
        <span className="text-sm font-mono text-[var(--text-secondary)]">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent-red) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
    </div>
  );
}
