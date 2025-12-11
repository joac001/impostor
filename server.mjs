/**
 * Servidor WebSocket independiente para desarrollo.
 * Se ejecuta en paralelo con Next.js para evitar problemas con Turbopack.
 * 
 * Uso: node server.mjs
 * El servidor WS correrá en el puerto 3002
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

const WS_PORT = 3002;

// ============================================
// Estado en memoria (replica de lib/server/rooms.ts)
// ============================================
const rooms = new Map();

const getRoom = (roomId) => rooms.get(roomId);
const saveRoom = (room) => {
  rooms.set(room.id, room);
  return room;
};

// ============================================
// Utilidades (replica de lib/utils)
// ============================================
const shortId = () => randomUUID();

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============================================
// Motor del juego (replica simplificada de lib/game/engine.ts)
// ============================================

const createPlayer = (nickname, isAdmin = false) => ({
  id: shortId(),
  sessionToken: shortId(),
  nickname,
  isAdmin,
  points: 0,
  isConnected: true,
  isEliminated: false,
  isKicked: false,
  lastHeartbeat: Date.now(),
});

const createRoom = (roomId, adminNickname) => {
  const admin = createPlayer(adminNickname, true);
  const room = {
    id: roomId,
    adminId: admin.id,
    status: 'lobby',
    players: { [admin.id]: admin },
    dictionary: [],
    config: { impostorCount: 1 },
    round: null,
    roundNumber: 0,
  };
  return { room, player: admin };
};

const addPlayer = (room, nickname) => {
  const player = createPlayer(nickname, false);
  room.players[player.id] = player;
  return player;
};

const findPlayerBySession = (room, sessionToken) => {
  return Object.values(room.players).find((p) => p.sessionToken === sessionToken);
};

const reconnectPlayer = (player) => {
  player.isConnected = true;
  player.lastHeartbeat = Date.now();
};

const markDisconnected = (player) => {
  if (player) player.isConnected = false;
};

const markHeartbeat = (player) => {
  if (player) player.lastHeartbeat = Date.now();
};

const addWord = (room, playerId, word, category) => {
  const normalized = word.trim().toLowerCase();
  const exists = room.dictionary.some((w) => w.word.toLowerCase() === normalized);
  if (exists) {
    // Marcar al jugador como excluido de ser impostor para esta palabra
    const existing = room.dictionary.find((w) => w.word.toLowerCase() === normalized);
    if (existing && !existing.excludedPlayerIds.includes(playerId)) {
      existing.excludedPlayerIds.push(playerId);
    }
    return { added: false };
  }
  room.dictionary.push({
    word: word.trim(),
    category: category.trim(),
    authorId: playerId,
    excludedPlayerIds: [playerId], // El autor no puede ser impostor
    used: false,
  });
  return { added: true };
};

const updateConfig = (room, impostorCount) => {
  const playerCount = Object.values(room.players).filter(
    (p) => !p.isKicked && !p.isEliminated
  ).length;
  const maxImpostors = Math.ceil(playerCount / 3);
  room.config.impostorCount = Math.min(Math.max(1, impostorCount), maxImpostors);
};

const canStartRound = (room) => {
  const activePlayers = Object.values(room.players).filter(
    (p) => !p.isKicked && !p.isEliminated
  );
  const availableWords = room.dictionary.filter((w) => !w.used);
  return activePlayers.length >= 3 && availableWords.length >= 1;
};

const startRound = (room) => {
  const activePlayers = Object.values(room.players).filter(
    (p) => !p.isKicked && !p.isEliminated
  );
  const availableWords = room.dictionary.filter((w) => !w.used);

  if (activePlayers.length < 3) {
    throw new Error('Se necesitan al menos 3 jugadores activos');
  }
  if (availableWords.length < 1) {
    throw new Error('No hay palabras disponibles');
  }

  // Elegir palabra
  const wordEntry = pickRandom(availableWords);
  wordEntry.used = true;

  // Elegir impostores (excluyendo al autor y otros excluidos)
  const eligibleForImpostor = activePlayers.filter(
    (p) => !wordEntry.excludedPlayerIds.includes(p.id)
  );

  if (eligibleForImpostor.length < room.config.impostorCount) {
    throw new Error('No hay suficientes jugadores elegibles para ser impostores');
  }

  const shuffled = shuffleArray(eligibleForImpostor);
  const impostorIds = shuffled.slice(0, room.config.impostorCount).map((p) => p.id);

  // Elegir quién empieza (aleatorio)
  const startingPlayer = pickRandom(activePlayers);

  room.round = {
    word: wordEntry.word,
    category: wordEntry.category,
    wordAuthorId: wordEntry.authorId,
    impostorIds,
    startingPlayerId: startingPlayer.id,
    votes: {},
    revotes: {},
    votingOpen: false,
    revoteTargets: null,
    resolved: false,
    impostorGuessPending: false,
    discoveredImpostorId: null,
  };
  room.roundNumber++;
  room.status = 'playing';
};

const openVoting = (room) => {
  if (room.round) {
    room.round.votingOpen = true;
  }
};

const registerVote = (room, voterId, targetId, isRevote = false) => {
  if (!room.round) throw new Error('No hay ronda activa');

  const voter = room.players[voterId];
  if (!voter || voter.isEliminated || voter.isKicked) {
    throw new Error('No puedes votar');
  }

  const voteMap = isRevote ? room.round.revotes : room.round.votes;
  voteMap[voterId] = targetId;

  // Verificar si todos votaron
  const eligibleVoters = Object.values(room.players).filter(
    (p) => !p.isKicked && !p.isEliminated
  );
  const votedCount = Object.keys(voteMap).length;

  if (votedCount >= eligibleVoters.length) {
    // Contar votos
    const counts = {};
    Object.values(voteMap).forEach((tid) => {
      counts[tid] = (counts[tid] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(counts));
    const topVoted = Object.entries(counts)
      .filter(([, c]) => c === maxVotes)
      .map(([id]) => id);

    if (topVoted.length === 1) {
      // Hay un ganador claro
      const accusedId = topVoted[0];
      const isImpostor = room.round.impostorIds.includes(accusedId);

      if (isImpostor) {
        room.round.discoveredImpostorId = accusedId;
        room.round.impostorGuessPending = true;
      } else {
        // Jugador inocente eliminado
        room.players[accusedId].isEliminated = true;
      }
      room.round.resolved = true;
      return { state: 'resolved', accusedId, isImpostor };
    } else if (!isRevote) {
      // Empate, activar revote
      room.round.revoteTargets = topVoted;
      room.round.revotes = {};
      return { state: 'revote', targets: topVoted };
    } else {
      // Empate en revote, elegir al azar
      const accusedId = pickRandom(topVoted);
      const isImpostor = room.round.impostorIds.includes(accusedId);

      if (isImpostor) {
        room.round.discoveredImpostorId = accusedId;
        room.round.impostorGuessPending = true;
      } else {
        room.players[accusedId].isEliminated = true;
      }
      room.round.resolved = true;
      return { state: 'resolved', accusedId, isImpostor };
    }
  }

  return { state: 'waiting' };
};

const resolveImpostorGuess = (room, success) => {
  if (!room.round) throw new Error('No hay ronda activa');

  const impostorId = room.round.discoveredImpostorId;
  if (!impostorId) throw new Error('No hay impostor descubierto');

  if (success) {
    // El impostor adivinó: 2 puntos para él, 1 para otros impostores
    room.players[impostorId].points += 2;
    room.round.impostorIds
      .filter((id) => id !== impostorId)
      .forEach((id) => {
        if (room.players[id]) room.players[id].points += 1;
      });
  } else {
    // El impostor no adivinó: 1 punto para no-impostores activos
    Object.values(room.players)
      .filter(
        (p) =>
          !p.isKicked &&
          !p.isEliminated &&
          !room.round.impostorIds.includes(p.id)
      )
      .forEach((p) => {
        p.points += 1;
      });
  }

  // Eliminar al impostor descubierto
  room.players[impostorId].isEliminated = true;

  // Verificar si quedan impostores
  const remainingImpostors = room.round.impostorIds.filter(
    (id) => !room.players[id].isEliminated
  );

  room.round.impostorGuessPending = false;
  room.status = remainingImpostors.length > 0 ? 'playing' : 'lobby';
  room.round = null;

  return { impostorGuessed: success };
};

const resolveRoundWithoutGuess = (room) => {
  return resolveImpostorGuess(room, false);
};

const finalizeNonDiscoveredRound = (room) => {
  // El acusado no era impostor, ya fue eliminado
  // Verificar si quedan no-impostores
  const activeNonImpostors = Object.values(room.players).filter(
    (p) =>
      !p.isKicked &&
      !p.isEliminated &&
      !room.round?.impostorIds.includes(p.id)
  );

  if (activeNonImpostors.length === 0) {
    // Los impostores ganan
    room.round?.impostorIds.forEach((id) => {
      if (room.players[id] && !room.players[id].isEliminated) {
        room.players[id].points += 2;
      }
    });
    room.status = 'lobby';
    room.round = null;
    return { impostorsWin: true };
  }

  room.status = 'lobby';
  room.round = null;
  return { continueGame: true };
};

const kickPlayer = (room, targetId) => {
  const player = room.players[targetId];
  if (player) {
    player.isKicked = true;
    player.isConnected = false;
  }
};

const closeRoom = (room) => {
  room.status = 'closed';
};

// ============================================
// Conversión a estado público (ocultar info sensible)
// ============================================
const toPublicRoom = (room, viewerId) => {
  const viewer = room.players[viewerId];
  const isImpostor = room.round?.impostorIds.includes(viewerId);

  return {
    id: room.id,
    adminId: room.adminId,
    status: room.status,
    players: Object.fromEntries(
      Object.entries(room.players).map(([id, p]) => [
        id,
        {
          id: p.id,
          nickname: p.nickname,
          isAdmin: p.isAdmin,
          points: p.points,
          isConnected: p.isConnected,
          isEliminated: p.isEliminated,
          isKicked: p.isKicked,
        },
      ])
    ),
    dictionary: room.dictionary.map((w) => ({
      category: w.category,
      used: w.used,
      wordCount: room.dictionary.length,
    })),
    config: room.config,
    round: room.round
      ? {
          category: room.round.category,
          word: isImpostor ? null : room.round.word,
          isImpostor,
          startingPlayerId: room.round.startingPlayerId,
          votingOpen: room.round.votingOpen,
          votes: room.round.votes,
          revotes: room.round.revotes,
          revoteTargets: room.round.revoteTargets,
          resolved: room.round.resolved,
          impostorGuessPending: room.round.impostorGuessPending,
          discoveredImpostorId: room.round.discoveredImpostorId,
          canMarkGuess: room.round.impostorGuessPending && viewer?.isAdmin,
          lastVoteResult: room.round.lastVoteResult ?? null,
        }
      : null,
    roundNumber: room.roundNumber,
    viewerId,
  };
};

// ============================================
// WebSocket Server
// ============================================
const sockets = new Map();

const broadcastRoom = (room) => {
  sockets.forEach((ctx, ws) => {
    if (ctx.roomId === room.id && ctx.playerId) {
      const payload = {
        type: 'room_snapshot',
        room: toPublicRoom(room, ctx.playerId),
      };
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // ignore send errors
      }
    }
  });
};

const send = (ws, data) => {
  try {
    ws.send(JSON.stringify(data));
  } catch {
    // ignore
  }
};

const guardSession = (ws, msg) => {
  const room = getRoom(msg.roomId);
  if (!room) {
    send(ws, { type: 'error', code: 'room_not_found', message: 'Sala no existe' });
    return { room: null, player: undefined };
  }
  const player = findPlayerBySession(room, msg.sessionToken);
  if (!player) {
    send(ws, { type: 'error', code: 'player_not_found', message: 'Jugador no encontrado' });
    return { room: null, player: undefined };
  }
  return { room, player };
};

const handleMessage = (ws, raw) => {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(ws, { type: 'error', code: 'bad_json', message: 'JSON inválido' });
    return;
  }

  console.log('[WS] Mensaje recibido:', msg.type, msg.roomId || '', msg.nickname || '');

  switch (msg.type) {
    case 'create_room': {
      const roomId = msg.roomId ?? shortId();
      const { room, player } = createRoom(roomId, msg.nickname);
      saveRoom(room);
      sockets.set(ws, {
        roomId: room.id,
        playerId: player.id,
        sessionToken: player.sessionToken,
      });
      console.log('[WS] Sala creada:', roomId, 'Admin:', player.nickname);
      send(ws, {
        type: 'room_created',
        room: toPublicRoom(room, player.id),
        sessionToken: player.sessionToken,
        playerId: player.id,
      });
      return;
    }
    case 'join_room': {
      const room = getRoom(msg.roomId);
      if (!room || room.status === 'closed') {
        send(ws, { type: 'error', code: 'room_not_found', message: 'Sala no disponible' });
        return;
      }
      // Reconexión si hay token
      if (msg.sessionToken) {
        const player = findPlayerBySession(room, msg.sessionToken);
        if (player) {
          reconnectPlayer(player);
          sockets.set(ws, {
            roomId: room.id,
            playerId: player.id,
            sessionToken: player.sessionToken,
          });
          saveRoom(room);
          console.log('[WS] Reconexión:', player.nickname);
          send(ws, {
            type: 'joined',
            room: toPublicRoom(room, player.id),
            sessionToken: player.sessionToken,
            playerId: player.id,
          });
          broadcastRoom(room);
          return;
        }
      }

      const player = addPlayer(room, msg.nickname);
      sockets.set(ws, {
        roomId: room.id,
        playerId: player.id,
        sessionToken: player.sessionToken,
      });
      saveRoom(room);
      console.log('[WS] Jugador unido:', player.nickname, 'a sala:', room.id);
      send(ws, {
        type: 'joined',
        room: toPublicRoom(room, player.id),
        sessionToken: player.sessionToken,
        playerId: player.id,
      });
      broadcastRoom(room);
      return;
    }
    case 'reconnect': {
      const room = getRoom(msg.roomId);
      if (!room) {
        send(ws, { type: 'error', code: 'room_not_found', message: 'Sala no existe' });
        return;
      }
      const player = findPlayerBySession(room, msg.sessionToken);
      if (!player) {
        send(ws, { type: 'error', code: 'player_not_found', message: 'Jugador no encontrado' });
        return;
      }
      reconnectPlayer(player);
      sockets.set(ws, {
        roomId: room.id,
        playerId: player.id,
        sessionToken: player.sessionToken,
      });
      saveRoom(room);
      send(ws, {
        type: 'joined',
        room: toPublicRoom(room, player.id),
        sessionToken: player.sessionToken,
        playerId: player.id,
      });
      broadcastRoom(room);
      return;
    }
    case 'add_word': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (room.status === 'closed') {
        send(ws, { type: 'error', code: 'room_closed', message: 'Sala cerrada' });
        return;
      }
      const { added } = addWord(room, player.id, msg.word, msg.category);
      saveRoom(room);
      if (!added) {
        send(ws, {
          type: 'error',
          code: 'duplicate_word',
          message: 'Palabra duplicada',
        });
      }
      broadcastRoom(room);
      return;
    }
    case 'update_config': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (room.adminId !== player.id) {
        send(ws, { type: 'error', code: 'forbidden', message: 'Solo admin' });
        return;
      }
      updateConfig(room, msg.impostorCount);
      saveRoom(room);
      broadcastRoom(room);
      return;
    }
    case 'start_round': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (room.adminId !== player.id) {
        send(ws, { type: 'error', code: 'forbidden', message: 'Solo admin' });
        return;
      }
      if (!canStartRound(room)) {
        send(ws, {
          type: 'error',
          code: 'cannot_start',
          message: 'No se puede iniciar (mín 3 jugadores y 1 palabra)',
        });
        return;
      }
      try {
        startRound(room);
        openVoting(room);
        saveRoom(room);
        broadcastRoom(room);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al iniciar';
        send(ws, { type: 'error', code: 'start_round_failed', message });
      }
      return;
    }
    case 'vote': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (!room.round) {
        send(ws, { type: 'error', code: 'no_round', message: 'No hay ronda activa' });
        return;
      }
      try {
        const result = registerVote(room, player.id, msg.targetId, msg.isRevote);
        saveRoom(room);
        broadcastRoom(room);
        if (result.state === 'resolved') {
          if (room.round?.impostorGuessPending) {
            broadcastRoom(room);
          } else {
            finalizeNonDiscoveredRound(room);
            saveRoom(room);
            broadcastRoom(room);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error en voto';
        send(ws, { type: 'error', code: 'vote_failed', message });
      }
      return;
    }
    case 'mark_impostor_guess': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (!room.round) {
        send(ws, { type: 'error', code: 'no_round', message: 'No hay ronda activa' });
        return;
      }
      // Solo admin puede marcar
      if (room.adminId !== player.id) {
        send(ws, { type: 'error', code: 'forbidden', message: 'Solo admin' });
        return;
      }
      try {
        resolveImpostorGuess(room, msg.success);
        saveRoom(room);
        broadcastRoom(room);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al resolver';
        send(ws, { type: 'error', code: 'resolve_failed', message });
      }
      return;
    }
    case 'kick_player': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (room.adminId !== player.id) {
        send(ws, { type: 'error', code: 'forbidden', message: 'Solo admin' });
        return;
      }
      kickPlayer(room, msg.targetId);
      saveRoom(room);
      broadcastRoom(room);
      return;
    }
    case 'close_room': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      if (room.adminId !== player.id) {
        send(ws, { type: 'error', code: 'forbidden', message: 'Solo admin' });
        return;
      }
      closeRoom(room);
      saveRoom(room);
      broadcastRoom(room);
      return;
    }
    case 'heartbeat': {
      const { room, player } = guardSession(ws, msg);
      if (!room || !player) return;
      markHeartbeat(player);
      saveRoom(room);
      send(ws, { type: 'pong', ts: Date.now() });
      return;
    }
    default:
      send(ws, { type: 'error', code: 'unknown_type', message: 'Mensaje no soportado' });
  }
};

// Crear servidor HTTP y WS
const httpServer = createServer((req, res) => {
  // Health check endpoint
  res.writeHead(200, { 
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('WebSocket server running');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('[WS] Nueva conexión');
  sockets.set(ws, {});

  ws.on('message', (data) => {
    const text = typeof data === 'string' ? data : data.toString();
    handleMessage(ws, text);
  });

  ws.on('close', () => {
    const ctx = sockets.get(ws);
    if (ctx?.roomId && ctx.playerId) {
      const room = getRoom(ctx.roomId);
      if (room) {
        const player = room.players[ctx.playerId];
        markDisconnected(player);
        saveRoom(room);
        broadcastRoom(room);
        console.log('[WS] Desconexión:', player?.nickname);
      }
    }
    sockets.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

httpServer.listen(WS_PORT, () => {
  console.log(`\n🚀 Servidor WebSocket corriendo en ws://localhost:${WS_PORT}`);
  console.log('   Asegúrate de que Next.js corra en el puerto 3001\n');
});
