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

    if (!room.round || room.round.phase !== "clues") {
      return NextResponse.json(
        { error: "No se puede abrir votación en esta fase" },
        { status: 400 }
      );
    }

    openVoting(room);
    await saveRoom(room);

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
