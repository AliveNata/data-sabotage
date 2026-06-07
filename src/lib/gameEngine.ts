import { GameRoom, Player, NightAction, ChatMessage } from './types';
import { ROLES, assignRoles } from './roles';
import { v4 as uuidv4 } from 'uuid';

export function createRoom(name: string, godId: string, godName: string, maxPlayers = 20, debateTimer = 180, voteTimer = 60): GameRoom {
  const godPlayer: Player = {
    id: godId,
    name: godName,
    roleId: 'head_of_data',
    isAlive: true,
    isGod: true,
    skillUsed: false,
    blockedThisNight: false,
    protectedThisNight: false,
    dbaReviveUsed: false,
    dpmSkillUsed: false,
    internSkillUsed: false,
    annotations: {},
  };

  return {
    id: uuidv4().slice(0, 6).toUpperCase(),
    name,
    godId,
    players: { [godId]: godPlayer },
    phase: 'lobby',
    round: 0,
    maxPlayers,
    debateTimer,
    voteTimer,
    timerEndAt: null,
    nightActions: [],
    votes: [],
    messages: [],
    eliminatedTonight: null,
    nightVisits: {},
    deadMessages: [],
    winner: null,
    annotatorLabels: {},
    boostedPlayerId: null,
    architectTargetId: null,
  };
}

export function addPlayer(room: GameRoom, playerId: string, playerName: string): GameRoom {
  if (room.players[playerId]) return room;
  if (Object.keys(room.players).length >= room.maxPlayers + 1) return room; // +1 for God

  room.players[playerId] = {
    id: playerId,
    name: playerName,
    roleId: null,
    isAlive: true,
    isGod: false,
    skillUsed: false,
    blockedThisNight: false,
    protectedThisNight: false,
    dbaReviveUsed: false,
    dpmSkillUsed: false,
    internSkillUsed: false,
    annotations: {},
  };
  return room;
}

export function removePlayer(room: GameRoom, playerId: string): GameRoom {
  if (playerId === room.godId) return room;
  delete room.players[playerId];
  return room;
}

export function startGame(room: GameRoom): GameRoom | null {
  const nonGodPlayers = Object.values(room.players).filter(p => !p.isGod);
  const count = nonGodPlayers.length;

  if (count < 4 || count > 20) return null;

  const roles = assignRoles(count);
  if (!roles) return null;

  nonGodPlayers.forEach((player, i) => {
    player.roleId = roles[i];
  });

  room.phase = 'intro';
  room.round = 1;

  addSystemMessage(room, '📖 Game dimulai! Head of Data sedang membacakan cerita pembukaan...', 'all');

  return room;
}

export function transitionToNight(room: GameRoom): GameRoom {
  room.phase = 'night';
  room.nightActions = [];
  room.nightVisits = {};
  room.eliminatedTonight = null;

  Object.values(room.players).forEach(p => {
    p.blockedThisNight = false;
    p.protectedThisNight = false;
  });

  addSystemMessage(room, `🌙 Malam hari ke-${room.round}. Semua karyawan "pulang"... tapi ada yang masih bekerja dalam gelap.`, 'all');

  return room;
}

export function transitionToDay(room: GameRoom): GameRoom {
  room.phase = 'day';
  room.votes = [];
  room.boostedPlayerId = null;
  room.timerEndAt = room.debateTimer > 0 ? Date.now() + room.debateTimer * 1000 : null;

  addSystemMessage(room, `☀️ Pagi hari ke-${room.round}. Saatnya Daily Standup!`, 'all');

  if (room.eliminatedTonight) {
    const victim = room.players[room.eliminatedTonight];
    if (victim) {
      addSystemMessage(room, `💀 ${victim.name} ditemukan "dipecat" pagi ini.`, 'all');
    }
  } else {
    addSystemMessage(room, '✅ Semua selamat malam ini. Tidak ada yang dipecat.', 'all');
  }

  if (Object.keys(room.annotatorLabels).length > 0) {
    for (const [targetId, label] of Object.entries(room.annotatorLabels)) {
      const target = room.players[targetId];
      if (target) {
        addSystemMessage(room, `🏷️ Data Annotator melabeli ${target.name} sebagai: ${label.toUpperCase()}`, 'all');
      }
    }
    room.annotatorLabels = {};
  }

  return room;
}

export function processNightAction(room: GameRoom, action: NightAction): { room: GameRoom; result: string } {
  const actor = room.players[action.actorId];
  if (!actor || !actor.isAlive) return { room, result: 'Player tidak valid.' };

  if (actor.blockedThisNight && action.roleId !== 'rogue_admin') {
    return { room, result: `${actor.name} di-block oleh Rogue Admin! Skill tidak bisa dipakai malam ini.` };
  }

  action.targetIds.forEach(tid => {
    if (!room.nightVisits[action.actorId]) room.nightVisits[action.actorId] = [];
    room.nightVisits[action.actorId].push(tid);
  });

  switch (action.roleId) {
    case 'shadow_analyst': {
      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      if (target.protectedThisNight) {
        return { room, result: `${target.name} di-protect! Serangan gagal.` };
      }

      if (target.roleId === 'dba' && !target.dbaReviveUsed) {
        target.dbaReviveUsed = true;
        return { room, result: `${target.name} adalah DBA! Auto Recovery aktif, mereka selamat.` };
      }

      target.isAlive = false;
      room.eliminatedTonight = targetId;

      if (target.roleId === 'data_architect') {
        room.architectTargetId = targetId;
      }

      return { room, result: `${target.name} berhasil di-corrupt. Mereka akan "dipecat" besok pagi.` };
    }

    case 'rogue_admin': {
      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      target.blockedThisNight = true;
      return { room, result: `${target.name} di-block! Access mereka di-revoke malam ini.` };
    }

    case 'data_steward': {
      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      const role = ROLES[target.roleId!];
      if (!role) return { room, result: 'Role tidak ditemukan.' };

      if (target.roleId === 'mole_engineer') {
        return { room, result: `Hasil scan: ${target.name} terlihat CLEAN (tapi ini bisa jadi palsu...).` };
      }

      const isClean = role.team === 'data' || role.team === 'freelancer';
      return { room, result: `Hasil scan: ${target.name} adalah ${isClean ? 'CLEAN ✅' : 'THREAT ⚠️'}` };
    }

    case 'data_engineer': {
      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      target.protectedThisNight = true;
      return { room, result: `${target.name} di-protect malam ini. Pipeline backup aktif.` };
    }

    case 'data_scientist': {
      const [t1, t2] = action.targetIds;
      const p1 = room.players[t1];
      const p2 = room.players[t2];
      if (!p1 || !p2) return { room, result: 'Target tidak valid.' };

      const r1 = ROLES[p1.roleId!];
      const r2 = ROLES[p2.roleId!];
      const hasEvil = r1?.team === 'insider' || r2?.team === 'insider';

      return { room, result: `Prediksi: Di antara ${p1.name} dan ${p2.name}, ${hasEvil ? 'ADA threat ⚠️' : 'TIDAK ADA threat ✅'}` };
    }

    case 'data_analyst': {
      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      return { room, result: `Dashboard Report akan siap besok pagi. Kamu akan melihat siapa yang interact dengan ${target.name}.` };
    }

    case 'data_quality_engineer': {
      const visits: string[] = [];
      for (const [visitorId, targets] of Object.entries(room.nightVisits)) {
        const visitor = room.players[visitorId];
        if (visitor) {
          targets.forEach(tid => {
            const t = room.players[tid];
            if (t) visits.push(`${visitor.name} → ${t.name}`);
          });
        }
      }
      return { room, result: visits.length > 0 ? `Audit Trail malam ini:\n${visits.join('\n')}` : 'Tidak ada aktivitas terdeteksi malam ini.' };
    }

    case 'analytics_engineer': {
      const targetId = action.targetIds[0];
      room.boostedPlayerId = targetId;
      const target = room.players[targetId];
      return { room, result: `Vote ${target?.name || 'unknown'} akan di-boost 2x di Daily Standup besok.` };
    }

    case 'data_annotator': {
      const targetId = action.targetIds[0];
      const label = (action.result as 'suspect' | 'clean') || 'suspect';
      room.annotatorLabels[targetId] = label;
      const target = room.players[targetId];
      return { room, result: `${target?.name || 'unknown'} dilabeli sebagai ${label.toUpperCase()}. Akan terlihat besok pagi.` };
    }

    case 'ml_engineer': {
      const [t1, t2] = action.targetIds;
      const p1 = room.players[t1];
      const p2 = room.players[t2];
      if (!p1 || !p2) return { room, result: 'Target tidak valid.' };

      const r1 = ROLES[p1.roleId!];
      const r2 = ROLES[p2.roleId!];
      const hasAnomaly = r1?.team === 'insider' || r2?.team === 'insider';

      return { room, result: `Anomaly Detection: Di antara ${p1.name} dan ${p2.name}, ${hasAnomaly ? 'ANOMALI TERDETEKSI ⚠️' : 'NORMAL ✅'}` };
    }

    case 'bi_analyst': {
      const deadPlayers = Object.values(room.players).filter(p => !p.isAlive && !p.isGod);
      if (deadPlayers.length === 0) return { room, result: 'Belum ada player yang tereliminasi.' };

      const lastDead = deadPlayers[deadPlayers.length - 1];
      const deadRole = ROLES[lastDead.roleId!];
      return { room, result: `Legacy Report dari ${lastDead.name}: Mereka adalah ${deadRole?.name || 'Unknown'} (${deadRole?.team || 'unknown'} team).` };
    }

    case 'data_product_manager': {
      if (actor.dpmSkillUsed) return { room, result: 'Emergency Sprint sudah pernah dipakai!' };

      const targetId = action.targetIds[0];
      const target = room.players[targetId];
      if (!target) return { room, result: 'Target tidak valid.' };

      actor.protectedThisNight = true;
      target.protectedThisNight = true;
      actor.dpmSkillUsed = true;

      return { room, result: `EMERGENCY SPRINT! ${actor.name} dan ${target.name} di-protect malam ini.` };
    }

    default:
      return { room, result: 'Skill tidak dikenali.' };
  }
}

export function processVoting(room: GameRoom): { room: GameRoom; eliminatedId: string | null } {
  const voteCounts: Record<string, number> = {};

  room.votes.forEach(vote => {
    const weight = room.boostedPlayerId === vote.voterId ? 2 : vote.weight;
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + weight;
  });

  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  for (const [targetId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = targetId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  if (isTie || !eliminatedId) {
    addSystemMessage(room, '⚖️ Voting seri! Tidak ada yang dieliminasi hari ini.', 'all');
    return { room, eliminatedId: null };
  }

  const target = room.players[eliminatedId];
  if (!target) return { room, eliminatedId: null };

  if (target.roleId === 'data_intern' && !target.internSkillUsed) {
    target.internSkillUsed = true;
    addSystemMessage(room, `🎒 ${target.name} menggunakan Magang Privilege! "Maaf pak, saya masih belajar..." Voting dibatalkan!`, 'all');
    return { room, eliminatedId: null };
  }

  target.isAlive = false;
  const role = ROLES[target.roleId!];
  addSystemMessage(room, `🗳️ ${target.name} dieliminasi oleh voting!`, 'all');

  if (target.roleId === 'data_architect') {
    room.architectTargetId = eliminatedId;
  }

  return { room, eliminatedId };
}

export function handleArchitectRevenge(room: GameRoom, targetId: string): GameRoom {
  const target = room.players[targetId];
  if (!target) return room;

  target.isAlive = false;
  const role = ROLES[target.roleId!];
  addSystemMessage(room, `🏗️ Data Architect mengaktifkan System Redesign! ${target.name} (${role?.name || 'Unknown'}) ikut "dipecat"!`, 'all');

  return room;
}

export function checkWinCondition(room: GameRoom): 'insider' | 'data' | 'freelancer' | null {
  const alive = Object.values(room.players).filter(p => p.isAlive && !p.isGod);
  const insiders = alive.filter(p => ROLES[p.roleId!]?.team === 'insider');
  const dataTeam = alive.filter(p => ROLES[p.roleId!]?.team === 'data');
  const consultants = alive.filter(p => p.roleId === 'data_consultant');

  if (insiders.length === 0) return 'data';

  if (insiders.length >= dataTeam.length) return 'insider';

  if (alive.length <= 3 && consultants.length > 0) return 'freelancer';

  return null;
}

export function getDashboardReport(room: GameRoom, targetId: string): string {
  const visitors: string[] = [];
  for (const [visitorId, targets] of Object.entries(room.nightVisits)) {
    if (targets.includes(targetId)) {
      const visitor = room.players[visitorId];
      if (visitor) visitors.push(visitor.name);
    }
  }
  return visitors.length > 0
    ? `📊 Dashboard Report: ${room.players[targetId]?.name} di-visit oleh: ${visitors.join(', ')}`
    : `📊 Dashboard Report: Tidak ada yang visit ${room.players[targetId]?.name} malam ini.`;
}

function addSystemMessage(room: GameRoom, text: string, visibleTo: string[] | 'all') {
  room.messages.push({
    id: uuidv4(),
    senderId: 'system',
    senderName: 'System',
    text,
    timestamp: Date.now(),
    isSystem: true,
    visibleTo,
  });
}
