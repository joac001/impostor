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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1419] px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-7xl animate-float">🎭</div>
          <h1 className="text-2xl font-bold text-slate-100">
            ¡Impostor descubierto!
          </h1>
          <p className="mt-2 text-lg text-slate-300">
            <span className="font-semibold text-rose-400">{accusedPlayer.nickname}</span> fue votado
          </p>
          <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-left">
            <p className="text-sm font-semibold text-amber-400">
              Última oportunidad
            </p>
            <p className="mt-1 text-sm text-amber-300/80">
              El impostor debe intentar adivinar la palabra secreta.
            </p>
            <p className="mt-2 text-xs text-amber-400/70">
              Categoría: <span className="font-semibold text-amber-300">{round.category}</span>
            </p>
          </div>
          
          <div className="mt-6">
            {isAdmin ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-400 mb-3">
                  ¿Adivinó la palabra el impostor?
                </p>
                <div className="flex gap-3">
                  <Button 
                    size="full" 
                    onClick={() => onMarkGuess(true)}
                  >
                    ✓ Adivinó
                  </Button>
                  <Button 
                    size="full" 
                    variant="danger"
                    onClick={() => onMarkGuess(false)}
                  >
                    ✗ No adivinó
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
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
    const hasWords = room.dictionaryCount > 0;
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1419] px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-7xl animate-float">🎭</div>
          <h1 className="text-2xl font-bold text-slate-100">
            ¡El impostor sobrevivió!
          </h1>
          <p className="mt-2 text-slate-400">
            Solo quedan 2 jugadores. El impostor gana por supervivencia.
          </p>
          
          <div className="mt-6">
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
              <p className="text-sm text-slate-500">
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
