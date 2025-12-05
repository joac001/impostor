import { Redis } from "@upstash/redis";
import type { RoomState } from "@/lib/types/game";

/**
 * Cliente Redis con fallback a almacenamiento en memoria para desarrollo local.
 * En producción usa Upstash Redis, en desarrollo usa un Map en memoria.
 * 
 * IMPORTANTE: En desarrollo usamos un singleton global para evitar que
 * el HMR de Next.js cree múltiples instancias del Map.
 */

// Declaración global para persistir el store entre HMR
declare global {
  // eslint-disable-next-line no-var
  var __memoryStore: Map<string, string> | undefined;
}

// Singleton del store en memoria (persiste entre HMR en desarrollo)
const getMemoryStore = (): Map<string, string> => {
  if (typeof globalThis.__memoryStore === "undefined") {
    globalThis.__memoryStore = new Map<string, string>();
  }
  return globalThis.__memoryStore;
};

// Detectar si estamos en producción con Upstash configurado
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Cliente Redis (solo se crea si está configurado)
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Prefijo para las claves de salas
 */
const ROOM_PREFIX = "room:";

/**
 * TTL para las salas (24 horas en segundos)
 * Las salas se eliminan automáticamente después de 24 horas de inactividad
 */
const ROOM_TTL = 60 * 60 * 24;

/**
 * Obtener una sala por su ID
 */
export async function getRoom(roomId: string): Promise<RoomState | null> {
  const key = ROOM_PREFIX + roomId;
  
  if (redis) {
    // Producción: usar Upstash
    const data = await redis.get<RoomState>(key);
    return data;
  } else {
    // Desarrollo: usar memoria global
    const memoryStore = getMemoryStore();
    const data = memoryStore.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as RoomState;
    } catch {
      return null;
    }
  }
}

/**
 * Guardar una sala (con serialización profunda para evitar referencias)
 */
export async function saveRoom(room: RoomState): Promise<void> {
  const key = ROOM_PREFIX + room.id;
  // Serializar para crear una copia profunda y evitar mutaciones
  const serialized = JSON.stringify(room);
  
  if (redis) {
    // Producción: usar Upstash con TTL
    await redis.set(key, JSON.parse(serialized), { ex: ROOM_TTL });
  } else {
    // Desarrollo: usar memoria global
    const memoryStore = getMemoryStore();
    memoryStore.set(key, serialized);
  }
}

/**
 * Eliminar una sala
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const key = ROOM_PREFIX + roomId;
  
  if (redis) {
    await redis.del(key);
  } else {
    const memoryStore = getMemoryStore();
    memoryStore.delete(key);
  }
}

/**
 * Verificar si una sala existe
 */
export async function roomExists(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId);
  return room !== null;
}

/**
 * Log para debug: mostrar qué storage se está usando
 */
export function getStorageInfo(): string {
  return isUpstashConfigured ? "Upstash Redis" : "Memory (development)";
}
