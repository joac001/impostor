import { NextResponse } from "next/server";
import { addPlayer, findPlayerBySession, reconnectPlayer, toPublicRoom } from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, nickname, sessionToken } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID requerido" },
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

    // Intentar reconexión si hay token
    if (sessionToken) {
      const existingPlayer = findPlayerBySession(room, sessionToken);
      if (existingPlayer) {
        reconnectPlayer(existingPlayer);
        await saveRoom(room);

        return NextResponse.json({
          room: toPublicRoom(room, existingPlayer.id),
          sessionToken: existingPlayer.sessionToken,
          playerId: existingPlayer.id,
          reconnected: true,
        });
      }
    }

    // Nuevo jugador
    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: "Nickname requerido" },
        { status: 400 }
      );
    }

    const player = addPlayer(room, nickname.trim());
    await saveRoom(room);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
      sessionToken: player.sessionToken,
      playerId: player.id,
      reconnected: false,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Error al unirse a la sala" },
      { status: 500 }
    );
  }
}
