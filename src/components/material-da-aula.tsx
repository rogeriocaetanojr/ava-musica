import type { ReactNode } from "react";
import type { Bloco } from "@/components/bloco-conteudo";
import { TocadorDePlayback } from "@/components/tocador-de-playback";
import { lerConteudo } from "@/lib/embeds";

function Icone({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
    >
      <path d={d} />
    </svg>
  );
}

const ARQUIVO = "M14 3H6v18h12V7zM14 3v4h4";
const BAIXAR = "M12 4v11M7 10l5 5 5-5M5 20h14";
const FORMULARIO = "M4 4h16v16H4zM8 12l3 3 5-6";
const LINK = "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6";

const acao =
  "grid size-12 shrink-0 place-items-center rounded-xl text-texto hover:bg-bloco";

function Cabecalho({
  icone,
  titulo,
  detalhe,
  children,
}: {
  icone: string;
  titulo: string;
  detalhe: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bloco text-destaque md:size-12">
        <Icone d={icone} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold break-words text-texto">{titulo}</p>
        <p className="text-sm text-texto-secundario">{detalhe}</p>
      </div>
      {children}
    </div>
  );
}

function Moldura({
  src,
  titulo,
  altura,
  permitir = "autoplay",
}: {
  src: string;
  titulo: string;
  altura: string;
  permitir?: string;
}) {
  return (
    <iframe
      src={src}
      title={titulo}
      loading="lazy"
      allow={permitir}
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={`w-full rounded-xl border-0 ${altura}`}
    />
  );
}

function Conteudo({ bloco, email }: { bloco: Bloco; email?: string }) {
  const embed = lerConteudo(bloco.tipo, bloco.url ?? "", email);
  if (!embed)
    return (
      <p role="alert" className="text-sm font-semibold text-destaque">
        Link inválido para este tipo de conteúdo.
      </p>
    );

  switch (embed.tipo) {
    case "drive": {
      const titulo = bloco.titulo || "Arquivo do Google Drive";
      const audio = bloco.tipo === "audio";
      return (
        <div className="space-y-3">
          <Cabecalho
            icone={ARQUIVO}
            titulo={titulo}
            detalhe={audio ? "Playback · Google Drive" : "Google Drive"}
          >
            <a
              href={embed.baixar}
              rel="noopener noreferrer"
              aria-label={`Baixar ${titulo}`}
              className={acao}
            >
              <Icone d={BAIXAR} />
            </a>
          </Cabecalho>
          <Moldura
            src={embed.src}
            titulo={titulo}
            altura={audio ? "h-28" : "aspect-[3/4]"}
          />
        </div>
      );
    }
    case "audio":
      return (
        <TocadorDePlayback
          src={embed.src}
          titulo={bloco.titulo || "Playback"}
        />
      );
    case "forms":
      return (
        <div className="space-y-3">
          <Cabecalho
            icone={FORMULARIO}
            titulo={bloco.titulo || "Prova"}
            detalhe="Google Forms · abre aqui mesmo"
          />
          <Moldura
            src={embed.src}
            titulo={bloco.titulo || "Prova"}
            altura="h-[36rem]"
          />
        </div>
      );
    case "forms-botao":
    case "link": {
      const prova = embed.tipo === "forms-botao";
      const titulo = bloco.titulo || (prova ? "Prova" : embed.url);
      return (
        <Cabecalho
          icone={prova ? FORMULARIO : LINK}
          titulo={titulo}
          detalhe={prova ? "Google Forms · abre em nova aba" : "Link externo"}
        >
          <a
            href={embed.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${prova ? "Abrir a prova" : `Abrir ${titulo}`} (abre em nova aba)`}
            className={acao}
          >
            <Icone d={LINK} />
          </a>
        </Cabecalho>
      );
    }
    case "youtube":
      return (
        <Moldura
          src={embed.src}
          titulo={bloco.titulo || "Vídeo do YouTube"}
          altura="aspect-video"
          permitir="encrypted-media; picture-in-picture; fullscreen"
        />
      );
  }
}

// Cartão de um material da aula (Drive, playback, link ou prova), com as
// mesmas regras de incorporação do BlocoConteudo.
export function MaterialDaAula({
  bloco,
  email,
  children,
}: {
  bloco: Bloco;
  email?: string;
  children?: ReactNode;
}) {
  const largo =
    bloco.tipo === "prova" ||
    bloco.tipo === "youtube" ||
    bloco.tipo === "drive";
  return (
    <li
      className={`space-y-3 rounded-2xl border border-linha bg-superficie p-4 ${largo ? "md:col-span-2" : ""}`}
    >
      <Conteudo bloco={bloco} email={email} />
      {children}
    </li>
  );
}
