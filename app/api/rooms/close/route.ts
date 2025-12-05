import { NextResponse } from "next/server";
import { 
  closeRoom,
  findPlayerBySession, 
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
    
    if (!room) {
      return NextResponse.json(
        { error: "Sala no encontrada" },
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

    // Solo el admin puede cerrar la sala
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: "Solo el administrador puede cerrar la sala" },
        { status: 403 }
      );
    }

    closeRoom(room);
    await saveRoom(room);
    
    // Eliminar la sala después de un tiempo (opcional, el TTL ya lo hace)
    // await deleteRoom(roomId);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
      closed: true,
    });
  } catch (error) {
    console.error("Error closing room:", error);
    return NextResponse.json(
      { error: "Error al cerrar la sala" },
      { status: 500 }
    );
  }
}
