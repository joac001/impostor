'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { VotingView } from "@/components/game/VotingView";
import { VoteResultView } from "@/components/game/VoteResultView";
import { ResolutionView } from "@/components/game/ResolutionView";
import { RoundEndView } from "@/components/game/RoundEndView";
import { RoundInfoBar } from "@/components/game/RoundInfoBar";
import type { PublicRoomState } from "@/lib/types/game";
import { useRoomPolling } from "@/store/client/useRoomPolling";
import { Check, LogOut, Share2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Player List Component (ordenado por puntos, luego alfabéticamente)
// ─────────────────────────────────────────────────────────────────────────────
const PlayerList = ({
  room,
  currentId,
  onVote,
  connectedOnly = false,
}: {
  room: PublicRoomState;
  currentId: string;
  onVote?: (id: string) => void;
  connectedOnly?: boolean;
}) => {
  // Ordenar por puntos (más a menos), luego alfabéticamente
  const orderedPlayers = useMemo(() => {
    const allPlayers = Object.values(room.players).filter((p) =>
      connectedOnly ? p.connected : true
    );
    
    return allPlayers.sort((a, b) => {
      // Primero por puntos (descendente)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Luego alfabéticamente
      return a.nickname.localeCompare(b.nickname);
    });
  }, [room.players, connectedOnly]);

  return (
    <div className="space-y-2">
      {orderedPlayers.map((p, index) => {
        const isCurrent = p.id === currentId;
        return (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
              isCurrent 
                ? "border-emerald-500/50 bg-emerald-500/10" 
                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                index === 0 ? "bg-amber-500 text-amber-950" :
                index === 1 ? "bg-slate-400 text-slate-900" :
                index === 2 ? "bg-amber-700 text-amber-100" :
                "bg-slate-700 text-slate-300"
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {p.isAdmin ? "👑 " : null}
                  {p.nickname}{" "}
                  {isCurrent ? <span className="text-xs text-emerald-400">(vos)</span> : null}
                </p>
                <p className="text-xs text-slate-400">
                  {p.connected ? "🟢" : "⚪"} {p.points} pts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onVote && !isCurrent ? (
                <Button size="sm" variant="ghost" onClick={() => onVote(p.id)}>
                  Votar
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Dictionary Section (cada jugador ve solo sus palabras)
// ─────────────────────────────────────────────────────────────────────────────
const DictionarySection = ({
  room,
  onAddWord,
}: {
  room: PublicRoomState;
  onAddWord: (word: string, category: string) => void;
}) => {
  const [localWord, setLocalWord] = useState("");
  const [localCategory, setLocalCategory] = useState("");

  const handleAdd = () => {
    if (!localWord.trim() || !localCategory.trim()) return;
    onAddWord(localWord, localCategory);
    setLocalWord("");
    setLocalCategory("");
  };

  // room.dictionary ya viene filtrado - solo contiene las palabras del usuario actual
  const myEntries = Object.values(room.dictionary).sort((a, b) =>
    a.word.localeCompare(b.word)
  );
  const totalWords = room.dictionaryCount;

  return (
    <Card title="Diccionario">
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 mb-3">
        <p className="text-sm text-emerald-300">
          Agregá palabras con categorías. Solo vos podés ver tus palabras 
          (así no sabés las posibles palabras secretas de otros).
        </p>
        <p className="text-xs text-emerald-400/70 mt-1">
          Si tu palabra es elegida, no podrás ser impostor en esa ronda.
        </p>
      </div>
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Palabra"
          value={localWord}
          onChange={(e) => setLocalWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder="Categoría"
          value={localCategory}
          onChange={(e) => setLocalCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd}>Agregar</Button>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>Tus palabras: {myEntries.length}</span>
        <span>Total en el diccionario: {totalWords}</span>
      </div>

      {myEntries.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {myEntries.map((w) => (
            <div
              key={w.normalized}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2"
            >
              <p className="text-sm font-semibold text-slate-100">{w.word}</p>
              <p className="text-xs text-slate-400">Categoría: {w.category}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Room Page
// ─────────────────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const roomId = params?.roomId?.toString() ?? "";
  const mode = (search?.get("mode") as "create" | "join") ?? "join";
  const nickFromQuery = search?.get("nickname") ?? "";
  
  const [nickname, setNickname] = useState(nickFromQuery);
  // local optimistic vote state removed — rely exclusively on server state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [openingVote, setOpeningVote] = useState(false);

  const ready = nickname.trim().length > 0;
  const { room, playerId, api, status } = useRoomPolling({
    roomId,
    nickname: nickname.trim(),
    mode,
  });

  const isAdmin = room?.adminId === playerId;
  const impostorIds = room?.round?.impostorIds ?? [];
  const isImpostor = impostorIds.includes(playerId ?? "");
  const currentPlayer = room?.players[playerId ?? ""];
  
  const maxImpostors = useMemo(() => {
    if (!room) return 1;
    const count = Object.keys(room.players).length;
    return Math.max(1, Math.ceil(count / 3));
  }, [room]);

  // No local vote reset effect — UI is server-driven

  // Determinar si ya votamos en esta fase (basado en datos del servidor)
  const hasVotedFromServer = (() => {
    if (!room?.round || !playerId) return false;
    const isRevote = room.round.phase === "revote";
    return room.round.votes.some(
      (v) => v.voterId === playerId && v.isRevote === isRevote
    );
  })();

  // Obtener a quién votamos desde el servidor
  const votedForFromServer = (() => {
    if (!room?.round || !playerId) return null;
    const isRevote = room.round.phase === "revote";
    const vote = room.round.votes.find(
      (v) => v.voterId === playerId && v.isRevote === isRevote
    );
    return vote?.targetId ?? null;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleShareLink = async () => {
    const shareText = `🎭 ¡Unite a jugar Impostor!

1. Abrí el link
2. Elegí un apodo
3. ¡A jugar!

${window.location.origin}/?room=${roomId}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAddWord = (word: string, category: string) => {
    api?.addWord(word, category);
  };

  const handleStart = () => {
    api?.startRound();
  };

  const handleVote = (id: string) => {
    api?.vote(id, room?.round?.phase === "revote");
  };

  const handleMarkGuess = (success: boolean) => {
    api?.markImpostorGuess(success);
  };

  const handleOpenVoting = async () => {
    if (!api) return;
    console.log('[room page] handleOpenVoting invoked');
    try {
      setOpeningVote(true);
      const res = await api.openVoting();
      console.log('[room page] api.openVoting result:', res);
    } catch (err) {
      console.error('[room page] Error opening voting:', err);
      alert(err instanceof Error ? err.message : 'Error al reabrir votación');
    } finally {
      setOpeningVote(false);
    }
  };

  const handleContinueAfterResult = () => {
    api?.continueAfterResult();
  };

  const handleClose = async () => {
    await api?.closeRoom();
    router.push("/");
  };

  const handleLeave = async () => {
    await api?.leaveRoom();
    router.push("/");
  };

  const handleImpostorCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(maxImpostors, count));
    api?.updateConfig(clamped);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-join screen
  // ─────────────────────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <Card className="max-w-md">
          <h1 className="text-xl font-semibold text-slate-100">Entrar a la sala</h1>
          <p className="text-sm text-slate-400">
            Ingresá tu apodo para unirte a la sala.
          </p>
          <Input
            placeholder="Tu apodo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setNickname(nickname.trim())}
          />
          <Button onClick={() => setNickname(nickname.trim())} size="full">
            Continuar
          </Button>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main room view
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-[#0f1419] px-4 py-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
              {currentPlayer?.nickname.slice(0, 1).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {currentPlayer?.nickname ?? nickname}
              </p>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Badge variant="warning">Admin</Badge>
                ) : (
                  <Badge variant="neutral">Jugador</Badge>
                )}
                <span className="text-xs text-slate-400">
                  {status === "connected" ? "🟢 Conectado" : "🟡 " + status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2">
          {isAdmin ? (
            <Button
              variant={linkCopied ? "ghost" : "subtle"}
              size="sm"
              onClick={handleShareLink}
              className="flex-1"
            >
              {linkCopied ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  ¡Link copiado!
                </>
              ) : (
                <>
                  <Share2 className="mr-1 h-4 w-4" />
                  Compartir link
                </>
              )}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeaveModal(true)}
            className="flex-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Abandonar sala
          </Button>
        </div>
        {/* Admin quick start button (visible below action buttons for accessibility) */}
        {isAdmin && !room?.round ? (
          <div className="mt-2">
            <Button
              onClick={handleStart}
              size="full"
              disabled={room?.dictionaryCount === 0}
            >
              Iniciar ronda
            </Button>
            {room?.dictionaryCount === 0 ? (
              <p className="mt-2 text-xs text-amber-400">
                No hay palabras en el diccionario. Agregá al menos una para iniciar.
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* Loading state */}
      {!room ? (
        <Card>
          <p className="text-sm text-slate-400">Conectando a la sala...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Round Info Bar - arriba de todo cuando hay ronda activa */}
          {room.round && room.round.phase === "clues" ? (
            <>
              <RoundInfoBar room={room} isImpostor={isImpostor} currentPlayerId={playerId ?? ""} />
              
              {/* Botón de abrir votación para admin */}
              {isAdmin ? (
                <Button onClick={handleOpenVoting} size="full" disabled={openingVote}>
                  {openingVote ? 'Abriendo votación...' : '🗳️ Abrir votación'}
                </Button>
              ) : (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-sm text-amber-400">
                    Esperando que el admin abra la votación...
                  </p>
                </div>
              )}
            </>
          ) : null}

          {/* Players list */}
          <Card title={`Jugadores (${Object.values(room.players).filter(p => p.connected).length})`}>
            <PlayerList
              room={room}
              currentId={playerId ?? ""}
              connectedOnly
            />
          </Card>

          {/* Dictionary - cada jugador ve solo sus palabras */}
          <DictionarySection
            room={room}
            onAddWord={handleAddWord}
          />

          {/* Lobby controls - solo cuando no hay ronda */}
          {!room.round ? (
            <Card title="Iniciar partida">
              {isAdmin ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-200">
                      Cantidad de impostores
                    </label>
                    <p className="text-xs text-slate-400 mb-2">
                      Máximo {maxImpostors} impostores.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={maxImpostors}
                        value={room.config.impostorCount}
                        onChange={(e) =>
                          handleImpostorCountChange(Number(e.target.value))
                        }
                      />
                      <span className="text-sm text-slate-400 w-[25%]">
                        impostor{room.config.impostorCount !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Esperando que el administrador inicie la ronda...
                </p>
              )}
            </Card>
          ) : null}

          {/* Close room button (admin only, at the bottom) */}
          {isAdmin ? (
            <Button
              variant="ghost"
              size="full"
              onClick={() => setShowCloseModal(true)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Cerrar sala
            </Button>
          ) : null}
        </div>
      )}

      {/* Modals */}
      <Modal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="¿Abandonar la sala?"
        description="Si abandonás, perderás tu progreso en esta partida."
        confirmText="Abandonar"
        cancelText="Cancelar"
        onConfirm={handleLeave}
        variant="danger"
      />

      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="¿Cerrar la sala?"
        description="Esto expulsará a todos los jugadores y eliminará la sala permanentemente."
        confirmText="Cerrar sala"
        cancelText="Cancelar"
        onConfirm={handleClose}
        variant="danger"
      />

      {/* Game phase overlays */}
      {room?.round?.phase === "vote" || room?.round?.phase === "revote" ? (
        <VotingView
          room={room}
          currentId={playerId ?? ""}
          onVote={handleVote}
          hasVoted={hasVotedFromServer}
          votedFor={votedForFromServer}
          onOpenVoting={handleOpenVoting}
        />
      ) : null}

      {room?.round?.phase === "result" ? (
        <VoteResultView
          room={room}
          isAdmin={isAdmin}
          onContinue={handleContinueAfterResult}
        />
      ) : null}

      {room?.round?.phase === "resolution" ? (
        <ResolutionView
          room={room}
          isAdmin={isAdmin}
          onMarkGuess={handleMarkGuess}
          onStartNextRound={handleStart}
        />
      ) : null}

      {/* Round end summary (when round is null but there's history) */}
      {room ? (
        <RoundEndView
          room={room}
          isAdmin={isAdmin}
          onStartNextRound={handleStart}
        />
      ) : null}
    </main>
  );
}
