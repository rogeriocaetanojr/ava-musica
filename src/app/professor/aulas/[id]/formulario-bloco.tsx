"use client";

import { useActionState, useState } from "react";
import { type Bloco, BlocoConteudo } from "@/components/bloco-conteudo";
import { ehTipoDeBloco, TIPOS_DE_BLOCO, type TipoDeBloco } from "@/lib/embeds";
import type { EstadoFormulario } from "../../cursos/validacao";
import { NOMES_DOS_TIPOS } from "./validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  textoDoBotao: string;
  inicial?: Bloco;
  // E-mail do professor, para a pré-visualização da prova.
  email: string;
  // Limpa os campos depois de salvar (formulário de bloco novo).
  limparAoSalvar?: boolean;
};

const DICAS: Record<TipoDeBloco, string> = {
  texto: "",
  youtube: "Aceita links watch, youtu.be, shorts, embed e live.",
  drive:
    'O arquivo precisa estar compartilhado como "qualquer pessoa com o link".',
  audio: "Link do Google Drive ou de um arquivo de áudio (por exemplo, .mp3).",
  link: "Qualquer página que comece com https://.",
  prova:
    "No Forms, gere um link pré-preenchido com EMAIL_DO_ALUNO no campo de e-mail. Links forms.gle viram um botão, sem incorporar.",
};

const campo =
  "w-full rounded-md border border-current bg-transparent px-3 py-2";

export function FormularioBloco({
  acao,
  textoDoBotao,
  inicial,
  email,
  limparAoSalvar = false,
}: Props) {
  const [tipo, setTipo] = useState<TipoDeBloco>(inicial?.tipo ?? "texto");
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [url, setUrl] = useState(inicial?.url ?? "");

  const [estado, enviar, enviando] = useActionState(
    async (anterior: EstadoFormulario, formData: FormData) => {
      const resultado = await acao(anterior, formData);
      if (!resultado.erro && limparAoSalvar) {
        setTitulo("");
        setTexto("");
        setUrl("");
      }
      return resultado;
    },
    {},
  );

  const preenchido = tipo === "texto" ? texto.trim() : url.trim();
  const previa: Bloco = {
    tipo,
    titulo: titulo.trim() || null,
    texto: tipo === "texto" ? texto : null,
    url: tipo === "texto" ? null : url,
  };

  return (
    <form action={enviar} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Tipo</span>
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => {
            if (ehTipoDeBloco(e.target.value)) setTipo(e.target.value);
          }}
          className={campo}
        >
          {TIPOS_DE_BLOCO.map((t) => (
            <option key={t} value={t}>
              {NOMES_DOS_TIPOS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">
          {tipo === "link" ? "Texto do link (opcional)" : "Título (opcional)"}
        </span>
        <input
          name="titulo"
          maxLength={120}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={campo}
        />
      </label>

      {tipo === "texto" ? (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Texto</span>
          <textarea
            name="texto"
            required
            rows={5}
            maxLength={10000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={campo}
          />
        </label>
      ) : (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Link</span>
          <input
            name="url"
            type="url"
            required
            maxLength={2000}
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={campo}
          />
          <span className="block text-xs opacity-80">{DICAS[tipo]}</span>
        </label>
      )}

      {preenchido && (
        <div className="space-y-2 rounded-md border border-dashed border-current/50 p-3">
          <p className="text-xs font-medium tracking-wide uppercase opacity-70">
            Pré-visualização
          </p>
          <BlocoConteudo bloco={previa} email={email} />
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md border border-current px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        {enviando ? "Salvando…" : textoDoBotao}
      </button>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-2 text-sm text-red-800"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="text-sm text-green-700">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
