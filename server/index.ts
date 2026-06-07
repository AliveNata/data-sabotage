import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createRoom,
  addPlayer,
  removePlayer,
  startGame,
  transitionToNight,
  transitionToDay,
  processNightAction,
  processVoting,
  handleArchitectRevenge,
  checkWinCondition,
  getDashboardReport,
} from '../src/lib/gameEngine';
import { GameRoom, NightAction, VoteEntry, ChatMessage } from '../src/lib/types';
import { ROLES } from '../src/lib/roles';
import { v4 as uuidv4 } from 'uuid';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms: Record<string, GameRoom> = {};

function getPlayerView(room: GameRoom, playerId: string) {
  const player = room.players[playerId];
  const isGod = player?.isGod;

  const players: Record<string, Partial<typeof room.players[string]>> = {};
  for (const [id, p] of Object.entries(room.players)) {
    players[id] = {
      id: p.id,
      name: p.name,
      isAlive: p.isAlive,
      isGod: p.isGod,
      roleId: isGod || id === playerId ? p.roleId : null,
      annotations: p.annotations,
    };
  }

  const messages = room.messages.filter(
    m => m.visibleTo === 'all' || (Array.isArray(m.visibleTo) && m.visibleTo.includes(playerId))
  );

  return {
    id: room.id,
    name: room.name,
    godId: room.godId,
    players,
    phase: room.phase,
    round: room.round,
    maxPlayers: room.maxPlayers,
    debateTimer: room.debateTimer,
    voteTimer: room.voteTimer,
    timerEndAt: room.timerEndAt,
    messages,
    myRole: player?.roleId || null,
    isGod,
    winner: room.winner,
    annotatorLabels: room.annotatorLabels,
    boostedPlayerId: room.boostedPlayerId,
  };
}

function broadcastRoom(room: GameRoom) {
  for (const playerId of Object.keys(room.players)) {
    io.to(playerId).emit('room:update', getPlayerView(room, playerId));
  }
}

function scheduleRoomCleanup(roomId: string) {
  setTimeout(() => {
    if (rooms[roomId] && rooms[roomId].phase === 'gameover') {
      delete rooms[roomId];
      broadcastRoomList();
    }
  }, 60000); // 60 detik setelah game over, hapus room
}

function broadcastRoomList() {
  const list = Object.values(rooms)
    .filter(r => r.phase !== 'gameover') // Hide finished games
    .map(r => ({
      id: r.id,
      name: r.name,
      playerCount: Object.values(r.players).filter(p => !p.isGod).length,
      maxPlayers: r.maxPlayers,
      phase: r.phase,
    }));
  io.emit('rooms:list', list);
}

io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  let playerId = socket.id;
  let playerName = '';

  socket.on('room:create', (data: { name: string; playerName: string; maxPlayers?: number; debateTimer?: number; voteTimer?: number }, callback) => {
    playerName = data.playerName;
    playerId = socket.id;
    socket.join(playerId);

    const room = createRoom(data.name, playerId, playerName, data.maxPlayers || 20, data.debateTimer ?? 180, data.voteTimer ?? 60);
    rooms[room.id] = room;
    currentRoomId = room.id;

    callback({ roomId: room.id });
    broadcastRoom(room);
    broadcastRoomList();
  });

  socket.on('room:request', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) {
      io.to(playerId).emit('room:not-found');
      return;
    }
    if (room.players[playerId]) {
      currentRoomId = data.roomId;
      socket.join(playerId);
      io.to(playerId).emit('room:update', getPlayerView(room, playerId));
    } else {
      io.to(playerId).emit('room:not-found');
    }
  });

  socket.on('room:leave', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (playerId === room.godId) return; // God can't leave
    removePlayer(room, playerId);
    currentRoomId = null;
    if (Object.keys(room.players).length <= 1) {
      delete rooms[data.roomId];
    } else {
      broadcastRoom(room);
    }
    broadcastRoomList();
  });

  socket.on('lobby:media-status', (data: { roomId: string; mic: boolean; cam: boolean }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    // Broadcast to all players in room except sender
    for (const pid of Object.keys(room.players)) {
      if (pid !== playerId) {
        io.to(pid).emit('lobby:media-status', { playerId, mic: data.mic, cam: data.cam });
      }
    }
  });

  socket.on('lobby:speaking', (data: { roomId: string; speaking: boolean }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    for (const pid of Object.keys(room.players)) {
      if (pid !== playerId) {
        io.to(pid).emit('lobby:speaking', { playerId, speaking: data.speaking });
      }
    }
  });

  socket.on('room:join', (data: { roomId: string; playerName: string }, callback) => {
    const room = rooms[data.roomId];
    if (!room) { callback({ error: 'Room tidak ditemukan.' }); return; }
    if (room.phase !== 'lobby') { callback({ error: 'Game sudah dimulai.' }); return; }
    const nonGodCount = Object.values(room.players).filter(p => !p.isGod).length;
    if (nonGodCount >= room.maxPlayers) { callback({ error: 'Room sudah penuh!' }); return; }

    playerName = data.playerName;
    playerId = socket.id;
    socket.join(playerId);

    addPlayer(room, playerId, playerName);
    currentRoomId = data.roomId;

    callback({ roomId: room.id });
    broadcastRoom(room);
    broadcastRoomList();
  });

  socket.on('game:start', () => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.godId !== playerId) return;

    const result = startGame(room);
    if (result) {
      broadcastRoom(result);
      broadcastRoomList();
    }
  });

  socket.on('game:to-night', () => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.godId !== playerId) return;

    transitionToNight(room);
    broadcastRoom(room);
  });

  socket.on('game:to-day', () => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.godId !== playerId) return;

    // Check win after night kills before transitioning
    const nightWinner = checkWinCondition(room);
    if (nightWinner) {
      room.winner = nightWinner;
      room.phase = 'gameover';
      broadcastRoom(room);
      scheduleRoomCleanup(currentRoomId);
      broadcastRoomList();
      return;
    }

    transitionToDay(room);

    const alivePlayers = Object.values(room.players).filter(p => p.isAlive && !p.isGod);
    const analysts = alivePlayers.filter(p => p.roleId === 'data_analyst');
    analysts.forEach(a => {
      const lastAction = room.nightActions.find(na => na.actorId === a.id);
      if (lastAction && lastAction.targetIds[0]) {
        const report = getDashboardReport(room, lastAction.targetIds[0]);
        room.messages.push({
          id: uuidv4(),
          senderId: 'system',
          senderName: 'System',
          text: report,
          timestamp: Date.now(),
          isSystem: true,
          visibleTo: [a.id],
        });
      }
    });

    broadcastRoom(room);
  });

  socket.on('night:action', (data: { targetIds: string[]; extra?: string }) => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room) return;

    const player = room.players[playerId];
    if (!player || !player.isAlive || !player.roleId) return;

    const action: NightAction = {
      actorId: playerId,
      roleId: player.roleId,
      skillName: ROLES[player.roleId]?.skillName || '',
      targetIds: data.targetIds,
      result: data.extra,
    };

    const { result } = processNightAction(room, action);
    room.nightActions.push(action);

    io.to(playerId).emit('night:result', { result });
    io.to(room.godId).emit('god:night-action', {
      actorName: player.name,
      roleName: ROLES[player.roleId]?.name,
      result,
    });
  });

  socket.on('vote:cast', (data: { targetId: string }) => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.phase !== 'day') return;

    const player = room.players[playerId];
    if (!player || !player.isAlive || player.isGod) return;

    room.votes = room.votes.filter(v => v.voterId !== playerId);
    room.votes.push({ voterId: playerId, targetId: data.targetId, weight: 1 });

    broadcastRoom(room);
  });

  socket.on('vote:process', () => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.godId !== playerId) return;

    const { eliminatedId } = processVoting(room);

    if (eliminatedId) {
      const eliminated = room.players[eliminatedId];
      if (eliminated?.roleId === 'data_architect') {
        room.architectTargetId = eliminatedId;
        io.to(eliminatedId).emit('architect:revenge');
      }
    }

    const winner = checkWinCondition(room);
    if (winner) {
      room.winner = winner;
      room.phase = 'gameover';
      scheduleRoomCleanup(currentRoomId!);
    }

    broadcastRoom(room);
    if (winner) broadcastRoomList();
  });

  socket.on('architect:target', (data: { targetId: string }) => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room) return;

    handleArchitectRevenge(room, data.targetId);
    room.architectTargetId = null;

    const winner = checkWinCondition(room);
    if (winner) {
      room.winner = winner;
      room.phase = 'gameover';
      scheduleRoomCleanup(currentRoomId!);
    }

    broadcastRoom(room);
    if (winner) broadcastRoomList();
  });

  socket.on('game:next-round', () => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room || room.godId !== playerId) return;

    room.round++;
    transitionToNight(room);
    broadcastRoom(room);
  });

  socket.on('chat:send', (data: { text: string }) => {
    if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room) return;

    const msg: ChatMessage = {
      id: uuidv4(),
      senderId: playerId,
      senderName: playerName,
      text: data.text,
      timestamp: Date.now(),
      isSystem: false,
      visibleTo: 'all',
    };

    room.messages.push(msg);
    broadcastRoom(room);
  });

  socket.on('webrtc:join', (data: { roomId: string; peerId: string; playerName: string }) => {
    socket.to(Object.keys(rooms[data.roomId]?.players || {})).emit('webrtc:user-joined', {
      peerId: data.peerId,
      playerName: data.playerName,
    });
  });

  socket.on('webrtc:leave', (data: { roomId: string; peerId: string }) => {
    socket.to(Object.keys(rooms[data.roomId]?.players || {})).emit('webrtc:user-left', {
      peerId: data.peerId,
    });
  });

  socket.on('rooms:list', (_, callback) => {
    const list = Object.values(rooms).map(r => ({
      id: r.id,
      name: r.name,
      playerCount: Object.values(r.players).filter(p => !p.isGod).length,
      maxPlayers: r.maxPlayers,
      phase: r.phase,
    }));
    callback(list);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && rooms[currentRoomId]) {
      const room = rooms[currentRoomId];
      if (room.phase === 'lobby') {
        removePlayer(room, playerId);
        if (Object.keys(room.players).length === 0) {
          delete rooms[currentRoomId];
        } else {
          broadcastRoom(room);
        }
        broadcastRoomList();
      }
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
