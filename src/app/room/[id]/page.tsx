'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ROLES } from '@/lib/roles';
import { OPENING_STORYLINE, WIN_MESSAGES } from '@/lib/storyline';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';
import VideoChat from '@/components/game/VideoChat';
import CountdownTimer from '@/components/game/CountdownTimer';
import { getAudio } from '@/lib/audioEngine';

interface PlayerView {
  id: string;
  name: string;
  isAlive: boolean;
  isGod: boolean;
  roleId: string | null;
  annotations: Record<string, string>;
}

interface RoomView {
  id: string;
  name: string;
  godId: string;
  players: Record<string, PlayerView>;
  phase: string;
  round: number;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    isSystem: boolean;
  }>;
  maxPlayers: number;
  debateTimer: number;
  voteTimer: number;
  timerEndAt: number | null;
  myRole: string | null;
  isGod: boolean;
  winner: string | null;
  annotatorLabels: Record<string, string>;
  boostedPlayerId: string | null;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<RoomView | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [annotatorLabel, setAnnotatorLabel] = useState<'suspect' | 'clean'>('suspect');
  const [nightResult, setNightResult] = useState<string>('');
  const [godLog, setGodLog] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:update', (data: RoomView) => {
      setRoom(data);
    });

    socket.on('night:result', (data: { result: string }) => {
      setNightResult(data.result);
    });

    socket.on('god:night-action', (data: { actorName: string; roleName: string; result: string }) => {
      setGodLog(prev => [...prev, `[${data.roleName}] ${data.actorName}: ${data.result}`]);
    });

    socket.emit('room:request', { roomId });

    return () => {
      socket.off('room:update');
      socket.off('night:result');
      socket.off('god:night-action');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

  // Audio: BGM per phase
  useEffect(() => {
    const audio = getAudio();
    audio.resume();
    switch (room?.phase) {
      case 'lobby': audio.playBGM('lobby'); break;
      case 'intro': audio.playSFX('start'); audio.playBGM('intro'); break;
      case 'night': audio.playSFX('transition'); audio.playBGM('night'); break;
      case 'day': audio.playSFX('transition'); audio.playBGM('day'); break;
      case 'gameover':
        audio.playBGM('gameover');
        if (room.winner === 'data') audio.playSFX('win');
        else audio.playSFX('lose');
        break;
      default: audio.playBGM('none');
    }
    return () => { audio.stopBGM(); };
  }, [room?.phase, room?.winner]);

  useEffect(() => {
    if (room?.phase === 'intro' && !storyDone) {
      if (storyIndex < OPENING_STORYLINE.length) {
        const timer = setTimeout(() => {
          getAudio().playSFX('tick');
          setStoryIndex(prev => prev + 1);
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        getAudio().playSFX('reveal');
        setStoryDone(true);
      }
    }
  }, [room?.phase, storyIndex, storyDone]);

  const socket = getSocket();
  const players = room ? Object.values(room.players) : [];
  const alivePlayers = players.filter(p => p.isAlive && !p.isGod);
  const myRole = room?.myRole ? ROLES[room.myRole] : null;
  const isGod = room?.isGod ?? false;
  const needsTwoTargets = room?.myRole === 'data_scientist' || room?.myRole === 'ml_engineer';
  const maxTargets = needsTwoTargets ? 2 : 1;

  const handleTargetClick = (targetId: string) => {
    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(prev => prev.filter(id => id !== targetId));
    } else if (selectedTargets.length < maxTargets) {
      setSelectedTargets(prev => [...prev, targetId]);
    }
  };

  const handleNightAction = () => {
    if (selectedTargets.length === 0) return;
    const roleId = room?.myRole;
    if (roleId === 'shadow_analyst') getAudio().playSFX('kill');
    else if (roleId === 'data_engineer' || roleId === 'data_product_manager') getAudio().playSFX('protect');
    else if (roleId === 'data_steward') getAudio().playSFX('scan');
    else getAudio().playSFX('click');

    socket.emit('night:action', {
      targetIds: selectedTargets,
      extra: room?.myRole === 'data_annotator' ? annotatorLabel : undefined,
    });
    setSelectedTargets([]);
  };

  const handleVote = (targetId: string) => {
    getAudio().playSFX('vote');
    socket.emit('vote:cast', { targetId });
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    getAudio().playSFX('message');
    socket.emit('chat:send', { text: chatInput });
    setChatInput('');
  };

  if (!room) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-4">Menghubungkan...</div>
          <p className="text-[var(--text-secondary)]">Room: {roomId}</p>
        </div>
      </main>
    );
  }

  // LOBBY
  if (room.phase === 'lobby') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black mb-1">{room.name}</h1>
            <p className="text-[var(--text-secondary)]">Kode Room: <span className="text-[var(--accent-red)] font-mono font-bold text-lg">{room.id}</span></p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Bagikan kode ini ke teman-teman kamu!</p>
          </div>

          <div className="mb-6">
            <h2 className="font-bold mb-3">Pemain ({players.length - 1}/20)</h2>
            <div className="grid grid-cols-2 gap-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: p.isGod ? 'var(--accent-gold)' : 'var(--accent-green)' }} />
                  <span className="text-sm">{p.name}</span>
                  {p.isGod && <span className="text-xs text-[var(--accent-gold)]">(Host)</span>}
                </div>
              ))}
            </div>
          </div>

          {isGod && (
            <button
              className="btn-primary w-full"
              disabled={players.length - 1 < 4}
              onClick={() => socket.emit('game:start')}
            >
              {players.length - 1 < 4
                ? `Butuh minimal 4 pemain (sekarang ${players.length - 1})`
                : `Mulai Game (${players.length - 1} pemain)`
              }
            </button>
          )}

          {!isGod && (
            <p className="text-center text-[var(--text-secondary)] text-sm">Menunggu Head of Data memulai game...</p>
          )}
        </div>
      </main>
    );
  }

  // INTRO
  if (room.phase === 'intro') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 phase-night">
        <div className="max-w-2xl w-full text-center">
          <ChibiCharacter roleId="head_of_data" size={120} showName={false} />
          <div className="mt-8 space-y-4">
            {OPENING_STORYLINE.slice(0, storyIndex).map((line, i) => (
              <p
                key={i}
                className="text-lg animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  color: i >= OPENING_STORYLINE.length - 2 ? 'var(--accent-red)' : 'var(--text-primary)',
                  fontWeight: i >= OPENING_STORYLINE.length - 2 ? 'bold' : 'normal',
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {storyDone && isGod && (
            <div className="mt-8 animate-fade-in-up">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Semua pemain sudah mendapat role mereka.
              </p>
              <button className="btn-primary" onClick={() => socket.emit('game:to-night')}>
                Mulai Malam Pertama
              </button>
            </div>
          )}

          {storyDone && !isGod && myRole && (
            <div className="mt-8 card animate-fade-in-up">
              <p className="text-sm text-[var(--text-secondary)] mb-2">Role kamu:</p>
              <div className="flex items-center gap-4 justify-center">
                <ChibiCharacter roleId={room.myRole!} size={80} />
                <div className="text-left">
                  <h3 className="font-bold text-lg" style={{
                    color: myRole.team === 'insider' ? 'var(--accent-red)' : myRole.team === 'data' ? 'var(--accent-green)' : 'var(--accent-gold)'
                  }}>
                    {myRole.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{myRole.skillName}: {myRole.skillDescription}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // GAME OVER
  if (room.phase === 'gameover' && room.winner) {
    const winData = WIN_MESSAGES[room.winner as keyof typeof WIN_MESSAGES];
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center">
          <h1 className="text-3xl font-black mb-4">{winData.title}</h1>
          <p className="text-[var(--text-secondary)] mb-6">{winData.message}</p>

          <h2 className="font-bold mb-4">Semua Role</h2>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {players.filter(p => !p.isGod).map(p => {
              const role = p.roleId ? ROLES[p.roleId] : null;
              return (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {p.roleId && <ChibiCharacter roleId={p.roleId} size={40} isAlive={p.isAlive} showName={false} />}
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs" style={{
                      color: role?.team === 'insider' ? 'var(--accent-red)' : role?.team === 'data' ? 'var(--accent-green)' : 'var(--accent-gold)'
                    }}>
                      {role?.name || '???'}
                    </p>
                  </div>
                  {!p.isAlive && <span className="text-xs text-[var(--accent-red)]">DIPECAT</span>}
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={() => window.location.href = '/'}>
            Kembali ke Menu
          </button>
        </div>
      </main>
    );
  }

  // NIGHT / DAY
  return (
    <main className={`flex-1 flex flex-col ${room.phase === 'night' ? 'phase-night' : 'phase-day'}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="font-bold text-lg">{room.name}</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Round {room.round} &bull; {room.phase === 'night' ? 'After Hours (Malam)' : 'Daily Standup (Siang)'}
          </p>
        </div>
        {room.phase === 'day' && room.timerEndAt && (
          <CountdownTimer
            endAt={room.timerEndAt}
            label="Debat"
            onExpired={() => {
              if (isGod) getAudio().playSFX('transition');
            }}
          />
        )}
        {myRole && !isGod && (
          <div className="flex items-center gap-2">
            <ChibiCharacter roleId={room.myRole!} size={40} showName={false} />
            <div className="text-right">
              <p className="text-sm font-bold">{myRole.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{myRole.skillName}</p>
            </div>
          </div>
        )}
        {isGod && (
          <div className="flex items-center gap-2">
            <ChibiCharacter roleId="head_of_data" size={40} showName={false} />
            <span className="text-sm font-bold text-[var(--accent-gold)]">Head of Data</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Players panel */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 p-4 overflow-y-auto scrollbar-thin">
          <h2 className="font-bold text-sm mb-3 text-[var(--text-secondary)]">PEMAIN</h2>
          <div className="space-y-2">
            {players.filter(p => !p.isGod).map(p => {
              const role = p.roleId ? ROLES[p.roleId] : null;
              const isSelected = selectedTargets.includes(p.id);
              const canTarget = room.phase === 'night' && !isGod && p.isAlive && p.id !== socket.id;

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-[var(--accent-red)]' : ''
                  } ${!p.isAlive ? 'opacity-40' : ''}`}
                  style={{ background: isSelected ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.03)' }}
                  onClick={() => {
                    if (room.phase === 'night' && canTarget) handleTargetClick(p.id);
                    if (room.phase === 'day' && p.isAlive && !isGod) handleVote(p.id);
                  }}
                >
                  {p.roleId ? (
                    <ChibiCharacter roleId={p.roleId} size={36} isAlive={p.isAlive} showName={false} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    {(isGod || !p.isAlive) && role && (
                      <p className="text-xs" style={{
                        color: role.team === 'insider' ? 'var(--accent-red)' : role.team === 'data' ? 'var(--accent-green)' : 'var(--accent-gold)'
                      }}>
                        {role.name}
                      </p>
                    )}
                    {!p.isAlive && <span className="text-xs text-[var(--accent-red)]">DIPECAT</span>}
                  </div>
                  {room.phase === 'day' && p.isAlive && !p.isGod && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      {room.boostedPlayerId === p.id && <span className="text-[var(--accent-blue)]">2x </span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            {room.messages.map(msg => (
              <div key={msg.id} className={`${msg.isSystem ? 'text-center' : ''}`}>
                {msg.isSystem ? (
                  <p className="text-sm text-[var(--text-secondary)] py-1">{msg.text}</p>
                ) : (
                  <div className="flex gap-2">
                    <span className="text-sm font-bold text-[var(--accent-blue)]">{msg.senderName}:</span>
                    <span className="text-sm">{msg.text}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Night result for player */}
            {nightResult && room.phase === 'night' && (
              <div className="card mt-2 border-[var(--accent-red)]">
                <p className="text-sm">{nightResult}</p>
              </div>
            )}

            {/* God log */}
            {isGod && godLog.length > 0 && room.phase === 'night' && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[var(--accent-gold)] mb-2">Log Aksi Malam (hanya God)</h3>
                {godLog.map((log, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)] mb-1">{log}</p>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Video Chat */}
          <VideoChat
            roomId={room.id}
            playerId={socket.id || ''}
            playerName={players.find(p => p.id === socket.id)?.name || ''}
            isActive={room.phase === 'day'}
            players={alivePlayers}
          />

          {/* Action bar */}
          <div className="border-t border-white/5 p-4">
            {/* Night actions for player */}
            {room.phase === 'night' && !isGod && myRole && myRole.skillTiming === 'night' && (
              <div className="mb-3">
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  {myRole.skillName}: Pilih {maxTargets} target{maxTargets > 1 ? 's' : ''} dari daftar pemain.
                </p>
                {room.myRole === 'data_annotator' && (
                  <div className="flex gap-2 mb-2">
                    <button
                      className={`text-xs px-3 py-1 rounded-full ${annotatorLabel === 'suspect' ? 'bg-[var(--accent-red)] text-white' : 'bg-white/10'}`}
                      onClick={() => setAnnotatorLabel('suspect')}
                    >
                      SUSPECT
                    </button>
                    <button
                      className={`text-xs px-3 py-1 rounded-full ${annotatorLabel === 'clean' ? 'bg-[var(--accent-green)] text-white' : 'bg-white/10'}`}
                      onClick={() => setAnnotatorLabel('clean')}
                    >
                      CLEAN
                    </button>
                  </div>
                )}
                <button
                  className="btn-primary text-sm"
                  disabled={selectedTargets.length < maxTargets}
                  onClick={handleNightAction}
                >
                  Gunakan {myRole.skillName}
                </button>
              </div>
            )}

            {/* God controls */}
            {isGod && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {room.phase === 'night' && (
                  <button className="btn-primary text-sm" onClick={() => {
                    setGodLog([]);
                    setNightResult('');
                    socket.emit('game:to-day');
                  }}>
                    Lanjut ke Daily Standup
                  </button>
                )}
                {room.phase === 'day' && (
                  <>
                    <button className="btn-primary text-sm" onClick={() => socket.emit('vote:process')}>
                      Proses Voting
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => socket.emit('game:next-round')}>
                      Lanjut ke Malam
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Chat input */}
            {room.phase === 'day' && (
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Tulis pesan diskusi..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                />
                <button className="btn-primary text-sm" onClick={handleChat}>Kirim</button>
              </div>
            )}

            {room.phase === 'night' && !isGod && (!myRole || myRole.skillTiming !== 'night') && (
              <p className="text-sm text-[var(--text-secondary)] text-center">
                Menunggu malam selesai... Kamu tidak punya aksi malam.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
