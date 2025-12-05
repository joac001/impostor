'use client';

import { Button } from "@/components/ui/button";
import type { PublicRoomState } from "@/lib/types/game";

interface VoteResultViewProps {
  room: PublicRoomState;
  isAdmin: boolean;
  onContinue: () => void;
}

export function VoteResultView({ room, isAdmin, onContinue }: VoteResultViewProps) {
  const round = room.round;
  const result = round?.lastVoteResult;
  
  if (!round || !result) return null;

  // Ordenar votos por cantidad (descendente)
  const sortedVotes = Object.entries(result.voteCount).sort(([, a], [, b]) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1419]">
      {/* Header con resultado */}
      <header className="border-b border-slate-700 px-4 py-6 text-center">
        <div className="mb-3 text-5xl animate-float">
          {result.wasImpostor ? "🎯" : "❌"}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">
          {result.eliminatedNickname}
        </h1>
        <p className={`mt-2 text-lg font-medium ${result.wasImpostor ? "text-emerald-400" : "text-rose-400"}`}>
          {result.wasImpostor 
            ? "¡Era el impostor!" 
            : "No era el impostor..."}
        </p>
      </header>

      {/* Detalle de votos */}
      <main className="flex-1 overflow-auto px-4 py-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resultados de la votación
        </h2>
        <div className="space-y-2">
          {sortedVotes.map(([playerId, count]) => {
            const player = room.players[playerId];
            const isEliminated = playerId === result.eliminatedId;
            return (
              <div
                key={playerId}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  isEliminated 
                    ? "border-rose-500/50 bg-rose-500/10" 
                    : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    isEliminated 
                      ? "bg-rose-500 text-white" 
                      : "bg-slate-700 text-slate-300"
                  }`}>
                    {player?.nickname.slice(0, 1).toUpperCase() ?? "?"}
                  </div>
                  <span className={`font-medium ${isEliminated ? "text-rose-300" : "text-slate-200"}`}>
                    {player?.nickname ?? "Desconocido"}
                  </span>
                </div>
                <span className={`text-lg font-bold ${isEliminated ? "text-rose-400" : "text-slate-400"}`}>
                  {count} {count === 1 ? "voto" : "votos"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quién votó a quién */}
        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Detalle de votos
        </h2>
        <div className="space-y-1 text-sm text-slate-400">
          {result.voteDetails.map((vote, idx) => {
            const voter = room.players[vote.voterId];
            const target = room.players[vote.targetId];
            return (
              <p key={idx}>
                <span className="font-medium text-slate-300">{voter?.nickname ?? "?"}</span>
                {" → "}
                <span className="font-medium text-slate-300">{target?.nickname ?? "?"}</span>
              </p>
            );
          })}
        </div>
      </main>

      {/* Footer con acción */}
      <footer className="border-t border-slate-700 bg-slate-800/50 px-4 py-4">
        {isAdmin ? (
          <div className="space-y-2">
            <Button size="full" onClick={onContinue}>
              {result.wasImpostor 
                ? "Continuar → El impostor intenta adivinar" 
                : "Continuar → Nueva ronda de pistas"}
            </Button>
            {!result.wasImpostor && (
              <p className="text-center text-xs text-slate-500">
                La ronda continúa. El eliminado no puede dar pistas ni votar.
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Esperando a que el admin continúe...
          </p>
        )}
      </footer>
    </div>
  );
}
