"use client";

import { useActionState, useId, useState } from "react";
import { type Bloco, BlocoConteudo } from "@/components/bloco-conteudo";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
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
  // Chamado depois de salvar sem erro (fecha o painel no celular).
  aoSalvar?: () => void;
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

// Mesmas classes do Campo, que só cobre input: o select e o textarea usam
// estas.
const campo =
  "min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario";
const rotulo = "block text-sm font-bold text-texto";

export function FormularioBloco({
  acao,
  textoDoBotao,
  inicial,
  email,
  limparAoSalvar = false,
  aoSalvar,
}: Props) {
  const id = useId();
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
      if (!resultado.erro) aoSalvar?.();
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
    <form action={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${id}-tipo`} className={rotulo}>
          Tipo
        </label>
        <select
          id={`${id}-tipo`}
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
      </div>

      <Campo
        id={`${id}-titulo`}
        rotulo={
          tipo === "link" ? "Texto do link (opcional)" : "Título (opcional)"
        }
        name="titulo"
        maxLength={120}
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />

      {tipo === "texto" ? (
        <div className="space-y-2">
          <label htmlFor={`${id}-texto`} className={rotulo}>
            Texto
          </label>
          <textarea
            id={`${id}-texto`}
            name="texto"
            required
            rows={5}
            maxLength={10000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={campo}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Campo
            id={`${id}-url`}
            rotulo="Link"
            name="url"
            type="url"
            required
            maxLength={2000}
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-describedby={`${id}-dica`}
          />
          <p id={`${id}-dica`} className="text-sm text-texto-secundario">
            {DICAS[tipo]}
          </p>
        </div>
      )}

      {preenchido && (
        <div className="space-y-2 rounded-2xl border border-dashed border-borda-campo p-4">
          <p className="text-xs font-bold tracking-wide text-texto-secundario uppercase">
            Pré-visualização
          </p>
          <BlocoConteudo bloco={previa} email={email} />
        </div>
      )}

      <Botao type="submit" disabled={enviando} className="md:w-auto">
        {enviando ? "Salvando…" : textoDoBotao}
      </Botao>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-3 text-sm text-texto-sobre-amarelo"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="text-sm text-sucesso">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
