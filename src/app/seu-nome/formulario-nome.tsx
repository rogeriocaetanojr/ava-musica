"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { TAMANHO_MAXIMO_DO_NOME } from "@/lib/nomes";
import { type EstadoDoNome, salvarMeuNome } from "./acoes";

export function FormularioNome() {
  const [estado, enviar, enviando] = useActionState<EstadoDoNome, FormData>(
    salvarMeuNome,
    {},
  );

  return (
    <form action={enviar} className="flex flex-col gap-6">
      <Campo
        id="nome"
        name="nome"
        rotulo="Nome completo"
        autoComplete="name"
        autoCapitalize="words"
        required
        maxLength={TAMANHO_MAXIMO_DO_NOME}
        defaultValue={estado.nome}
        aria-invalid={estado.erro ? true : undefined}
        aria-describedby={estado.erro ? "erro-do-nome" : undefined}
      />
      {estado.erro && (
        <Aviso id="erro-do-nome" role="alert">
          {estado.erro}
        </Aviso>
      )}
      <Botao type="submit" disabled={enviando} aria-busy={enviando}>
        {enviando ? "Salvando…" : "Continuar"}
      </Botao>
    </form>
  );
}
