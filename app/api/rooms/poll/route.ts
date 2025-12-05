import { NextResponse } from "next/server";
import { findPlayerBySession, toPublicRoom } from "@/lib/game/engine";
import { getRoom } from "@/lib/server/redis";

/**
 * Endpoint de polling para obtener el estado actual de la sala.
 * El cliente llama a este endpoint cada 1.5 segundos para sincronizar.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const sessionToken = searchParams.get("sessionToken");

    if (!roomId || !sessionToken) {
      return NextResponse.json(
        { error: "roomId y sessionToken requeridos" },
        { status: 400 }
      );
    }

    const room = await getRoom(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: "Sala no encontrada", code: "room_not_found" },
        { status: 404 }
      );
    }

    if (room.status === "closed") {
      return NextResponse.json(
        { error: "Sala cerrada", code: "room_closed" },
        { status: 410 }
      );
    }

    const player = findPlayerBySession(room, sessionToken);
    
    if (!player) {
      return NextResponse.json(
        { error: "Sesión inválida", code: "invalid_session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
      playerId: player.id,
    });
  } catch (error) {
    console.error("Error polling room:", error);
    return NextResponse.json(
      { error: "Error al obtener estado de la sala" },
      { status: 500 }
    );
  }
}
