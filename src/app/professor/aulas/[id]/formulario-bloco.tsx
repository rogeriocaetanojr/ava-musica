"use client";

import { useActionState, useId, useState } from "react";
import { type Bloco, BlocoConteudo } from "@/components/bloco-conteudo";
import { Botao } from "@/components/botao";
import { Campo, CampoTexto } from "@/components/campo";
import { TIPOS_DE_BLOCO, type TipoDeBloco } from "@/lib/embeds";
import { ICONES, Icone } from "./icones";
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
  codigo: string;
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
  audio:
    "Link do Google Drive ou de um arquivo de áudio guardado no Supabase Storage do site.",
  link: "Qualquer página que comece com https://.",
  prova:
    "No Forms, crie uma pergunta de resposta curta “Código do aluno” e gere um link pré-preenchido com CODIGO_DO_ALUNO nela. O código de cada aluno aparece na ficha dele. Links forms.gle abrem sem o código preenchido.",
};

export function FormularioBloco({
  acao,
  textoDoBotao,
  inicial,
  codigo,
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
      {/* Tipo escolhido por cards com ícone: rádios de verdade, para o
          teclado (setas) e o leitor de tela funcionarem como num grupo. */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-texto">Tipo</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TIPOS_DE_BLOCO.map((t) => (
            <label
              key={t}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-texto ${
                tipo === t
                  ? "border-destaque bg-bloco text-texto-sobre-bloco"
                  : "border-linha bg-superficie text-texto hover:border-borda-campo"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="sr-only"
              />
              <span className="text-destaque">
                <Icone d={ICONES[t]} />
              </span>
              <span className="min-w-0">{NOMES_DOS_TIPOS[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
        <CampoTexto
          id={`${id}-texto`}
          rotulo="Texto"
          name="texto"
          required
          rows={5}
          maxLength={10000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
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
          <BlocoConteudo bloco={previa} codigo={codigo} />
        </div>
      )}

      <Botao type="submit" disabled={enviando} className="md:w-auto">
        {enviando ? "Salvando…" : textoDoBotao}
      </Botao>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-3 text-sm text-texto-sobre-bloco"
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
