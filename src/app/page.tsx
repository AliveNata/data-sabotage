'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';
import { getSocket } from '@/lib/socket';
import { getAudio } from '@/lib/audioEngine';

const SHOWCASE_ROLES = ['shadow_analyst', 'data_engineer', 'data_steward', 'data_scientist', 'data_consultant', 'head_of_data'];

interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
}

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [debateTimer, setDebateTimer] = useState(180);
  const [voteTimer, setVoteTimer] = useState(60);
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const router = useRouter();
  const audio = getAudio();

  useEffect(() => {
    audio.resume();
    audio.playBGM('lobby');

    const initAudio = () => {
      audio.resume();
      audio.playBGM('lobby');
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    // Fetch room list
    const socket = getSocket();
    socket.emit('rooms:list', null, (list: RoomInfo[]) => {
      setRooms(list || []);
    });
    socket.on('rooms:list', (list: RoomInfo[]) => {
      setRooms(list || []);
    });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      socket.off('rooms:list');
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
    socket.emit('room:create', {
      name: roomName,
      playerName,
      maxPlayers,
      debateTimer,
      voteTimer,
    }, (res: { roomId?: string; error?: string }) => {
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

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      setError('Isi nama kamu dulu!');
      setMode('join');
      return;
    }
    audio.playSFX('join');
    const socket = getSocket();
    socket.emit('room:join', { roomId, playerName }, (res: { roomId?: string; error?: string }) => {
      if (res.error) { setError(res.error); return; }
      audio.stopBGM();
      router.push(`/room/${res.roomId}`);
    });
  };

  const availableRooms = rooms.filter(r => r.phase === 'lobby' && r.playerCount < (r.maxPlayers || 21));
  const fullRooms = rooms.filter(r => r.phase !== 'lobby' || r.playerCount >= (r.maxPlayers || 21));

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

            {/* Player count */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Maks. Player</label>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg"
                  onClick={() => setMaxPlayers(Math.max(4, maxPlayers - 1))}
                >-</button>
                <span className="w-8 text-center font-mono font-bold">{maxPlayers}</span>
                <button
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg"
                  onClick={() => setMaxPlayers(Math.min(20, maxPlayers + 1))}
                >+</button>
              </div>
            </div>

            {/* Debate timer */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Timer Debat</label>
              <select
                className="input-field w-auto text-sm"
                value={debateTimer}
                onChange={e => setDebateTimer(Number(e.target.value))}
              >
                <option value={60}>1 menit</option>
                <option value={120}>2 menit</option>
                <option value={180}>3 menit</option>
                <option value={300}>5 menit</option>
                <option value={600}>10 menit</option>
                <option value={0}>Tanpa batas</option>
              </select>
            </div>

            {/* Vote timer */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Timer Voting</label>
              <select
                className="input-field w-auto text-sm"
                value={voteTimer}
                onChange={e => setVoteTimer(Number(e.target.value))}
              >
                <option value={30}>30 detik</option>
                <option value={60}>1 menit</option>
                <option value={120}>2 menit</option>
                <option value={0}>Tanpa batas</option>
              </select>
            </div>

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

            {/* Manual code */}
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Kode Room (6 karakter)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="btn-primary text-sm px-4" onClick={handleJoin}>Gabung</button>
            </div>

            {/* Room list */}
            {rooms.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-bold mb-2 text-[var(--text-secondary)]">Room Tersedia</p>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {availableRooms.map(room => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <div>
                        <p className="font-bold text-sm">{room.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Kode: {room.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-[var(--accent-green)]">
                          {room.playerCount}/{room.maxPlayers || 20}
                        </p>
                        <p className="text-xs text-[var(--accent-green)]">Tersedia</p>
                      </div>
                    </div>
                  ))}
                  {fullRooms.map(room => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-lg opacity-40"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div>
                        <p className="font-bold text-sm">{room.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Kode: {room.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-[var(--accent-red)]">
                          {room.playerCount}/{room.maxPlayers || 20}
                        </p>
                        <p className="text-xs text-[var(--accent-red)]">
                          {room.phase !== 'lobby' ? 'Sedang bermain' : 'Penuh'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rooms.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-4">Belum ada room. Buat room baru!</p>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-[var(--accent-red)] text-sm">{error}</p>}
            <button className="btn-secondary" onClick={() => { setMode('menu'); setError(''); }}>Kembali</button>
          </div>
        )}
      </div>

      <p className="mt-8 text-[var(--text-secondary)] text-xs">
        &copy; 2025 - {new Date().getFullYear()} &bull; Created by{' '}
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
