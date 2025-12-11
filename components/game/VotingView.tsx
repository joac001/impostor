"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicRoomState } from "@/lib/types/game";

interface VotingViewProps {
  room: PublicRoomState;
  currentId: string;
  onVote: (targetId: string) => void;
  hasVoted: boolean;
  votedFor: string | null;
  onOpenVoting?: () => void;
}

export function VotingView({ room, currentId, onVote, hasVoted, votedFor, onOpenVoting }: VotingViewProps) {
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

    // En revote, solo los candidatos. El servidor puede exponerlos como
    // `revoteCandidates` o `revoteTargets` (legacy), así que aceptamos ambos.
    const revoteCandidates = Array.isArray((round as any).revoteCandidates)
      ? (round as any).revoteCandidates
      : Array.isArray((round as any).revoteTargets)
      ? (round as any).revoteTargets
      : [];

    if (isRevote && revoteCandidates.length > 0) {
      return players.filter((p) => revoteCandidates.includes(p.id));
    }

    return players;
  }, [room.players, currentId, isRevote, round?.revoteCandidates, (round as any)?.revoteTargets, round]);

  if (!round) return null;

  // Si el jugador está eliminado, mostrar mensaje especial
  if (isEliminated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1419]">
        <header className="border-b border-slate-700 bg-slate-800/50 px-4 py-4">
          <h1 className="text-xl font-bold text-slate-400">
            {isRevote ? "🔄 Revotación en curso" : "🗳️ Votación en curso"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Los demás están votando
          </p>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 text-7xl animate-float">⚰️</div>
          <h2 className="text-2xl font-bold text-slate-300">Fuiste eliminado</h2>
          <p className="mt-3 text-slate-500 max-w-xs">
            Ya no podés votar en esta ronda. Esperá a que termine la votación.
          </p>
          <div className="mt-6 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3">
            <p className="text-sm text-slate-400">
              Votos: {round.totalVotesReceived}/{round.totalVotesNeeded}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Si estamos en revote pero la votación no está abierta, mostrar pantalla de espera
  const isVotingOpen = Boolean((round as any).votingOpen);
  const revoteCandidates = Array.isArray((round as any).revoteCandidates)
    ? (round as any).revoteCandidates
    : Array.isArray((round as any).revoteTargets)
    ? (round as any).revoteTargets
    : [];

  if (isRevote && !isVotingOpen) {
    // Mostrar pantalla que indica que se debe hacer revotación, con conteos
    const counts: Record<string, number> = round.lastVoteResult?.voteCount ?? {};
    const isAdmin = room.adminId === currentId;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1419]">
        <header className="border-b border-slate-700 bg-slate-800/50 px-4 py-4">
          <h1 className="text-2xl font-bold text-amber-400">🔄 Revotación necesaria</h1>
          <p className="text-sm text-slate-400 mt-1">Hubo empate. Revisá los votos de los candidatos y reabrí la votación cuando estés listo.</p>
        </header>

        <main className="flex-1 overflow-auto px-4 py-6">
          <div className="max-w-xl mx-auto">
            <div className="mb-4 text-sm text-slate-400">Candidatos en revotación:</div>
            <div className="space-y-3">
              {revoteCandidates.length === 0 && (
                <p className="text-sm text-slate-500">No hay candidatos disponibles.</p>
              )}
              {revoteCandidates.map((id: string) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-100">{room.players[id]?.nickname ?? id}</p>
                    <p className="text-xs text-slate-400">{(counts[id] ?? 0)} votos</p>
                  </div>
                  <div className="text-slate-400 text-sm">{room.players[id]?.points ?? 0} pts</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {isAdmin && (
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      if (!onOpenVoting) {
                        console.warn('[VotingView] onOpenVoting not provided');
                        return;
                      }
                      try {
                        await onOpenVoting();
                      } catch (err) {
                        console.error('[VotingView] Reopen voting failed:', err);
                      }
                    }}
                  >
                    Reabrir votación
                  </Button>
                </div>
              )}
              <div className="mt-4 text-sm text-slate-400">Esperando a que el admin reabra la votación...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1419]">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 px-4 py-4">
        <h1 className="text-xl font-bold text-slate-100">
          {isRevote ? "🔄 Revotación" : "🗳️ Votación"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isRevote 
            ? "Hubo empate. Votá entre los candidatos." 
            : "Elegí al jugador que creés que es el impostor."}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-emerald-400">
            {round.totalVotesReceived}/{round.totalVotesNeeded} votos
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-amber-400">
            {round.category}
          </span>
        </div>
      </header>

      {/* Voting list */}
      <main className="flex-1 overflow-auto px-4 py-4">
        {hasVoted ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl animate-pulse">⏳</div>
            <h2 className="text-xl font-semibold text-slate-100">¡Ya votaste!</h2>
            <p className="mt-2 text-slate-400">
              Votaste por <span className="font-semibold text-emerald-400">{room.players[votedFor ?? ""]?.nickname ?? "..."}</span>
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Esperando a que voten los demás...
            </p>
            <div className="mt-2 text-sm text-slate-500">
              {round.totalVotesReceived} de {round.totalVotesNeeded} votos recibidos
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {votablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onVote(player.id)}
                className="w-full flex items-center justify-between rounded-2xl border-2 border-slate-700 bg-slate-800/50 p-4 text-left transition-all hover:border-rose-500/50 hover:bg-rose-500/10 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-rose-500/30">
                    {player.nickname.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">
                      {player.isAdmin ? "👑 " : ""}
                      {player.nickname}
                    </p>
                    <p className="text-sm text-slate-500">{player.points} pts</p>
                  </div>
                </div>
                <div className="text-rose-400">
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
