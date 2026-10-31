"use server";

import { redirect } from "next/navigation";
import { destinoDoPapel, exigirAluno } from "@/lib/auth";
import { validarNome } from "@/lib/nomes";
import { confirmarPedido } from "@/lib/pedidos";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoDoNome = { erro?: string; nome?: string };

// Grava o nome de quem entrou sem nome. Só depois disso o pedido de acesso de
// quem não tem cadastro vai ao professor, já com o nome.
export async function salvarMeuNome(
  _estado: EstadoDoNome,
  formData: FormData,
): Promise<EstadoDoNome> {
  const sessao = await exigirAluno({ semNome: true });

  const digitado = formData.get("nome");
  const resultado = validarNome(digitado);
  if (!resultado.ok)
    return {
      erro: resultado.erro,
      nome: typeof digitado === "string" ? digitado : "",
    };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("definir_meu_nome", {
    p_nome: resultado.nome,
  });
  // no_data_found: o nome já tinha sido informado (outra aba, por exemplo).
  if (error && error.code !== "P0002")
    return {
      erro: "Não foi possível salvar o nome. Tente de novo.",
      nome: resultado.nome,
    };

  if (!error && sessao.pendente)
    await confirmarPedido({ ...sessao, nome: resultado.nome });

  // O aluno pendente vai direto para a espera, sem passar pelos cursos.
  redirect(sessao.pendente ? "/aguardando" : destinoDoPapel(sessao.papel));
}
