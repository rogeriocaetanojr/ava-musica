"use client";

import { useActionState } from "react";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import type { EstadoFormulario } from "../cursos/validacao";

type Props = {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  cursos: { id: string; titulo: string }[];
  inicial?: Record<string, string>;
  textoDoBotao: string;
  // Prefixo dos ids dos campos, porque a página tem vários formulários.
  prefixo: string;
  // Chamado depois de salvar sem erro (fecha o painel).
  aoSalvar?: () => void;
};

// Mesmo visual do Campo, para a mensagem e o destino.
const campo =
  "min-h-14 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario";
const rotulo = "block text-sm font-bold text-texto";

export function FormularioAviso({
  acao,
  cursos,
  inicial = {},
  textoDoBotao,
  prefixo,
  aoSalvar,
}: Props) {
  const [estado, enviar, enviando] = useActionState(
    async (anterior: EstadoFormulario, formData: FormData) => {
      const resultado = await acao(anterior, formData);
      if (!resultado.erro) aoSalvar?.();
      return resultado;
    },
    {},
  );
  const valores = estado.valores ?? inicial;

  // A chave muda com os valores devolvidos, para os campos recarregarem
  // (e o formulário de novo recado ficar limpo depois de publicar).
  return (
    <form key={JSON.stringify(valores)} action={enviar} className="space-y-4">
      <Campo
        id={`${prefixo}-titulo`}
        rotulo="Título"
        name="titulo"
        required
        maxLength={120}
        defaultValue={valores.titulo}
      />

      <div className="space-y-2">
        <label htmlFor={`${prefixo}-texto`} className={rotulo}>
          Mensagem
        </label>
        <textarea
          id={`${prefixo}-texto`}
          name="texto"
          required
          rows={4}
          maxLength={2000}
          defaultValue={valores.texto}
          className={campo}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${prefixo}-curso`} className={rotulo}>
          Para quem
        </label>
        <select
          id={`${prefixo}-curso`}
          name="curso_id"
          defaultValue={valores.curso_id ?? ""}
          className={campo}
        >
          <option value="">Todos os alunos</option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              Alunos de {curso.titulo}
            </option>
          ))}
        </select>
      </div>

      <Botao type="submit" disabled={enviando} className="sm:w-auto">
        {enviando ? "Salvando…" : textoDoBotao}
      </Botao>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-amarelo-claro p-4 text-texto-sobre-amarelo"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="rounded-xl bg-linha p-4 text-sucesso">
          {estado.sucesso}
        </p>
      )}
    </form>
  );
}
