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

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-7xl">
          {lastSummary.winner === "impostor" ? "🎭" : "🏆"}
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">
          {lastSummary.winner === "impostor" 
            ? "¡Ganó el impostor!" 
            : "¡Ganaron los aldeanos!"}
        </h1>
        
        <div className="mt-4 space-y-2 text-zinc-600">
          {lastSummary.impostorGuessSuccess !== undefined && (
            <p>
              {lastSummary.impostorGuessSuccess 
                ? "El impostor adivinó la palabra secreta." 
                : "El impostor no adivinó la palabra."}
            </p>
          )}
          
          {lastSummary.accusedId && (
            <p className="text-sm">
              Eliminado: <span className="font-semibold">
                {room.players[lastSummary.accusedId]?.nickname ?? "Desconocido"}
              </span>
            </p>
          )}
          
          <div className="mt-4 text-sm">
            <p className="font-semibold text-zinc-800">Puntos otorgados:</p>
            <div className="mt-2 space-y-1">
              {Object.entries(lastSummary.pointsAwarded).map(([id, pts]) => (
                <p key={id}>
                  {room.players[id]?.nickname ?? id}: <span className="font-semibold text-emerald-600">+{pts} pts</span>
                </p>
              ))}
              {Object.keys(lastSummary.pointsAwarded).length === 0 && (
                <p className="text-zinc-500">Nadie sumó puntos esta ronda</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {isAdmin ? (
            <Button size="full" onClick={onStartNextRound}>
              Iniciar siguiente ronda
            </Button>
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
