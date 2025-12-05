'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicRoomState } from "@/lib/types/game";

interface RoundEndViewProps {
  room: PublicRoomState;
  isAdmin: boolean;
  onStartNextRound: () => void;
}

export function RoundEndView({ room, isAdmin, onStartNextRound }: RoundEndViewProps) {
  // Track which roundId we've dismissed
  const [dismissedRoundId, setDismissedRoundId] = useState<string | null>(null);
  
  const lastSummary = room.history.length > 0 
    ? room.history[room.history.length - 1] 
    : null;
  
  // Mostrar solo si hay un summary, no hay ronda activa, y no fue dismissed
  const shouldShow = room.round === null && 
    lastSummary !== null && 
    lastSummary.roundId !== dismissedRoundId;

  if (!shouldShow || !lastSummary) return null;

  const handleDismiss = () => {
    setDismissedRoundId(lastSummary.roundId);
  };

  const hasWords = room.dictionaryCount > 0;
  const isImpostorWin = lastSummary.winner === "impostor";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1419] px-4">
      <div className="max-w-md text-center">
        <div className={`mb-4 text-7xl animate-float ${isImpostorWin ? "" : "animate-pulse-glow"}`}>
          {isImpostorWin ? "🎭" : "🏆"}
        </div>
        <h1 className={`text-3xl font-bold ${isImpostorWin ? "text-rose-400" : "text-emerald-400"}`}>
          {isImpostorWin 
            ? "¡Ganó el impostor!" 
            : "¡Ganaron los aldeanos!"}
        </h1>
        
        <div className="mt-4 space-y-2 text-slate-400">
          {lastSummary.impostorGuessSuccess === true && (
            <p>El impostor adivinó la palabra secreta.</p>
          )}
          {lastSummary.impostorGuessSuccess === false && (
            <p>El impostor no adivinó la palabra.</p>
          )}
          {lastSummary.impostorGuessSuccess === undefined && isImpostorWin && (
            <p>El impostor sobrevivió hasta el final.</p>
          )}
          
          {lastSummary.accusedId && (
            <p className="text-sm">
              Eliminado: <span className="font-semibold text-slate-200">
                {room.players[lastSummary.accusedId]?.nickname ?? "Desconocido"}
              </span>
            </p>
          )}
          
          <div className="mt-4 text-sm">
            <p className="font-semibold text-slate-200">Puntos otorgados:</p>
            <div className="mt-2 space-y-1">
              {Object.entries(lastSummary.pointsAwarded).map(([id, pts]) => (
                <p key={id}>
                  {room.players[id]?.nickname ?? id}: <span className="font-semibold text-emerald-400">+{pts} pts</span>
                </p>
              ))}
              {Object.keys(lastSummary.pointsAwarded).length === 0 && (
                <p className="text-slate-500">Nadie sumó puntos esta ronda</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {isAdmin ? (
            <>
              <Button 
                size="full" 
                onClick={onStartNextRound}
                disabled={!hasWords}
              >
                Iniciar siguiente ronda
              </Button>
              {!hasWords && (
                <p className="mt-2 text-xs text-amber-400">
                  No hay palabras en el diccionario. Agregá más para continuar.
                </p>
              )}
            </>
          ) : (
            <Button size="full" variant="ghost" onClick={handleDismiss}>
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
