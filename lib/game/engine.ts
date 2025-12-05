import {
  type Player,
  type PublicPlayer,
  type PublicRoomState,
  type PublicRoundState,
  type RoomState,
  type RoundState,
  type RoundSummary,
  type VoteResult,
  type WordEntry,
} from "@/lib/types/game";
import { pickRandom, shuffle } from "@/lib/utils/random";
import { clamp, normalizeWord, shortId } from "@/lib/utils/strings";

const now = () => Date.now();

const toPublicPlayer = (player: Player): PublicPlayer => ({
  id: player.id,
  nickname: player.nickname,
  status: player.status,
  points: player.points,
  isAdmin: player.isAdmin,
  connected: player.connected,
});

const toPublicRound = (
  round: RoundState,
  viewerId: string,
  room: RoomState,
): PublicRoundState => {
  const isImpostor = round.impostorIds.includes(viewerId);
  const activeIds = activePlayers(room).map((p) => p.id);
  const isRevote = round.phase === "revote";
  const currentVotes = round.votes.filter((v) => 
    isRevote ? v.isRevote : !v.isRevote
  );
  
  return {
    id: round.id,
    phase: round.phase,
    category: round.category,
    starterId: round.starterId,
    votes: round.votes,
    revoteCandidates: round.revoteCandidates,
    accusedId: round.accusedId,
    impostorGuessPending: round.impostorGuessPending,
    winner: round.winner,
    secretWord: isImpostor ? undefined : round.secretWord,
    impostorIds: isImpostor ? round.impostorIds : undefined,
    lastVoteResult: round.lastVoteResult,
    totalVotesReceived: currentVotes.length,
    totalVotesNeeded: activeIds.length,
  };
};

export const toPublicRoom = (
  room: RoomState,
  viewerId: string,
): PublicRoomState => {
  // Filtrar diccionario: cada jugador solo ve sus propias palabras
  const viewerDictionary = Object.fromEntries(
    Object.entries(room.dictionary).filter(([, entry]) => entry.authorId === viewerId)
  );

  return {
    id: room.id,
    status: room.status,
    adminId: room.adminId,
    players: Object.fromEntries(
      Object.entries(room.players).map(([id, p]) => [id, toPublicPlayer(p)]),
    ),
    dictionary: viewerDictionary,
    dictionaryCount: Object.keys(room.dictionary).length,
    round: room.round ? toPublicRound(room.round, viewerId, room) : null,
    history: room.history,
    config: room.config,
    createdAt: room.createdAt,
  };
};

const activePlayers = (room: RoomState) =>
  Object.values(room.players).filter((p) => p.status === "active");

export const createRoom = (
  roomId: string,
  nickname: string,
): { room: RoomState; player: Player } => {
  const player: Player = {
    id: shortId(),
    nickname,
    sessionToken: shortId(),
    connected: true,
    status: "active",
    points: 0,
    isAdmin: true,
    lastHeartbeat: now(),
    blockedForImpostor: false,
  };

  const room: RoomState = {
    id: roomId,
    status: "lobby",
    adminId: player.id,
    players: { [player.id]: player },
    dictionary: {},
    round: null,
    history: [],
    config: {
      impostorCount: 1,
    },
    createdAt: now(),
  };

  return { room, player };
};

export const addPlayer = (room: RoomState, nickname: string): Player => {
  const player: Player = {
    id: shortId(),
    nickname,
    sessionToken: shortId(),
    connected: true,
    status: "active",
    points: 0,
    isAdmin: false,
    lastHeartbeat: now(),
    blockedForImpostor: false,
  };
  room.players[player.id] = player;
  return player;
};

export const findPlayerBySession = (
  room: RoomState,
  sessionToken: string,
): Player | undefined =>
  Object.values(room.players).find((p) => p.sessionToken === sessionToken);

export const reconnectPlayer = (player: Player) => {
  player.connected = true;
  player.status = player.status === "disconnected" ? "active" : player.status;
  player.lastHeartbeat = now();
};

export const markDisconnected = (player?: Player) => {
  if (!player) return;
  player.connected = false;
  player.status = "disconnected";
};

export const updateConfig = (room: RoomState, impostorCount: number) => {
  const activeCount = activePlayers(room).length;
  const max = Math.max(1, Math.ceil(activeCount / 3));
  room.config.impostorCount = clamp(impostorCount, 1, max);
};

export const addWord = (
  room: RoomState,
  playerId: string,
  word: string,
  category: string,
): { added: boolean; entry?: WordEntry } => {
  const normalized = normalizeWord(word);
  if (room.dictionary[normalized]) {
    const player = room.players[playerId];
    if (player) player.blockedForImpostor = true;
    return { added: false };
  }
  const entry: WordEntry = {
    word: word.trim(),
    normalized,
    category: category.trim(),
    authorId: playerId,
    createdAt: now(),
  };
  room.dictionary[normalized] = entry;
  return { added: true, entry };
};

const eligibleForRound = (room: RoomState) =>
  Object.values(room.players).filter((p) => p.status === "active");

const computeImpostors = (room: RoomState, authorId: string) => {
  const players = eligibleForRound(room).filter(
    (p) => p.id !== authorId && !p.blockedForImpostor,
  );
  const maxAllowed = Math.max(1, Math.ceil(players.length / 3));
  const impostorCount = clamp(room.config.impostorCount, 1, maxAllowed);
  const shuffled = shuffle(players);
  return shuffled.slice(0, impostorCount).map((p) => p.id);
};

const pickSecretWord = (room: RoomState) => {
  const words = Object.values(room.dictionary);
  if (!words.length) throw new Error("No hay palabras en el diccionario");
  return pickRandom(words);
};

export const startRound = (room: RoomState): RoundState => {
  const participants = eligibleForRound(room);
  if (participants.length < 3) {
    throw new Error("Se necesitan al menos 3 jugadores activos");
  }

  const secret = pickSecretWord(room);
  const impostorIds = computeImpostors(room, secret.authorId);
  // Elegir quién empieza aleatoriamente
  const starterId = pickRandom(participants).id;

  const round: RoundState = {
    id: shortId(),
    phase: "clues",
    secretWord: secret.word,
    category: secret.category,
    wordAuthorId: secret.authorId,
    impostorIds,
    starterId,
    votes: [],
    revoteCandidates: [],
    accusedId: undefined,
    impostorGuessPending: false,
    winner: undefined,
    createdAt: now(),
  };

  // liberar bloqueos de duplicados para la siguiente ronda
  Object.values(room.players).forEach((p) => {
    if (p.blockedForImpostor) p.blockedForImpostor = false;
  });

  room.round = round;
  room.status = "in_round";
  return round;
};

const tallyVotes = (votes: { voterId: string; targetId: string }[]) => {
  const counts: Record<string, number> = {};
  votes.forEach((v) => {
    counts[v.targetId] = (counts[v.targetId] ?? 0) + 1;
  });
  const max = Math.max(...Object.values(counts));
  const top = Object.entries(counts)
    .filter(([, count]) => count === max)
    .map(([id]) => id);
  return { top, max, counts };
};

// Genera el resultado de votación para mostrar
const buildVoteResult = (
  room: RoomState,
  round: RoundState,
  eliminatedId: string,
  votes: { voterId: string; targetId: string }[],
): VoteResult => {
  const eliminated = room.players[eliminatedId];
  const { counts } = tallyVotes(votes);
  
  return {
    eliminatedId,
    eliminatedNickname: eliminated?.nickname ?? "Desconocido",
    wasImpostor: round.impostorIds.includes(eliminatedId),
    voteCount: counts,
    voteDetails: votes.map((v) => ({ voterId: v.voterId, targetId: v.targetId })),
  };
};

export const registerVote = (
  room: RoomState,
  voterId: string,
  targetId: string,
  isRevote?: boolean,
): { state: "pending" | "revote" | "result" | "resolution" } => {
  const round = room.round;
  if (!round) throw new Error("No hay ronda en curso");
  if (round.phase !== "vote" && round.phase !== "revote") {
    throw new Error("No es fase de votación");
  }

  const activeIds = activePlayers(room).map((p) => p.id);
  if (!activeIds.includes(voterId)) {
    throw new Error("El jugador no puede votar");
  }

  const collection = round.votes;
  const existingIdx = collection.findIndex(
    (v) => v.voterId === voterId && v.isRevote === isRevote,
  );
  if (existingIdx >= 0) collection.splice(existingIdx, 1);
  collection.push({ voterId, targetId, isRevote });

  const neededVotes = activeIds.length;
  const currentVotes = collection.filter(
    (v) => (round.phase === "revote" ? v.isRevote : !v.isRevote),
  );
  if (currentVotes.length < neededVotes) {
    return { state: "pending" };
  }

  const { top } = tallyVotes(currentVotes);

  if (top.length > 1 && round.phase === "vote") {
    round.phase = "revote";
    round.revoteCandidates = top;
    round.votes = [];
    round.lastVoteResult = undefined;
    return { state: "revote" };
  }

  if (top.length > 1 && round.phase === "revote") {
    // Empate en revote: seguir votando entre los mismos candidatos
    round.votes = [];
    round.lastVoteResult = undefined;
    return { state: "revote" };
  }

  // Hay un ganador de la votación
  round.accusedId = top[0];
  const accusedIsImpostor = round.impostorIds.includes(round.accusedId);
  
  // Generar resultado de votación
  round.lastVoteResult = buildVoteResult(room, round, round.accusedId, currentVotes);
  
  // Benchear al acusado inmediatamente
  const accusedPlayer = room.players[round.accusedId];
  if (accusedPlayer) accusedPlayer.status = "benched";
  
  if (accusedIsImpostor) {
    // Impostor descubierto: ir directo a resolution para que adivine
    round.impostorGuessPending = true;
    round.phase = "resolution";
    return { state: "resolution" };
  }
  
  // No era impostor: mostrar resultado y luego continuar
  round.phase = "result";
  return { state: "result" };
};

// Continuar después de mostrar el resultado de votación (solo para no-impostores)
export const continueAfterResult = (
  room: RoomState,
): { state: "continue" | "survival_win" } => {
  const round = room.round;
  if (!round) throw new Error("No hay ronda en curso");
  if (round.phase !== "result") throw new Error("No está en fase de resultado");
  if (!round.accusedId) throw new Error("No hay acusado");

  // El acusado ya fue bencheado en registerVote
  // Verificar si quedan solo 2 personas activas
  const remainingActive = activePlayers(room);
  if (remainingActive.length <= 2) {
    // Impostor gana por supervivencia
    round.phase = "resolution";
    round.impostorGuessPending = false;
    return { state: "survival_win" };
  }
  
  // Continuar ronda: volver a pistas
  round.phase = "clues";
  round.votes = [];
  round.revoteCandidates = [];
  round.accusedId = undefined;
  round.lastVoteResult = undefined;
  return { state: "continue" };
};

export const openVoting = (room: RoomState) => {
  if (!room.round) throw new Error("No hay ronda en curso");
  room.round.phase = "vote";
  room.round.votes = [];
  room.round.revoteCandidates = [];
};

export const resolveImpostorGuess = (
  room: RoomState,
  success: boolean,
): RoundSummary | null => {
  const round = room.round;
  if (!round) throw new Error("No hay ronda en curso");
  if (!round.impostorGuessPending) {
    throw new Error("No se espera un intento del impostor");
  }

  round.impostorGuessPending = false;
  const pointsAwarded: Record<string, number> = {};

  if (success) {
    // Impostor adivinó la palabra: +2 para quien adivinó, +1 otros impostores
    round.winner = "impostor";
    const guesser = round.accusedId ?? round.impostorIds[0];
    if (guesser) pointsAwarded[guesser] = 2;
    round.impostorIds
      .filter((id) => id !== guesser)
      .forEach((id) => {
        pointsAwarded[id] = 1;
      });

    // Aplicar puntos
    Object.entries(pointsAwarded).forEach(([id, pts]) => {
      const player = room.players[id];
      if (player) player.points += pts;
    });

    // Reactivar jugadores bencheados y terminar ronda
    Object.values(room.players).forEach((p) => {
      if (p.status === "benched") p.status = "active";
    });

    const summary: RoundSummary = {
      roundId: round.id,
      winner: round.winner,
      accusedId: round.accusedId,
      impostorGuessSuccess: true,
      pointsAwarded,
    };

    room.history.push(summary);
    room.round = null;
    room.status = "lobby";

    return summary;
  }

  // Impostor no adivinó: nadie suma puntos por ahora
  // Verificar si quedan más impostores activos
  const activeImpostors = round.impostorIds.filter(
    (id) => room.players[id]?.status === "active"
  );

  if (activeImpostors.length === 0) {
    // TODOS los impostores descubiertos y ninguno adivinó: +1 no-impostores
    round.winner = "villagers";
    const impostorSet = new Set(round.impostorIds);
    Object.values(room.players).forEach((p) => {
      if (!impostorSet.has(p.id)) {
        pointsAwarded[p.id] = 1;
        p.points += 1;
      }
    });

    // Reactivar jugadores bencheados
    Object.values(room.players).forEach((p) => {
      if (p.status === "benched") p.status = "active";
    });

    const summary: RoundSummary = {
      roundId: round.id,
      winner: round.winner,
      accusedId: round.accusedId,
      impostorGuessSuccess: false,
      pointsAwarded,
    };

    room.history.push(summary);
    room.round = null;
    room.status = "lobby";

    return summary;
  }

  // Aún hay impostores activos: la ronda continúa
  // Volver a fase de pistas
  round.phase = "clues";
  round.votes = [];
  round.revoteCandidates = [];
  round.accusedId = undefined;

  return null; // La ronda continúa
};

// Cuando quedan solo 2 personas: impostor gana por supervivencia
export const finalizeImpostorWinsBySurvival = (
  room: RoomState,
): RoundSummary => {
  const round = room.round;
  if (!round) throw new Error("No hay ronda en curso");
  round.winner = "impostor";

  const pointsAwarded: Record<string, number> = {};
  
  // +2 para impostores activos (sobrevivientes), +1 para otros impostores
  const activeImpostors = round.impostorIds.filter(
    (id) => room.players[id]?.status === "active"
  );
  
  round.impostorIds.forEach((id) => {
    if (activeImpostors.includes(id)) {
      pointsAwarded[id] = 2;
    } else {
      pointsAwarded[id] = 1;
    }
  });

  // Aplicar puntos
  Object.entries(pointsAwarded).forEach(([id, pts]) => {
    const player = room.players[id];
    if (player) player.points += pts;
  });

  // Reactivar jugadores bencheados
  Object.values(room.players).forEach((p) => {
    if (p.status === "benched") p.status = "active";
  });

  const summary: RoundSummary = {
    roundId: round.id,
    winner: round.winner,
    accusedId: round.accusedId,
    impostorGuessSuccess: false,
    pointsAwarded,
  };

  room.history.push(summary);
  room.round = null;
  room.status = "lobby";

  return summary;
};

export const closeRoom = (room: RoomState) => {
  room.status = "closed";
};

export const kickPlayer = (room: RoomState, targetId: string) => {
  delete room.players[targetId];
  if (room.round) {
    room.round.impostorIds = room.round.impostorIds.filter(
      (id) => id !== targetId,
    );
  }
};

export const hardResetRoundIfNeeded = (room: RoomState) => {
  if (room.round && room.round.phase === "clues") {
    room.round.phase = "vote";
  }
};

export const canStartRound = (room: RoomState) =>
  room.status !== "closed" &&
  !room.round &&
  Object.keys(room.dictionary).length > 0 &&
  eligibleForRound(room).length >= 3;

export const maybeRevokeImpostorPending = (room: RoomState) => {
  if (room.round && !room.round.impostorGuessPending) {
    room.round = null;
    room.status = "lobby";
  }
};

export const markHeartbeat = (player: Player) => {
  player.lastHeartbeat = now();
  if (player.status === "disconnected") player.status = "active";
  player.connected = true;
};
