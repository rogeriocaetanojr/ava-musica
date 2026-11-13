"use client";

import { useActionState, useState } from "react";
import { Botao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
import { confirmaExclusao } from "./validacao";
import { excluirAluno } from "./acoes";

// Pede para digitar o nome do aluno antes de liberar o botão; o servidor
// confere de novo antes de apagar.
export function FormularioExclusao({
  alunoId,
  nome,
}: {
  alunoId: string;
  nome: string;
}) {
  const [digitado, setDigitado] = useState("");
  const [estado, enviar, enviando] = useActionState(
    excluirAluno.bind(null, alunoId),
    {},
  );
  const confere = confirmaExclusao(digitado, nome);

  return (
    <form action={enviar} className="space-y-3">
      <p className="text-sm text-texto-secundario">
        Apaga a conta, o responsável, as matrículas e todo o progresso de{" "}
        <strong className="break-words">{nome}</strong>. Não dá para desfazer.
      </p>
      <label className="block space-y-2">
        <span className="block text-sm font-bold text-texto">
          Para confirmar, digite o nome do aluno
        </span>
        <input
          name="confirmacao"
          autoComplete="off"
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          className={classesDoCampo()}
        />
      </label>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl bg-bloco p-4 text-sm text-texto-sobre-bloco"
        >
          {estado.erro}
        </p>
      )}
      <Botao type="submit" disabled={!confere || enviando} tamanho="pequeno">
        {enviando ? "Excluindo…" : "Excluir todos os dados"}
      </Botao>
    </form>
  );
}
