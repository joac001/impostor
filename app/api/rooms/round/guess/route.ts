import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  resolveImpostorGuess,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

/**
 * El admin marca si el impostor adivinó la palabra secreta
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken, success } = body;

    if (!roomId || !sessionToken || typeof success !== "boolean") {
      return NextResponse.json(
        { error: "roomId, sessionToken y success requeridos" },
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

    // Solo el admin puede marcar el resultado
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede marcar el resultado" },
        { status: 403 }
      );
    }

    if (!room.round?.impostorGuessPending) {
      return NextResponse.json(
        { error: "No hay intento de adivinanza pendiente" },
        { status: 400 }
      );
    }

    const summary = resolveImpostorGuess(room, success);
    await saveRoom(room);

    return NextResponse.json({
      summary, // Puede ser null si la ronda continúa
      roundContinues: summary === null,
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error resolving guess:", error);
    return NextResponse.json(
      { error: "Error al resolver adivinanza" },
      { status: 500 }
    );
  }
}
