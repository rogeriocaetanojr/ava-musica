"use client";

import { useRef, useState } from "react";

function minutos(segundos: number): string {
  if (!Number.isFinite(segundos)) return "0:00";
  const inteiro = Math.floor(segundos);
  return `${Math.floor(inteiro / 60)}:${String(inteiro % 60).padStart(2, "0")}`;
}

// Playback com um botão grande de tocar e pausar, no lugar dos controles
// pequenos do navegador.
export function TocadorDePlayback({
  src,
  titulo,
}: {
  src: string;
  titulo: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);

  function alternar() {
    const elemento = audio.current;
    if (!elemento) return;
    if (elemento.paused) void elemento.play();
    else elemento.pause();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={alternar}
        aria-label={tocando ? `Pausar ${titulo}` : `Tocar ${titulo}`}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-bordo text-amarelo hover:bg-vinho"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
          {tocando ? (
            <path fill="currentColor" d="M7 5h3v14H7zM14 5h3v14h-3z" />
          ) : (
            <path fill="currentColor" d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>
      <div className="min-w-0">
        <p className="font-bold break-words text-texto">{titulo}</p>
        <p className="text-sm text-texto-secundario">
          {minutos(atual)} de {minutos(duracao)}
        </p>
      </div>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onTimeUpdate={(evento) => setAtual(evento.currentTarget.currentTime)}
        onLoadedMetadata={(evento) => setDuracao(evento.currentTarget.duration)}
      >
        Seu navegador não toca este áudio.
      </audio>
    </div>
  );
}
