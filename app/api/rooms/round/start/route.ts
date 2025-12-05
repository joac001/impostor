import { NextResponse } from "next/server";
import { 
  canStartRound,
  findPlayerBySession, 
  startRound,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

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

    // Solo el admin puede iniciar la ronda
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede iniciar la ronda" },
        { status: 403 }
      );
    }

    if (!canStartRound(room)) {
      return NextResponse.json(
        { error: "No se puede iniciar la ronda. Verifica que haya palabras y al menos 3 jugadores." },
        { status: 400 }
      );
    }

    startRound(room);
    await saveRoom(room);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error starting round:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al iniciar ronda" },
      { status: 500 }
    );
  }
}
