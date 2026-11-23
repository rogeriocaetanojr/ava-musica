"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { TAMANHO_MAXIMO_DO_NOME } from "@/lib/nomes";
import type { EstadoDoMeuNome } from "@/lib/meu-nome";

type AcaoDoNome = (
  estado: EstadoDoMeuNome,
  formData: FormData,
) => Promise<EstadoDoMeuNome>;

const LAPIS = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

// Nome do Meu perfil com o lápis ao lado: vira um campo com Salvar e
// Cancelar. A ação (do aluno ou do professor) valida e grava no banco.
export function EditarNome({ nome, acao }: { nome: string; acao: AcaoDoNome }) {
  const [editando, setEditando] = useState(false);
  const [estado, enviar, enviando] = useActionState<EstadoDoMeuNome, FormData>(
    async (anterior, formData) => {
      const resultado = await acao(anterior, formData);
      if (resultado.ok) setEditando(false);
      return resultado;
    },
    {},
  );

  if (!editando)
    return (
      <div className="flex items-center gap-1">
        <p className="min-w-0 font-titulo text-xl break-words text-texto">
          {nome}
        </p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-texto-secundario hover:bg-bloco hover:text-texto-sobre-bloco"
        >
          {LAPIS}
          <span className="sr-only">Editar o nome</span>
        </button>
      </div>
    );

  return (
    <form action={enviar} className="w-full space-y-3">
      <Campo
        id="nome-do-perfil"
        name="nome"
        rotulo="Nome completo"
        autoComplete="name"
        autoCapitalize="words"
        required
        autoFocus
        maxLength={TAMANHO_MAXIMO_DO_NOME}
        defaultValue={estado.erro ? estado.nome : nome}
        aria-invalid={estado.erro ? true : undefined}
        aria-describedby={estado.erro ? "erro-do-nome-do-perfil" : undefined}
      />
      {estado.erro && (
        <Aviso id="erro-do-nome-do-perfil" role="alert">
          {estado.erro}
        </Aviso>
      )}
      <div className="flex gap-2">
        <Botao
          type="submit"
          tamanho="pequeno"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando ? "Salvando…" : "Salvar"}
        </Botao>
        <Botao
          variante="secundario"
          tamanho="pequeno"
          disabled={enviando}
          onClick={() => setEditando(false)}
        >
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
