import type { ReactNode } from "react";
import type { Bloco } from "@/components/bloco-conteudo";
import { classesDoBotao } from "@/components/botao";
import { TocadorDePlayback } from "@/components/tocador-de-playback";
import { lerConteudo } from "@/lib/embeds";

function Icone({ d, tamanho = "size-6" }: { d: string; tamanho?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${tamanho} shrink-0`}
    >
      <path d={d} />
    </svg>
  );
}

const ARQUIVO = "M14 3H6v18h12V7zM14 3v4h4";
const BAIXAR = "M12 4v11M7 10l5 5 5-5M5 20h14";
const FORMULARIO = "M4 4h16v16H4zM8 12l3 3 5-6";
const LINK = "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6";

function Cabecalho({
  icone,
  titulo,
  detalhe,
}: {
  icone: string;
  titulo: string;
  detalhe: string;
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
    </div>
  );
}

// Cartão de material que abre fora do site: ícone, título e os botões.
function Cartao({
  icone,
  titulo,
  detalhe,
  abrir,
  textoAbrir,
  baixar,
}: {
  icone: string;
  titulo: string;
  detalhe: string;
  abrir: string;
  textoAbrir: string;
  baixar?: string;
}) {
  return (
    <div className="space-y-4">
      <Cabecalho icone={icone} titulo={titulo} detalhe={detalhe} />
      <div className="flex flex-col gap-3 md:flex-row">
        <a
          href={abrir}
          target="_blank"
          rel="noopener noreferrer"
          className={classesDoBotao("secundario", "md:w-auto")}
        >
          <Icone d={LINK} tamanho="size-5" />
          {textoAbrir}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        {baixar && (
          <a
            href={baixar}
            rel="noopener noreferrer"
            className={classesDoBotao("secundario", "md:w-auto")}
          >
            <Icone d={BAIXAR} tamanho="size-5" />
            Baixar
            <span className="sr-only"> {titulo}</span>
          </a>
        )}
      </div>
    </div>
  );
}

// Conteúdo de um bloco que não é texto. Só o YouTube fica incorporado; Drive,
// Forms e links abrem em nova guia. Usado também na pré-visualização.
export function ConteudoDoMaterial({
  bloco,
  email,
}: {
  bloco: Bloco;
  email?: string;
}) {
  const embed = lerConteudo(bloco.tipo, bloco.url ?? "", email);
  if (!embed)
    return (
      <p role="alert" className="text-sm font-semibold text-destaque">
        Link inválido para este tipo de conteúdo.
      </p>
    );

  switch (embed.tipo) {
    case "drive": {
      const audio = bloco.tipo === "audio";
      return (
        <Cartao
          icone={ARQUIVO}
          titulo={
            bloco.titulo || (audio ? "Playback" : "Arquivo do Google Drive")
          }
          detalhe={audio ? "Playback · Google Drive" : "Google Drive"}
          abrir={embed.abrir}
          textoAbrir="Abrir arquivo"
          baixar={embed.baixar}
        />
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
        <Cartao
          icone={FORMULARIO}
          titulo={bloco.titulo || "Prova"}
          detalhe="Google Forms"
          abrir={embed.url}
          textoAbrir="Abrir a prova"
        />
      );
    case "link":
      return (
        <Cartao
          icone={LINK}
          titulo={bloco.titulo || embed.url}
          detalhe="Link externo"
          abrir={embed.url}
          textoAbrir="Abrir link"
        />
      );
    case "youtube":
      return (
        <iframe
          src={embed.src}
          title={bloco.titulo || "Vídeo do YouTube"}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-xl border-0"
        />
      );
  }
}

// Cartão de um material da aula (Drive, playback, link ou prova).
export function MaterialDaAula({
  bloco,
  email,
  children,
}: {
  bloco: Bloco;
  email?: string;
  children?: ReactNode;
}) {
  return (
    <li
      className={`space-y-3 rounded-2xl border border-linha bg-superficie p-4 ${bloco.tipo === "youtube" ? "md:col-span-2" : ""}`}
    >
      <ConteudoDoMaterial bloco={bloco} email={email} />
      {children}
    </li>
  );
}
