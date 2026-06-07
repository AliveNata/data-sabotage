'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ROLES } from '@/lib/roles';
import { OPENING_STORYLINE, WIN_MESSAGES } from '@/lib/storyline';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';
import VideoChat from '@/components/game/VideoChat';
import CountdownTimer from '@/components/game/CountdownTimer';
import { getAudio } from '@/lib/audioEngine';

// Lobby player card with video + speaking indicator + mic/cam status
function LobbyPlayerCard({ player, isMe, isSpeaking, lobbyStream, mediaStatus }: {
  player: { id: string; name: string; isGod: boolean };
  isMe: boolean;
  isSpeaking: boolean;
  lobbyStream?: MediaStream | null;
  mediaStatus?: { mic: boolean; cam: boolean };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && lobbyStream && lobbyStream.getVideoTracks().length > 0) {
      videoRef.current.srcObject = lobbyStream;
    }
  }, [lobbyStream]);

  const hasVideo = isMe
    ? lobbyStream && lobbyStream.getVideoTracks().length > 0 && lobbyStream.getVideoTracks()[0].enabled
    : mediaStatus?.cam;

  return (
    <div
      className="relative flex flex-col items-center p-3 rounded-lg transition-all min-h-[80px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: isSpeaking ? '2px solid var(--accent-green)' : '2px solid transparent',
        boxShadow: isSpeaking ? '0 0 12px rgba(46,204,113,0.3)' : 'none',
      }}
    >
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -top-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--accent-green)', color: '#000' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          Bicara
        </div>
      )}

      {/* Mic/Cam status icons */}
      <div className="absolute top-1 left-1 flex gap-0.5">
        {(isMe ? true : mediaStatus?.mic) && (
          <span className="text-[10px]" title="Mic ON">🎤</span>
        )}
        {hasVideo && (
          <span className="text-[10px]" title="Cam ON">📹</span>
        )}
      </div>

      {/* Video or avatar */}
      {hasVideo && isMe && lobbyStream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-12 h-12 rounded-full object-cover mb-1"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 text-lg font-bold ${hasVideo && !isMe ? 'ring-2 ring-[var(--accent-blue)]' : ''}`} style={{
          background: player.isGod ? 'rgba(255,215,0,0.2)' : 'rgba(46,204,113,0.15)',
          color: player.isGod ? 'var(--accent-gold)' : 'var(--accent-green)',
        }}>
          {player.name.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="text-xs font-bold truncate max-w-full">{player.name}</span>
      {player.isGod && <span className="text-[10px] text-[var(--accent-gold)]">Host</span>}
      {isMe && <span className="text-[10px] text-[var(--text-secondary)]">(Kamu)</span>}
    </div>
  );
}

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
  const router = useRouter();
  const [room, setRoom] = useState<RoomView | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [annotatorLabel, setAnnotatorLabel] = useState<'suspect' | 'clean'>('suspect');
  const [nightResult, setNightResult] = useState<string>('');
  const [godLog, setGodLog] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [architectRevenge, setArchitectRevenge] = useState(false);
  const [lobbyMic, setLobbyMic] = useState(false);
  const [lobbyCam, setLobbyCam] = useState(false);
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const [lobbySpeaking, setLobbySpeaking] = useState<Record<string, boolean>>({});
  const [lobbyRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [lobbyMediaStatus, setLobbyMediaStatus] = useState<Record<string, { mic: boolean; cam: boolean }>>({});
  const [showRoleBook, setShowRoleBook] = useState(false);
  const lobbyAnalyserRef = useRef<AnalyserNode | null>(null);
  const lobbySpeakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    let timeoutId: ReturnType<typeof setTimeout>;

    socket.on('room:update', (data: RoomView) => {
      setRoom(data);
      setConnectionError(null);
    });

    socket.on('room:not-found', () => {
      setConnectionError('Room tidak ditemukan. Mungkin sudah dihapus atau kode salah.');
    });

    socket.on('night:result', (data: { result: string }) => {
      setNightResult(data.result);
    });

    socket.on('god:night-action', (data: { actorName: string; roleName: string; result: string }) => {
      setGodLog(prev => [...prev, `[${data.roleName}] ${data.actorName}: ${data.result}`]);
    });

    socket.on('architect:revenge', () => {
      setArchitectRevenge(true);
    });

    // Lobby media status from other players
    socket.on('lobby:media-status', (data: { playerId: string; mic: boolean; cam: boolean }) => {
      setLobbyMediaStatus(prev => ({ ...prev, [data.playerId]: { mic: data.mic, cam: data.cam } }));
    });

    socket.on('lobby:speaking', (data: { playerId: string; speaking: boolean }) => {
      setLobbySpeaking(prev => ({ ...prev, [data.playerId]: data.speaking }));
    });

    socket.emit('room:request', { roomId });

    // Connection timeout
    timeoutId = setTimeout(() => {
      if (!room) {
        setConnectionError('Tidak bisa terhubung ke room. Room mungkin sudah tidak ada.');
      }
    }, 8000);

    return () => {
      clearTimeout(timeoutId);
      socket.off('room:update');
      socket.off('room:not-found');
      socket.off('night:result');
      socket.off('god:night-action');
      socket.off('architect:revenge');
      socket.off('lobby:media-status');
      socket.off('lobby:speaking');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

  // Clear state on phase change
  useEffect(() => {
    if (room?.phase === 'night') {
      setNightResult('');
      setGodLog([]);
      setSelectedTargets([]);
      setArchitectRevenge(false);
    }
    if (room?.phase === 'day') {
      setSelectedTargets([]);
    }
  }, [room?.phase]);

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

  // --- Lobby media ---
  const broadcastMediaStatus = (mic: boolean, cam: boolean) => {
    socket.emit('lobby:media-status', { roomId, mic, cam });
  };

  const toggleLobbyMic = async () => {
    if (lobbyMic) {
      if (lobbyStream) {
        lobbyStream.getAudioTracks().forEach(t => t.stop());
        if (!lobbyCam) {
          lobbyStream.getTracks().forEach(t => t.stop());
          setLobbyStream(null);
        }
      }
      if (lobbySpeakingIntervalRef.current) clearInterval(lobbySpeakingIntervalRef.current);
      setLobbySpeaking(prev => ({ ...prev, [socket.id || '']: false }));
      socket.emit('lobby:speaking', { roomId, speaking: false });
      setLobbyMic(false);
      broadcastMediaStatus(false, lobbyCam);
    } else {
      try {
        const stream = lobbyStream || await navigator.mediaDevices.getUserMedia({ audio: true, video: lobbyCam });
        if (!lobbyStream) {
          setLobbyStream(stream);
        } else {
          const audioTrack = (await navigator.mediaDevices.getUserMedia({ audio: true })).getAudioTracks()[0];
          stream.addTrack(audioTrack);
        }

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        lobbyAnalyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        lobbySpeakingIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const speaking = avg > 15;
          setLobbySpeaking(prev => {
            if (prev[socket.id || ''] !== speaking) {
              socket.emit('lobby:speaking', { roomId, speaking });
            }
            return { ...prev, [socket.id || '']: speaking };
          });
        }, 150);

        setLobbyMic(true);
        broadcastMediaStatus(true, lobbyCam);
      } catch {
        console.error('Mic access denied');
      }
    }
  };

  const toggleLobbyCam = async () => {
    if (lobbyCam) {
      if (lobbyStream) {
        lobbyStream.getVideoTracks().forEach(t => t.stop());
        if (!lobbyMic) {
          lobbyStream.getTracks().forEach(t => t.stop());
          setLobbyStream(null);
        }
      }
      setLobbyCam(false);
      broadcastMediaStatus(lobbyMic, false);
    } else {
      try {
        const stream = lobbyStream || await navigator.mediaDevices.getUserMedia({ audio: lobbyMic, video: true });
        if (!lobbyStream) {
          setLobbyStream(stream);
        } else {
          const videoTrack = (await navigator.mediaDevices.getUserMedia({ video: true })).getVideoTracks()[0];
          stream.addTrack(videoTrack);
        }
        setLobbyCam(true);
        broadcastMediaStatus(lobbyMic, true);
      } catch {
        console.error('Cam access denied');
      }
    }
  };

  const handleLeaveRoom = () => {
    if (lobbyStream) {
      lobbyStream.getTracks().forEach(t => t.stop());
      setLobbyStream(null);
    }
    if (lobbySpeakingIntervalRef.current) clearInterval(lobbySpeakingIntervalRef.current);
    socket.emit('room:leave', { roomId });
    router.push('/');
  };

  // Cleanup lobby stream on phase change
  useEffect(() => {
    if (room?.phase !== 'lobby' && lobbyStream) {
      lobbyStream.getTracks().forEach(t => t.stop());
      setLobbyStream(null);
      if (lobbySpeakingIntervalRef.current) clearInterval(lobbySpeakingIntervalRef.current);
    }
  }, [room?.phase, lobbyStream]);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    getAudio().playSFX('message');
    socket.emit('chat:send', { text: chatInput });
    setChatInput('');
  };

  if (!room) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full">
          {connectionError ? (
            <>
              <div className="text-4xl mb-4">😕</div>
              <h2 className="text-xl font-bold mb-2 text-[var(--accent-red)]">Room Tidak Ditemukan</h2>
              <p className="text-[var(--text-secondary)] mb-6">{connectionError}</p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => {
                  setConnectionError(null);
                  getSocket().emit('room:request', { roomId });
                }}>Coba Lagi</button>
                <button className="btn-primary flex-1" onClick={() => router.push('/')}>Kembali ke Home</button>
              </div>
            </>
          ) : (
            <>
              <div className="animate-pulse text-2xl mb-4">Menghubungkan...</div>
              <p className="text-[var(--text-secondary)] mb-4">Room: {roomId}</p>
              <button className="btn-secondary text-sm" onClick={() => router.push('/')}>Kembali ke Home</button>
            </>
          )}
        </div>
      </main>
    );
  }

  // LOBBY
  if (room.phase === 'lobby') {
    const nonGodPlayers = players.filter(p => !p.isGod);
    const nonGodCount = nonGodPlayers.length;
    const maxP = room.maxPlayers || 20;

    return (
      <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
        {/* Room info header */}
        <div className="card text-center">
          <h1 className="text-2xl font-black mb-1">{room.name}</h1>
          <p className="text-[var(--text-secondary)]">
            Kode Room: <span className="text-[var(--accent-red)] font-mono font-bold text-lg">{room.id}</span>
          </p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Bagikan kode ini ke teman-teman kamu!</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          {/* Left: Players + controls */}
          <div className="card flex-1 flex flex-col">
            <h2 className="font-bold mb-3">Pemain ({nonGodCount}/{maxP})</h2>

            {/* Player grid with video */}
            <div className="grid grid-cols-2 gap-2 mb-4 flex-1 overflow-y-auto scrollbar-thin">
              {/* God / Host */}
              {players.filter(p => p.isGod).map(p => (
                <LobbyPlayerCard key={p.id} player={p} isMe={p.id === socket.id} isSpeaking={lobbySpeaking[p.id]} lobbyStream={p.id === socket.id ? lobbyStream : lobbyRemoteStreams[p.id]} mediaStatus={p.id === socket.id ? { mic: lobbyMic, cam: lobbyCam } : lobbyMediaStatus[p.id]} />
              ))}
              {/* Non-god players */}
              {nonGodPlayers.map(p => (
                <LobbyPlayerCard key={p.id} player={p} isMe={p.id === socket.id} isSpeaking={lobbySpeaking[p.id]} lobbyStream={p.id === socket.id ? lobbyStream : lobbyRemoteStreams[p.id]} mediaStatus={p.id === socket.id ? { mic: lobbyMic, cam: lobbyCam } : lobbyMediaStatus[p.id]} />
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, maxP - nonGodCount) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-center p-3 rounded-lg opacity-20 min-h-[60px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span className="text-xs text-white/30">Menunggu...</span>
                </div>
              ))}
            </div>

            {/* Mic & Cam toggles */}
            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  lobbyMic
                    ? 'text-[var(--accent-green)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                style={{
                  background: lobbyMic ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${lobbyMic ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
                onClick={toggleLobbyMic}
              >
                {lobbyMic ? '🎤 Mic ON' : '🔇 Mic OFF'}
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  lobbyCam
                    ? 'text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                style={{
                  background: lobbyCam ? 'rgba(9,132,227,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${lobbyCam ? 'rgba(9,132,227,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
                onClick={toggleLobbyCam}
              >
                {lobbyCam ? '📹 Cam ON' : '📷 Cam OFF'}
              </button>
            </div>

            {/* Start button or waiting */}
            {isGod ? (
              <button
                className="btn-primary w-full"
                disabled={nonGodCount < 4}
                onClick={() => socket.emit('game:start')}
              >
                {nonGodCount < 4
                  ? `Butuh minimal 4 pemain (sekarang ${nonGodCount})`
                  : `Mulai Game (${nonGodCount} pemain)`
                }
              </button>
            ) : (
              <p className="text-center text-[var(--text-secondary)] text-sm py-2">
                Menunggu Head of Data memulai game...
              </p>
            )}

            {/* Leave button */}
            <button
              className="btn-secondary w-full mt-3 text-sm"
              onClick={handleLeaveRoom}
            >
              Keluar Room
            </button>
          </div>

          {/* Right: Lobby chat */}
          <div className="card flex-1 flex flex-col min-h-[300px]">
            <h2 className="font-bold mb-3">💬 Lobby Chat</h2>
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-3" style={{ maxHeight: '400px' }}>
              {room.messages.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada pesan. Sapa teman-teman kamu!</p>
              )}
              {room.messages.map(msg => (
                <div key={msg.id} className={`text-sm ${msg.isSystem ? 'text-[var(--text-secondary)] italic' : ''}`}>
                  {!msg.isSystem && (
                    <span className="font-bold text-[var(--accent-red)]">{msg.senderName}: </span>
                  )}
                  <span>{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Tulis pesan..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
              />
              <button className="btn-primary text-sm px-4" onClick={handleChat}>Kirim</button>
            </div>
          </div>
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

  // ARCHITECT REVENGE
  if (architectRevenge && room.myRole === 'data_architect') {
    return (
      <main className="flex-1 flex items-center justify-center p-4 phase-night">
        <div className="card max-w-md w-full text-center">
          <ChibiCharacter roleId="data_architect" size={100} isAlive={false} />
          <h2 className="text-xl font-black mt-4 mb-2 text-[var(--accent-red)]">System Redesign!</h2>
          <p className="text-[var(--text-secondary)] mb-4">Kamu sudah dipecat, tapi kamu bisa membawa 1 orang ikut bersamamu!</p>
          <div className="grid grid-cols-2 gap-2">
            {players.filter(p => p.isAlive && !p.isGod && p.id !== socket.id).map(p => (
              <button
                key={p.id}
                className="card flex items-center gap-2 hover:border-[var(--accent-red)] cursor-pointer transition-all"
                onClick={() => {
                  getAudio().playSFX('kill');
                  socket.emit('architect:target', { targetId: p.id });
                  setArchitectRevenge(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold">{p.name}</span>
              </button>
            ))}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            {players.filter(p => !p.isGod).map(p => {
              const role = p.roleId ? ROLES[p.roleId] : null;
              return (
                <div key={p.id} className={`p-3 rounded-lg ${!p.isAlive ? 'opacity-50' : ''}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    {p.roleId && <ChibiCharacter roleId={p.roleId} size={40} isAlive={p.isAlive} showName={false} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <p className="text-xs font-bold" style={{
                        color: role?.team === 'insider' ? 'var(--accent-red)' : role?.team === 'data' ? 'var(--accent-green)' : 'var(--accent-gold)'
                      }}>
                        {role?.name || '???'}
                      </p>
                    </div>
                    {!p.isAlive && <span className="text-xs text-[var(--accent-red)] whitespace-nowrap">DIPECAT</span>}
                  </div>
                  {role && (
                    <div className="text-xs text-[var(--text-secondary)] pl-12">
                      <p><span className="text-[var(--accent-blue)]">{role.skillName}</span> — {role.skillDescription}</p>
                    </div>
                  )}
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
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowRoleBook(true)}>
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
                    {isGod && role && (
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
          {/* Video Call - only alive players can join */}
          {(players.find(p => p.id === socket.id)?.isAlive || isGod) && (
            <VideoChat
              roomId={room.id}
              playerId={socket.id || ''}
              playerName={players.find(p => p.id === socket.id)?.name || ''}
              isActive={room.phase === 'day'}
              players={alivePlayers}
            />
          )}

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

      {/* Role Book Modal */}
      {showRoleBook && myRole && !isGod && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRoleBook(false)}>
          <div className="card max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-white/50 hover:text-white text-xl" onClick={() => setShowRoleBook(false)}>✕</button>

            <div className="flex items-center gap-4 mb-4">
              <ChibiCharacter roleId={room.myRole!} size={64} showName={false} />
              <div>
                <h2 className="text-xl font-black">{myRole.name}</h2>
                <p className="text-xs font-bold" style={{
                  color: myRole.team === 'insider' ? 'var(--accent-red)' : myRole.team === 'data' ? 'var(--accent-green)' : 'var(--accent-gold)'
                }}>
                  {myRole.team === 'insider' ? 'Insider Threat' : myRole.team === 'data' ? 'Data Division' : 'Freelancer'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{myRole.position}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-bold text-[var(--accent-blue)] mb-1">Skill: {myRole.skillName}</p>
                <p className="text-sm">{myRole.skillDescription}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Timing: {myRole.skillTiming === 'night' ? 'Malam' : myRole.skillTiming === 'day' ? 'Siang' : 'Pasif'}</p>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-bold text-[var(--accent-gold)] mb-1">Lore</p>
                <p className="text-sm text-[var(--text-secondary)] italic">{myRole.lore}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
