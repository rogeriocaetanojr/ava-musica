import type { ReactNode } from "react";
import { Aviso } from "@/components/aviso";
import { classesDoBotao } from "@/components/botao";
import { lerConteudo, type TipoDeBloco } from "@/lib/embeds";

export type Bloco = {
  tipo: TipoDeBloco;
  titulo: string | null;
  texto: string | null;
  url: string | null;
};

type Props = {
  bloco: Bloco;
  // E-mail que substitui o marcador do Forms (o do aluno logado).
  email?: string;
  // Ações extras abaixo do bloco, como o "Enviei a prova" da área do aluno.
  children?: ReactNode;
};

function Moldura({
  src,
  titulo,
  proporcao,
  permitir,
}: {
  src: string;
  titulo: string;
  proporcao: string;
  permitir?: string;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl ${proporcao}`}>
      <iframe
        src={src}
        title={titulo}
        loading="lazy"
        allow={permitir}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </div>
  );
}

function Conteudo({ bloco, email }: Omit<Props, "children">) {
  const titulo = bloco.titulo ?? "";

  if (bloco.tipo === "texto")
    return (
      <p className="break-words whitespace-pre-wrap">{bloco.texto ?? ""}</p>
    );

  const embed = lerConteudo(bloco.tipo, bloco.url ?? "", email);
  if (!embed)
    return (
      <Aviso role="alert">Link inválido para este tipo de conteúdo.</Aviso>
    );

  switch (embed.tipo) {
    case "youtube":
      return (
        <Moldura
          src={embed.src}
          titulo={titulo || "Vídeo do YouTube"}
          proporcao="aspect-video"
          permitir="encrypted-media; picture-in-picture; fullscreen"
        />
      );
    case "drive":
      return (
        <div className="space-y-2">
          <Moldura
            src={embed.src}
            titulo={titulo || "Arquivo do Google Drive"}
            proporcao={bloco.tipo === "audio" ? "h-28" : "aspect-[3/4]"}
            permitir="autoplay"
          />
          <a
            href={embed.baixar}
            rel="noopener noreferrer"
            className={classesDoBotao("secundario")}
          >
            Baixar arquivo
          </a>
        </div>
      );
    case "audio":
      return (
        <audio controls preload="none" src={embed.src} className="w-full">
          Seu navegador não toca este áudio.
        </audio>
      );
    case "forms":
      return (
        <Moldura
          src={embed.src}
          titulo={titulo || "Prova"}
          proporcao="h-[36rem]"
        />
      );
    case "forms-botao":
    case "link":
      return (
        <a
          href={embed.url}
          target="_blank"
          rel="noopener noreferrer"
          className={classesDoBotao("secundario", "break-all")}
        >
          {embed.tipo === "forms-botao" ? "Abrir a prova" : titulo || embed.url}{" "}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      );
  }
}

// Um bloco de conteúdo da aula, usado na edição do professor e na área do aluno.
export function BlocoConteudo({ bloco, email, children }: Props) {
  const mostrarTitulo = bloco.titulo && bloco.tipo !== "link";

  return (
    <article className="space-y-3">
      {mostrarTitulo && (
        <h2 className="font-semibold break-words">{bloco.titulo}</h2>
      )}
      <Conteudo bloco={bloco} email={email} />
      {children}
    </article>
  );
}
