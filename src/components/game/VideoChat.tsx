'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { getSocket } from '@/lib/socket';

interface VideoChatProps {
  roomId: string;
  playerId: string;
  playerName: string;
  isActive: boolean;
  players: Array<{ id: string; name: string; isAlive: boolean; isGod: boolean }>;
}

interface PeerStream {
  peerId: string;
  playerName: string;
  stream: MediaStream;
}

export default function VideoChat({ roomId, playerId, playerName, isActive, players }: VideoChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const cleanupPeer = useCallback(() => {
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
    peerRef.current?.destroy();
    peerRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setPeerStreams([]);
    setJoined(false);
  }, [localStream]);

  useEffect(() => {
    if (!isActive) {
      cleanupPeer();
    }
  }, [isActive, cleanupPeer]);

  useEffect(() => {
    return () => {
      cleanupPeer();
    };
  }, [cleanupPeer]);

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerId = `${roomId}-${playerId}`;
      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peerRef.current = peer;

      peer.on('open', () => {
        setJoined(true);
        const socket = getSocket();
        socket.emit('webrtc:join', { roomId, peerId, playerName });
      });

      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          const remoteName = call.metadata?.playerName || 'Unknown';
          setPeerStreams(prev => {
            const exists = prev.find(p => p.peerId === call.peer);
            if (exists) return prev;
            return [...prev, { peerId: call.peer, playerName: remoteName, stream: remoteStream }];
          });
        });
        call.on('close', () => {
          setPeerStreams(prev => prev.filter(p => p.peerId !== call.peer));
        });
        connectionsRef.current.set(call.peer, call);
      });

      const socket = getSocket();
      socket.on('webrtc:user-joined', (data: { peerId: string; playerName: string }) => {
        if (data.peerId === peerId) return;

        const call = peer.call(data.peerId, stream, {
          metadata: { playerName },
        });

        call.on('stream', (remoteStream) => {
          setPeerStreams(prev => {
            const exists = prev.find(p => p.peerId === data.peerId);
            if (exists) return prev;
            return [...prev, { peerId: data.peerId, playerName: data.playerName, stream: remoteStream }];
          });
        });

        call.on('close', () => {
          setPeerStreams(prev => prev.filter(p => p.peerId !== data.peerId));
        });

        connectionsRef.current.set(data.peerId, call);
      });

      socket.on('webrtc:user-left', (data: { peerId: string }) => {
        const conn = connectionsRef.current.get(data.peerId);
        if (conn) {
          conn.close();
          connectionsRef.current.delete(data.peerId);
        }
        setPeerStreams(prev => prev.filter(p => p.peerId !== data.peerId));
      });

    } catch (err) {
      console.error('Failed to get media devices:', err);
    }
  };

  const leaveCall = () => {
    const socket = getSocket();
    const peerId = `${roomId}-${playerId}`;
    socket.emit('webrtc:leave', { roomId, peerId });
    cleanupPeer();
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(prev => !prev);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(prev => !prev);
    }
  };

  if (!isActive) return null;

  return (
    <div className="border-t border-white/5 p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[var(--accent-blue)]">
          Video Call - Daily Standup
        </h3>
        {!joined ? (
          <button className="btn-primary text-xs py-1 px-3" onClick={joinCall}>
            Gabung Call
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className={`text-xs py-1 px-3 rounded-lg transition-colors ${micOn ? 'bg-[var(--accent-green)] text-white' : 'bg-red-600 text-white'}`}
              onClick={toggleMic}
            >
              {micOn ? 'Mic ON' : 'Mic OFF'}
            </button>
            <button
              className={`text-xs py-1 px-3 rounded-lg transition-colors ${camOn ? 'bg-[var(--accent-green)] text-white' : 'bg-red-600 text-white'}`}
              onClick={toggleCam}
            >
              {camOn ? 'Cam ON' : 'Cam OFF'}
            </button>
            <button className="text-xs py-1 px-3 rounded-lg bg-red-800 text-white" onClick={leaveCall}>
              Keluar
            </button>
          </div>
        )}
      </div>

      {joined && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {/* Local video */}
          <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 bg-black/60 text-xs px-2 py-0.5 rounded">
              {playerName} (Kamu)
            </div>
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]">
                <span className="text-2xl">📷</span>
              </div>
            )}
          </div>

          {/* Remote videos */}
          {peerStreams.map(ps => (
            <RemoteVideo key={ps.peerId} stream={ps.stream} name={ps.playerName} />
          ))}
        </div>
      )}
    </div>
  );
}

function RemoteVideo({ stream, name }: { stream: MediaStream; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 bg-black/60 text-xs px-2 py-0.5 rounded">
        {name}
      </div>
    </div>
  );
}
