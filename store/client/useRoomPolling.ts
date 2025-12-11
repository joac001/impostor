'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicRoomState } from "@/lib/types/game";

type Mode = "create" | "join";
type Status = "idle" | "connecting" | "connected" | "error" | "closed";

const STORAGE_KEY_PREFIX = "impostor_session_";
const POLL_INTERVAL = 2000; // 2 segundos — reduce consumo en Upstash gratuito

const storageKey = (roomId: string) => `${STORAGE_KEY_PREFIX}${roomId}`;

interface UseRoomPollingOptions {
  roomId: string;
  nickname: string;
  mode: Mode;
}

interface RoomApi {
  addWord: (word: string, category: string) => Promise<void>;
  startRound: () => Promise<void>;
  openVoting: () => Promise<void>;
  vote: (targetId: string, isRevote?: boolean) => Promise<void>;
  continueAfterResult: () => Promise<void>;
  markImpostorGuess: (success: boolean) => Promise<void>;
  updateConfig: (impostorCount: number) => Promise<void>;
  kick: (targetId: string) => Promise<void>;
  closeRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
}

/**
 * Hook para manejar la conexión a una sala usando polling HTTP.
 * Reemplaza el hook de WebSocket para compatibilidad con Vercel.
 */
export const useRoomPolling = ({ roomId, nickname, mode }: UseRoomPollingOptions) => {
  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const initializingRef = useRef(false);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Inicializar: crear o unirse a la sala
  const initialize = useCallback(async () => {
    // Evitar inicializaciones múltiples
    if (initializedRef.current || initializingRef.current) return;
    if (!nickname.trim() || !roomId) return;
    
    initializingRef.current = true;
    setStatus("connecting");
    setError(null);

    try {
      const storedToken = window.localStorage.getItem(storageKey(roomId));
      
      if (mode === "create") {
        // Crear sala (o unirse si ya existe)
        const res = await fetch("/api/rooms/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            roomId, 
            nickname: nickname.trim(),
            sessionToken: storedToken || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al crear sala");
        }

        const data = await res.json();
        if (mountedRef.current) {
          setRoom(data.room);
          setPlayerId(data.playerId);
          setSessionToken(data.sessionToken);
          window.localStorage.setItem(storageKey(roomId), data.sessionToken);
          setStatus("connected");
          initializedRef.current = true;
        }
      } else {
        // Unirse a sala (o reconectar)
        const res = await fetch("/api/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            nickname: nickname.trim(),
            sessionToken: storedToken || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al unirse a la sala");
        }

        const data = await res.json();
        if (mountedRef.current) {
          setRoom(data.room);
          setPlayerId(data.playerId);
          setSessionToken(data.sessionToken);
          window.localStorage.setItem(storageKey(roomId), data.sessionToken);
          setStatus("connected");
          initializedRef.current = true;
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        setStatus("error");
      }
    } finally {
      initializingRef.current = false;
    }
  }, [roomId, nickname, mode, stopPolling]);

  // Polling para obtener actualizaciones
  const poll = useCallback(async () => {
    if (!sessionToken || !roomId) return;

    try {
      const res = await fetch(
        `/api/rooms/poll?roomId=${encodeURIComponent(roomId)}&sessionToken=${encodeURIComponent(sessionToken)}`
      );

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "room_closed") {
          if (mountedRef.current) {
            setStatus("closed");
            stopPolling();
          }
          return;
        }
        if (data.code === "room_not_found" || data.code === "invalid_session") {
          if (mountedRef.current) {
            setStatus("error");
            setError(data.error);
            stopPolling();
          }
          return;
        }
        throw new Error(data.error);
      }

      const data = await res.json();
      if (mountedRef.current) {
        setRoom(data.room);
      }
    } catch (err) {
      console.warn("Polling error:", err);
      // No cambiar el estado a error por un fallo de polling temporal
    }
  }, [sessionToken, roomId, stopPolling]);

  // Iniciar polling cuando estemos conectados
  useEffect(() => {
    if (status === "connected" && sessionToken) {
      // Polling inicial
      poll();
      // Configurar intervalo
      pollingRef.current = setInterval(poll, POLL_INTERVAL);
    }

    return () => {
      stopPolling();
    };
  }, [status, sessionToken, poll, stopPolling]);

  // Inicializar al montar
  useEffect(() => {
    mountedRef.current = true;
    if (nickname.trim()) {
      initialize();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [initialize, nickname, stopPolling]);

  // API de acciones
  const api = useMemo<RoomApi | null>(() => {
    if (!roomId || !sessionToken) return null;

    const callApi = async (endpoint: string, body: object) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, sessionToken, ...body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error en la operación");
      }

      const data = await res.json();
      if (data.room && mountedRef.current) {
        setRoom(data.room);
      }
      return data;
    };

    return {
      addWord: (word: string, category: string) =>
        callApi("/api/rooms/word", { word, category }),
      
      startRound: () =>
        callApi("/api/rooms/round/start", {}),
      
      openVoting: () =>
        callApi("/api/rooms/round/open-vote", {}),
      
      vote: (targetId: string, isRevote?: boolean) =>
        callApi("/api/rooms/round/vote", { targetId, isRevote }),
      
      continueAfterResult: () =>
        callApi("/api/rooms/round/continue", {}),
      
      markImpostorGuess: (success: boolean) =>
        callApi("/api/rooms/round/guess", { success }),
      
      updateConfig: (impostorCount: number) =>
        callApi("/api/rooms/config", { impostorCount }),
      
      kick: (targetId: string) =>
        callApi("/api/rooms/kick", { targetId }),
      
      closeRoom: async () => {
        await callApi("/api/rooms/close", {});
        stopPolling();
        setStatus("closed");
      },
      
      leaveRoom: async () => {
        try {
          await fetch("/api/rooms/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, sessionToken }),
          });
        } catch {
          // Ignorar errores al abandonar
        }
        window.localStorage.removeItem(storageKey(roomId));
        stopPolling();
        setRoom(null);
        setPlayerId(null);
        setSessionToken(null);
        setStatus("idle");
      },
    };
  }, [roomId, sessionToken, stopPolling]);

  return {
    room,
    playerId,
    sessionToken,
    status,
    error,
    api,
  };
};

// Mantener compatibilidad con el nombre anterior
export const useRoomClient = useRoomPolling;
