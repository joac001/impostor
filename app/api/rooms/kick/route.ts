import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  kickPlayer,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken, targetId } = body;

    if (!roomId || !sessionToken || !targetId) {
      return NextResponse.json(
        { error: "roomId, sessionToken y targetId requeridos" },
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

    // Solo el admin puede expulsar
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede expulsar jugadores" },
        { status: 403 }
      );
    }

    // No se puede expulsar a sí mismo
    if (player.id === targetId) {
      return NextResponse.json(
        { error: "No puedes expulsarte a ti mismo" },
        { status: 400 }
      );
    }

    kickPlayer(room, targetId);
    await saveRoom(room);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error kicking player:", error);
    return NextResponse.json(
      { error: "Error al expulsar jugador" },
      { status: 500 }
    );
  }
}
