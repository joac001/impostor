'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import type { PublicRoomState } from "@/lib/types/game";

interface RoundInfoBarProps {
  room: PublicRoomState;
  currentPlayerId: string;
  isImpostor: boolean;
}

export function RoundInfoBar({ room, currentPlayerId, isImpostor }: RoundInfoBarProps) {
  const [showRole, setShowRole] = useState(false);
  const round = room.round;
  
  if (!round) return null;

  const currentPlayer = room.players[currentPlayerId];
  const isEliminated = currentPlayer?.status === "benched";

  return (
    <>
      {/* Barra de información de ronda */}
      <div className={`rounded-2xl border-2 p-4 ${
        isEliminated 
          ? "border-slate-600 bg-slate-800/50" 
          : "border-emerald-500/30 bg-linear-to-r from-emerald-500/10 to-teal-500/10"
      }`}>
        {/* Banner de eliminado */}
        {isEliminated && (
          <div className="mb-3 rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-center">
            <p className="text-sm font-medium text-rose-400">
              ⚰️ Fuiste eliminado
            </p>
            <p className="text-xs text-rose-400/70">
              Ya no podés dar pistas ni votar
            </p>
          </div>
        )}

        {/* Categoría prominente */}
        <div className="text-center mb-3">
          <p className={`text-xs font-medium uppercase tracking-wider ${isEliminated ? "text-slate-500" : "text-emerald-400"}`}>
            Categoría
          </p>
          <h2 className={`text-2xl font-bold mt-1 ${isEliminated ? "text-slate-400" : "text-emerald-300"}`}>
            {round.category}
          </h2>
        </div>

        {/* Botón para ver rol */}
        <button
          onClick={() => setShowRole(true)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] ${
            isEliminated 
              ? "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500" 
              : "border-slate-600 bg-slate-800 text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10"
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Ver mi rol</span>
        </button>

        {/* Info del starter */}
        {round.phase === "clues" && !isEliminated && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Empieza: <span className="font-semibold text-slate-400">{room.players[round.starterId]?.nickname ?? "..."}</span>
          </p>
        )}
      </div>

      {/* Modal de rol */}
      {showRole && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowRole(false)}
        >
          <div 
            className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isEliminated ? (
              <>
                <div className="mb-4 text-6xl">⚰️</div>
                <h3 className="text-2xl font-bold text-slate-400">
                  Eliminado
                </h3>
                <p className="mt-2 text-slate-500">
                  Fuiste votado y eliminado de la ronda.
                </p>
                <div className="mt-4 rounded-xl bg-slate-700/50 p-3">
                  <p className="text-sm text-slate-400">
                    {isImpostor ? "Eras el impostor 🎭" : `La palabra era: ${round.secretWord}`}
                  </p>
                </div>
              </>
            ) : isImpostor ? (
              <>
                <div className="mb-4 text-6xl animate-float">🎭</div>
                <h3 className="text-2xl font-bold text-rose-400">
                  ¡Sos el Impostor!
                </h3>
                <p className="mt-2 text-slate-400">
                  No conocés la palabra secreta. Intentá pasar desapercibido.
                </p>
                <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3">
                  <p className="text-sm text-rose-300">
                    Categoría: <span className="font-semibold">{round.category}</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 text-6xl">👤</div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                  La palabra secreta es
                </p>
                <h3 className="mt-1 text-3xl font-bold text-emerald-400">
                  {round.secretWord}
                </h3>
                <p className="mt-3 text-slate-400">
                  Dá pistas para que los demás confirmen que la conocés, pero no se la reveles al impostor.
                </p>
              </>
            )}

            <Button 
              size="full" 
              className="mt-6" 
              onClick={() => setShowRole(false)}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Ocultar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
