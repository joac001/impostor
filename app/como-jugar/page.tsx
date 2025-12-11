"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function ComoJugar() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Cómo jugar</h1>

      <Card>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-200">Resumen</h2>
          <p className="text-sm text-slate-400">
            Impostor es un juego social por rondas. Cada jugador recibe una palabra secreta o el rol de impostor. Los no-impostores ven su palabra; todos ven la categoría. Los jugadores van turnándose para decir una pista relacionada. Al final de la ronda, se vota al sospechoso. Si el impostor es descubierto, puede intentar adivinar la palabra secreta.
          </p>
        </section>
      </Card>

      <div className="mt-6 space-y-4">
        <Card title="Preparación">
          <ul className="pl-4 text-sm text-slate-400">
            <li>- Se crea una sala y cada jugador elige un apodo.</li>
            <li>- El admin inicia rondas, eligiendo cuántos impostores (según la configuración).</li>
            <li>- El juego toma palabras de un diccionario compartido; una vez usada, se elimina para no repetir.</li>
          </ul>
        </Card>

        <Card title="Desarrollo de una ronda">
          <ol className="pl-4 text-sm text-slate-400">
            <li>1. Se elige una palabra secreta y se muestra su <strong>categoría</strong> a todos.</li>
            <li>2. Los no-impostores reciben la palabra secreta; los impostores no la conocen.</li>
            <li>3. Cada jugador, en su turno, dice en voz alta una pista (una palabra) relacionada con la palabra secreta.</li>
            <li>4. Cuando todos dan su pista, se pasa a votación para señalar al impostor.</li>
            <li>5. El jugador más votado (o el ganador del desempate) queda en pantalla de resultado: si es impostor, puede intentar adivinar la palabra secreta.</li>
          </ol>
        </Card>

        <Card title="Cómo se suman los puntos">
          <ul className="pl-4 text-sm text-slate-400">
            <li>- Si los jugadores descubren al impostor y el impostor <strong>falla</strong> al adivinar: los no-impostores activos ganan +1 punto cada uno.</li>
            <li>- Si los jugadores descubren al impostor y el impostor <strong>acierta</strong> la palabra: el impostor gana +2 puntos.</li>
            <li>- Si el impostor sobrevive hasta que no queden no-impostores (eliminación por votos): cada impostor activo gana +2 puntos.</li>
            <li>- Puntos adicionales y comportamiento (empates, revotos) siguen las reglas de sala establecidas por el admin.</li>
          </ul>
        </Card>

        <Card title="Consejos">
          <ul className="pl-4 text-sm text-slate-400">
            <li>- No digas la palabra exacta en tu pista.</li>
            <li>- Observá quién evita dar pistas concretas: puede ser el impostor.</li>
            <li>- Si dos jugadores enviaron la misma palabra (duplicada), ambos quedan registrados como autores y ninguno puede ser elegido como impostor para esa ronda.</li>
          </ul>
        </Card>

        <div className="mt-4 flex gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
            onClick={() => {
              if (window.history.length > 2) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
          >
            Volver
          </button>
          <Link href="/salas" className="rounded-xl">
            <button className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">Crear / Unirme</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
