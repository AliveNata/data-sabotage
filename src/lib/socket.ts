import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getServerUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  if (process.env.NODE_ENV === 'production') return window.location.origin;
  return 'http://localhost:3001';
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerUrl(), {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
