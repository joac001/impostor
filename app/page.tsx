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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-[#0f1419] px-5 py-10">
      {/* Logo header */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-3xl font-bold text-white shadow-lg shadow-emerald-500/30 animate-float">
          🎭
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-emerald-400">Impostor</h1>
          <p className="text-sm text-slate-500 mt-1">El juego de deducción social</p>
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={() => router.push('/como-jugar')} size="sm">Cómo jugar</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200">Tu apodo</label>
            <Input
              placeholder="Ej: Cecilio"
              value={nickname}
              onChange={(e) => {
                setError(null);
                setNickname(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (hasRoomCode) {
                    handleJoin();
                  } else {
                    handleCreate();
                  }
                }
              }}
            />
          </div>

          {hasRoomCode ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-sm text-emerald-400">
                Te invitaron a unirte a una sala
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Creá una sala y compartí el link con tus amigos para jugar.
            </p>
          )}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

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

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600">
        <p>Mínimo 3 jugadores para iniciar</p>
      </footer>
    </main>
  );
}
