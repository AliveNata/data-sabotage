import { Phase } from './roles';

export interface Player {
  id: string;
  name: string;
  roleId: string | null;
  isAlive: boolean;
  isGod: boolean;
  skillUsed: boolean;
  blockedThisNight: boolean;
  protectedThisNight: boolean;
  dbaReviveUsed: boolean;
  dpmSkillUsed: boolean;
  internSkillUsed: boolean;
  annotations: Record<string, string>;
}

export interface NightAction {
  actorId: string;
  roleId: string;
  skillName: string;
  targetIds: string[];
  result?: string;
}

export interface VoteEntry {
  voterId: string;
  targetId: string;
  weight: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
  visibleTo: string[] | 'all';
}

export interface GameRoom {
  id: string;
  name: string;
  godId: string;
  players: Record<string, Player>;
  phase: Phase;
  round: number;
  maxPlayers: number;
  debateTimer: number;
  voteTimer: number;
  timerEndAt: number | null;
  nightActions: NightAction[];
  votes: VoteEntry[];
  messages: ChatMessage[];
  eliminatedTonight: string | null;
  nightVisits: Record<string, string[]>;
  deadMessages: ChatMessage[];
  winner: 'insider' | 'data' | 'freelancer' | null;
  annotatorLabels: Record<string, 'suspect' | 'clean'>;
  boostedPlayerId: string | null;
  architectTargetId: string | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  playerCount: number;
  phase: Phase;
}
