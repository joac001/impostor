'use client';

import { Button } from "@/components/ui/button";
import type { PublicRoomState } from "@/lib/types/game";

interface ResolutionViewProps {
  room: PublicRoomState;
  isAdmin: boolean;
  onMarkGuess: (success: boolean) => void;
  onStartNextRound: () => void;
}

export function ResolutionView({ 
  room, 
  isAdmin, 
  onMarkGuess, 
  onStartNextRound 
}: ResolutionViewProps) {
  const round = room.round;
  
  // Si no hay ronda activa, no mostramos nada (ya terminó)
  if (!round) return null;

  const accusedPlayer = round.accusedId ? room.players[round.accusedId] : null;

  // Pantalla de adivinanza del impostor
  if (round.impostorGuessPending && accusedPlayer) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-7xl">🎭</div>
          <h1 className="text-2xl font-bold text-zinc-900">
            ¡Impostor descubierto!
          </h1>
          <p className="mt-2 text-lg text-zinc-700">
            <span className="font-semibold">{accusedPlayer.nickname}</span> fue votado
          </p>
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-900">
              Última oportunidad
            </p>
            <p className="mt-1 text-sm text-amber-700">
              El impostor debe intentar adivinar la palabra secreta.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Categoría: <span className="font-semibold">{round.category}</span>
            </p>
          </div>
          
          <div className="mt-6">
            {isAdmin ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-600 mb-3">
                  ¿Adivinó la palabra el impostor?
                </p>
                <div className="flex gap-3">
                  <Button 
                    size="full" 
                    onClick={() => onMarkGuess(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    ✓ Adivinó
                  </Button>
                  <Button 
                    size="full" 
                    variant="ghost"
                    onClick={() => onMarkGuess(false)}
                    className="border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    ✗ No adivinó
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Esperando que el admin confirme si el impostor adivinó...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de supervivencia del impostor (quedan 2 jugadores, no impostorGuessPending)
  if (!round.impostorGuessPending && !round.winner) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-7xl">🎭</div>
          <h1 className="text-2xl font-bold text-zinc-900">
            ¡El impostor sobrevivió!
          </h1>
          <p className="mt-2 text-zinc-600">
            Solo quedan 2 jugadores. El impostor gana por supervivencia.
          </p>
          
          <div className="mt-6">
            {isAdmin ? (
              <Button size="full" onClick={onStartNextRound}>
                Iniciar siguiente ronda
              </Button>
            ) : (
              <p className="text-sm text-zinc-500">
                Esperando que el admin inicie la siguiente ronda...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No debería llegar aquí, pero por si acaso
  return null;
}
