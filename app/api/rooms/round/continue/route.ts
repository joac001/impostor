import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  continueAfterResult,
  finalizeImpostorWinsBySurvival,
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

    // Solo el admin puede continuar
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el admin puede continuar" },
        { status: 403 }
      );
    }

    const result = continueAfterResult(room);
    
    // Si el impostor gana por supervivencia, finalizar
    let summary = null;
    if (result.state === "survival_win") {
      summary = finalizeImpostorWinsBySurvival(room);
    }
    
    await saveRoom(room);

    return NextResponse.json({
      state: result.state,
      summary,
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error continuing after result:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al continuar" },
      { status: 500 }
    );
  }
}
