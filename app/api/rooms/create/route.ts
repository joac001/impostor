import { NextResponse } from "next/server";
import { createRoom, toPublicRoom, addPlayer, findPlayerBySession, reconnectPlayer } from "@/lib/game/engine";
import { getRoom, saveRoom } from "@/lib/server/redis";
import { shortId } from "@/lib/utils/strings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nickname, roomId: customRoomId, sessionToken } = body;

    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: "Nickname requerido" },
        { status: 400 }
      );
    }

    const roomId = customRoomId || shortId();
    
    // Verificar si la sala ya existe
    const existingRoom = await getRoom(roomId);
    
    if (existingRoom && existingRoom.status !== "closed") {
      // La sala existe, intentar unirse o reconectar
      if (sessionToken) {
        const existingPlayer = findPlayerBySession(existingRoom, sessionToken);
        if (existingPlayer) {
          reconnectPlayer(existingPlayer);
          await saveRoom(existingRoom);
          return NextResponse.json({
            room: toPublicRoom(existingRoom, existingPlayer.id),
            sessionToken: existingPlayer.sessionToken,
            playerId: existingPlayer.id,
            reconnected: true,
          });
        }
      }
      
      // No hay token válido, unirse como nuevo jugador
      const player = addPlayer(existingRoom, nickname.trim());
      await saveRoom(existingRoom);
      return NextResponse.json({
        room: toPublicRoom(existingRoom, player.id),
        sessionToken: player.sessionToken,
        playerId: player.id,
      });
    }
    
    // Crear nueva sala
    const { room, player } = createRoom(roomId, nickname.trim());
    await saveRoom(room);

    return NextResponse.json({
      room: toPublicRoom(room, player.id),
      sessionToken: player.sessionToken,
      playerId: player.id,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Error al crear la sala" },
      { status: 500 }
    );
  }
}
