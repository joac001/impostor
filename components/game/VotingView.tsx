'use client';

import { useMemo } from "react";
import type { PublicRoomState } from "@/lib/types/game";

interface VotingViewProps {
  room: PublicRoomState;
  currentId: string;
  onVote: (targetId: string) => void;
  hasVoted: boolean;
  votedFor: string | null;
}

export function VotingView({ room, currentId, onVote, hasVoted, votedFor }: VotingViewProps) {
  const round = room.round;
  const currentPlayer = room.players[currentId];
  const isEliminated = currentPlayer?.status === "benched";
  
  // Determinar qué jugadores se pueden votar
  const isRevote = round?.phase === "revote";
  const votablePlayers = useMemo(() => {
    if (!round) return [];
    const players = Object.values(room.players).filter(
      (p) => p.status === "active" && p.id !== currentId
    );
    
    // En revote, solo los candidatos
    if (isRevote && round.revoteCandidates.length > 0) {
      return players.filter((p) => round.revoteCandidates.includes(p.id));
    }
    
    return players;
  }, [room.players, currentId, isRevote, round]);

  if (!round) return null;

  // Si el jugador está eliminado, mostrar mensaje especial
  if (isEliminated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-100">
        <header className="border-b border-zinc-300 bg-zinc-200 px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-600">
            {isRevote ? "🔄 Revotación en curso" : "🗳️ Votación en curso"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Los demás están votando
          </p>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 text-7xl">⚰️</div>
          <h2 className="text-2xl font-bold text-zinc-700">Fuiste eliminado</h2>
          <p className="mt-3 text-zinc-500 max-w-xs">
            Ya no podés votar en esta ronda. Esperá a que termine la votación.
          </p>
          <div className="mt-6 rounded-xl bg-zinc-200 px-4 py-3">
            <p className="text-sm text-zinc-600">
              Votos: {round.totalVotesReceived}/{round.totalVotesNeeded}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-zinc-50 px-4 py-4">
        <h1 className="text-xl font-bold text-zinc-900">
          {isRevote ? "🔄 Revotación" : "🗳️ Votación"}
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          {isRevote 
            ? "Hubo empate. Votá entre los candidatos." 
            : "Elegí al jugador que creés que es el impostor."}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
            {round.totalVotesReceived}/{round.totalVotesNeeded} votos
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
            Categoría: {round.category}
          </span>
        </div>
      </header>

      {/* Voting list */}
      <main className="flex-1 overflow-auto px-4 py-4">
        {hasVoted ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">⏳</div>
            <h2 className="text-xl font-semibold text-zinc-900">¡Ya votaste!</h2>
            <p className="mt-2 text-zinc-600">
              Votaste por <span className="font-semibold">{room.players[votedFor ?? ""]?.nickname ?? "..."}</span>
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Esperando a que voten los demás...
            </p>
            <div className="mt-2 text-sm text-zinc-400">
              {round.totalVotesReceived} de {round.totalVotesNeeded} votos recibidos
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {votablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onVote(player.id)}
                className="w-full flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white p-4 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-purple-500 text-lg font-bold text-white">
                    {player.nickname.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {player.isAdmin ? "👑 " : ""}
                      {player.nickname}
                    </p>
                    <p className="text-sm text-zinc-500">{player.points} pts</p>
                  </div>
                </div>
                <div className="text-indigo-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
