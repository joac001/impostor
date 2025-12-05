/**
 * Re-export del cliente Redis para mantener compatibilidad
 * Este archivo ahora es un wrapper sobre redis.ts
 */
export { getRoom, saveRoom, deleteRoom, roomExists, getStorageInfo } from "./redis";

