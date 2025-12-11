import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  openVoting,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

/**
 * El admin indica que la fase de pistas terminó y comienza la votación
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken } = body;
    // POST received for open-vote

    if (!roomId || !sessionToken) {
      return NextResponse.json(
        { error: "roomId y sessionToken requeridos" },
        { status: 400 }
      );
    }

    const room = await getRoom(roomId);
    
    if (!room || room.status === "closed") {
      return NextResponse.json(
        { error: "Sala no disponible" },
        { status: 404 }
      );
    }

    const player = findPlayerBySession(room, sessionToken);
    
    if (!player) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    // Solo el admin puede abrir votación
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede abrir la votación" },
        { status: 403 }
      );
    }

    if (!room.round) {
      return NextResponse.json(
        { error: "No hay ronda activa" },
        { status: 400 }
      );
    }

    // Permitir abrir votación desde fase de pistas (clues) o reabrir una revotación
    if (room.round.phase === "clues") {
      openVoting(room);
    } else if (room.round.phase === "revote") {
      // Reabrir revotación: delegar a la función del engine para mantener
      // la semántica centralizada y evitar toggles manuales.
      // Reopening revote via engine.reopenRevote
      // Importamos dinámicamente para evitar ciclos en algunos entornos
      try {
        const { reopenRevote } = await import('@/lib/game/engine');
        reopenRevote(room);
      } catch (err) {
        console.error('[api/open-vote] failed to call reopenRevote, falling back', err);
        // Fallback: aplicar manualmente los cambios mínimos
        room.round.phase = "revote";
        room.round.votes = [];
        (room.round as any).votingOpen = true;
      }
      // Revote reopened
    } else {
      return NextResponse.json(
        { error: "No se puede abrir votación en esta fase" },
        { status: 400 }
      );
    }
    await saveRoom(room);
    // room saved; response will include public snapshot

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error opening vote:", error);
    return NextResponse.json(
      { error: "Error al abrir votación" },
      { status: 500 }
    );
  }
}
