import { NextResponse } from "next/server";
import { 
  addWord, 
  findPlayerBySession, 
  toPublicRoom 
} from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, sessionToken, word, category } = body;

    if (!roomId || !sessionToken) {
      return NextResponse.json(
        { error: "roomId y sessionToken requeridos" },
        { status: 400 }
      );
    }

    if (!word?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: "Palabra y categoría requeridas" },
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

    const result = addWord(room, player.id, word.trim(), category.trim());
    await saveRoom(room);

    return NextResponse.json({
      added: result.added,
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    console.error("Error adding word:", error);
    return NextResponse.json(
      { error: "Error al agregar palabra" },
      { status: 500 }
    );
  }
}
