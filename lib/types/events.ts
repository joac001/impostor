import type { PublicRoomState, RoomState } from "./game";

export type ClientMessage =
  | { type: "create_room"; nickname: string; roomId?: string }
  | { type: "join_room"; roomId: string; nickname: string; sessionToken?: string }
  | { type: "reconnect"; roomId: string; sessionToken: string }
  | { type: "add_word"; roomId: string; word: string; category: string; sessionToken: string }
  | { type: "start_round"; roomId: string; sessionToken: string }
  | { type: "vote"; roomId: string; targetId: string; isRevote?: boolean; sessionToken: string }
  | { type: "mark_impostor_guess"; roomId: string; success: boolean; sessionToken: string }
  | { type: "kick_player"; roomId: string; targetId: string; sessionToken: string }
  | { type: "close_room"; roomId: string; sessionToken: string }
  | { type: "update_config"; roomId: string; impostorCount: number; sessionToken: string }
  | { type: "heartbeat"; roomId: string; sessionToken: string };

export type ServerMessage =
  | { type: "room_created"; room: PublicRoomState; sessionToken: string; playerId: string }
  | { type: "joined"; room: PublicRoomState; sessionToken: string; playerId: string }
  | { type: "room_snapshot"; room: PublicRoomState }
  | { type: "player_joined"; room: PublicRoomState }
  | { type: "player_updated"; room: PublicRoomState }
  | { type: "word_added"; room: PublicRoomState }
  | { type: "round_started"; room: PublicRoomState }
  | { type: "vote_state"; room: PublicRoomState }
  | { type: "round_resolved"; room: PublicRoomState }
  | { type: "room_closed"; room: PublicRoomState }
  | { type: "error"; code: string; message: string }
  | { type: "pong"; ts: number };

export type Broadcaster = (room: RoomState, specificPlayerId?: string) => void;
