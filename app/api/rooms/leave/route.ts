import { NextResponse } from "next/server";
import { findPlayerBySession } from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

/**
 * Endpoint para que un jugador abandone la sala voluntariamente
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
    
    if (!room) {
      // Si la sala no existe, consideramos que ya abandonó
      return NextResponse.json({ left: true });
    }

    const player = findPlayerBySession(room, sessionToken);
    
    if (!player) {
      // Si el jugador no existe, consideramos que ya abandonó
      return NextResponse.json({ left: true });
    }

    // Marcar como desconectado
    player.connected = false;
    player.status = "disconnected";
    
    await saveRoom(room);

    return NextResponse.json({ left: true });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { error: "Error al abandonar la sala" },
      { status: 500 }
    );
  }
}
