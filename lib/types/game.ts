export type RoomStatus = "lobby" | "in_round" | "closed";

export type PlayerStatus = "active" | "benched" | "disconnected";

export interface Player {
  id: string;
  nickname: string;
  sessionToken: string;
  connected: boolean;
  status: PlayerStatus;
  points: number;
  isAdmin: boolean;
  lastHeartbeat: number;
}

export interface WordEntry {
  word: string;
  normalized: string;
  category: string;
  authorIds: string[]; // Puede tener múltiples autores si la palabra se repite
  createdAt: number;
}

export type RoundPhase = "idle" | "clues" | "vote" | "revote" | "result" | "resolution";

export interface Vote {
  voterId: string;
  targetId: string;
  isRevote?: boolean;
}

// Resultado de votación para mostrar al cliente
export interface VoteResult {
  eliminatedId: string;
  eliminatedNickname: string;
  wasImpostor: boolean;
  // Conteo de votos por jugador
  voteCount: Record<string, number>;
  // Quién votó a quién
  voteDetails: { voterId: string; targetId: string }[];
}

export interface RoundState {
  id: string;
  phase: RoundPhase;
  secretWord: string;
  category: string;
  wordAuthorIds: string[]; // Autores de la palabra (pueden ser varios si hubo duplicado)
  impostorIds: string[];
  starterId: string;
  votes: Vote[];
  revoteCandidates: string[];
  accusedId?: string;
  impostorGuessPending: boolean;
  winner?: "impostor" | "villagers";
  createdAt: number;
  // Resultado de la última votación (para mostrar)
  lastVoteResult?: VoteResult;
}

export interface RoundSummary {
  roundId: string;
  winner: "impostor" | "villagers";
  accusedId?: string;
  impostorGuessSuccess?: boolean;
  pointsAwarded: Record<string, number>;
}

export interface RoomConfig {
  impostorCount: number;
}

export interface RoomState {
  id: string;
  status: RoomStatus;
  adminId: string;
  players: Record<string, Player>;
  dictionary: Record<string, WordEntry>;
  round: RoundState | null;
  history: RoundSummary[];
  config: RoomConfig;
  createdAt: number;
}

// Public shapes for client consumption (sin tokens ni campos sensibles)
export interface PublicPlayer {
  id: string;
  nickname: string;
  status: PlayerStatus;
  points: number;
  isAdmin: boolean;
  connected: boolean;
}

export interface PublicRoundState {
  id: string;
  phase: RoundPhase;
  category: string;
  starterId: string;
  votes: Vote[];
  revoteCandidates: string[];
  accusedId?: string;
  impostorGuessPending: boolean;
  winner?: "impostor" | "villagers";
  // Solo visible para no-impostores
  secretWord?: string;
  // Solo visible para impostores
  impostorIds?: string[];
  // Resultado de la última votación (para mostrar)
  lastVoteResult?: VoteResult;
  // Indica si la votación está abierta (útil para reabrir revotes)
  votingOpen?: boolean;
  // Cantidad de votos recibidos (para saber cuántos faltan)
  totalVotesReceived: number;
  totalVotesNeeded: number;
}

export interface PublicRoomState {
  id: string;
  status: RoomStatus;
  adminId: string;
  players: Record<string, PublicPlayer>;
  dictionary: Record<string, WordEntry>; // Solo las palabras del viewer
  dictionaryCount: number; // Total de palabras en el diccionario
  round: PublicRoundState | null;
  history: RoundSummary[];
  config: RoomConfig;
  createdAt: number;
}
