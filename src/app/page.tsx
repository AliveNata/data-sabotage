'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';
import { getSocket } from '@/lib/socket';
import { getAudio } from '@/lib/audioEngine';

const SHOWCASE_ROLES = ['shadow_analyst', 'data_engineer', 'data_steward', 'data_scientist', 'data_consultant', 'head_of_data'];

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [error, setError] = useState('');
  const router = useRouter();
  const audio = getAudio();

  useEffect(() => {
    const initAudio = () => {
      audio.resume();
      audio.playBGM('lobby');
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      audio.stopBGM();
    };
  }, [audio]);

  const handleCreate = () => {
    if (!playerName.trim() || !roomName.trim()) {
      setError('Isi nama dan nama room!');
      return;
    }
    audio.playSFX('start');
    const socket = getSocket();
    socket.emit('room:create', { name: roomName, playerName }, (res: { roomId?: string; error?: string }) => {
      if (res.error) { setError(res.error); return; }
      audio.stopBGM();
      router.push(`/room/${res.roomId}`);
    });
  };

  const handleJoin = () => {
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Isi nama dan kode room!');
      return;
    }
    audio.playSFX('join');
    const socket = getSocket();
    socket.emit('room:join', { roomId: joinCode.toUpperCase(), playerName }, (res: { roomId?: string; error?: string }) => {
      if (res.error) { setError(res.error); return; }
      audio.stopBGM();
      router.push(`/room/${res.roomId}`);
    });
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Hero */}
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tight">
          <span className="text-[var(--accent-red)]">DATA</span>{' '}
          <span className="text-[var(--text-primary)]">SABOTAGE</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">
          Social Deduction Game bertema Data. Temukan Insider Threat di tim kamu!
        </p>
      </div>

      {/* Chibi showcase */}
      <div className="flex gap-4 mb-10 flex-wrap justify-center">
        {SHOWCASE_ROLES.map((roleId, i) => (
          <div key={roleId} className="animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
            <ChibiCharacter roleId={roleId} size={80} showName={false} />
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="card w-full max-w-md">
        {mode === 'menu' && (
          <div className="flex flex-col gap-4">
            <button className="btn-primary text-lg" onClick={() => setMode('create')}>
              Buat Room Baru
            </button>
            <button className="btn-secondary text-lg" onClick={() => setMode('join')}>
              Gabung Room
            </button>
            <div className="flex gap-3 mt-2">
              <Link href="/cara-main" className="btn-secondary text-sm text-center flex-1">
                Cara Main
              </Link>
              <Link href="/role-book" className="btn-secondary text-sm text-center flex-1">
                Role Book
              </Link>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Buat Room Baru</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kamu akan menjadi Head of Data (Game Master)</p>
            <input
              className="input-field"
              placeholder="Nama kamu"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Nama room"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
            />
            {error && <p className="text-[var(--accent-red)] text-sm">{error}</p>}
            <button className="btn-primary" onClick={handleCreate}>Buat Room</button>
            <button className="btn-secondary" onClick={() => { setMode('menu'); setError(''); }}>Kembali</button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Gabung Room</h2>
            <input
              className="input-field"
              placeholder="Nama kamu"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Kode Room (6 karakter)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            {error && <p className="text-[var(--accent-red)] text-sm">{error}</p>}
            <button className="btn-primary" onClick={handleJoin}>Gabung</button>
            <button className="btn-secondary" onClick={() => { setMode('menu'); setError(''); }}>Kembali</button>
          </div>
        )}
      </div>

      <p className="mt-8 text-[var(--text-secondary)] text-xs">
        &copy; 2025 Created by{' '}
        <a
          href="https://alyxdev.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-red)] hover:underline"
        >
          Alief Akbar
        </a>
      </p>
    </main>
  );
}
