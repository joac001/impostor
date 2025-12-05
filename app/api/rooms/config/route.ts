import { NextResponse } from "next/server";
import { 
  findPlayerBySession, 
  updateConfig,
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken, impostorCount } = body;

    if (!roomId || !sessionToken || typeof impostorCount !== "number") {
      return NextResponse.json(
        { error: "roomId, sessionToken e impostorCount requeridos" },
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

    // Solo el admin puede cambiar la configuración
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede cambiar la configuración" },
        { status: 403 }
      );
    }

    updateConfig(room, impostorCount);
    await saveRoom(room);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
