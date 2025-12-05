import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  registerVote,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken, targetId, isRevote } = body;

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

    // Verificar que el jugador puede votar (está activo)
    if (player.status !== "active") {
      return NextResponse.json(
        { error: "No puedes votar en tu estado actual" },
        { status: 403 }
      );
    }

    const result = registerVote(room, player.id, targetId, isRevote);
    
    await saveRoom(room);

    return NextResponse.json({
      state: result.state,
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al votar" },
      { status: 500 }
    );
  }
}
