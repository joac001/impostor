'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillRoom = search?.get("room") ?? "";
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasRoomCode = prefillRoom.length > 0;
  const createRoomId = useMemo(() => crypto.randomUUID(), []);

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError("Ingresá un apodo");
      return;
    }
    router.push(
      `/salas/${createRoomId}?mode=create&nickname=${encodeURIComponent(nickname.trim())}`,
    );
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError("Ingresá un apodo");
      return;
    }
    router.push(
      `/salas/${prefillRoom}?mode=join&nickname=${encodeURIComponent(nickname.trim())}`,
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-gradient-to-b from-indigo-50 via-white to-white px-5 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
          IM
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Impostor</h1>
          <p className="text-sm text-zinc-500">El juego de deducción social</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-800">Tu apodo</label>
            <Input
              placeholder="Ej: Valeria"
              value={nickname}
              onChange={(e) => {
                setError(null);
                setNickname(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  hasRoomCode ? handleJoin() : handleCreate();
                }
              }}
            />
          </div>

          {hasRoomCode ? (
            <div className="rounded-xl bg-indigo-50 p-3">
              <p className="text-sm text-indigo-700">
                Te invitaron a unirte a una sala
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Creá una sala y compartí el link con tus amigos para jugar.
            </p>
          )}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          {hasRoomCode ? (
            <Button onClick={handleJoin} size="full">
              Unirme a la sala
            </Button>
          ) : (
            <Button onClick={handleCreate} size="full">
              Crear sala
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
