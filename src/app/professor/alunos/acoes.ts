"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import { hojeNoBrasil } from "@/lib/idade";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehUuid,
  type EstadoFormulario,
  valoresDigitados,
} from "../cursos/validacao";
import { confirmaExclusao, validarAluno } from "./validacao";

export type EstadoCadastro = EstadoFormulario & {
  // Link /aceite/<token> que o professor envia ao responsável do menor de 12.
  linkAceite?: string;
};

const ERRO_EMAIL_EXISTE = "Já existe uma conta com este e-mail.";
const ERRO_BANCO = "Não foi possível salvar. Tente de novo.";

function atualizarTelas() {
  revalidatePath("/professor/alunos");
  revalidatePath("/professor/alunos/[id]", "page");
}

// Fluxo "Cadastro do aluno": 12 anos ou mais recebe convite por e-mail na hora;
// menor de 12 tem a conta criada sem convite e fica aguardando o aceite do
// responsável. O papel nunca é informado: o gatilho do banco sempre cria aluno.
export async function cadastrarAluno(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  await exigirProfessor();

  const resultado = validarAluno(formData, hojeNoBrasil());
  if (!resultado.ok)
    return { erro: resultado.erro, valores: resultado.valores };
  const aluno = resultado.dados;
  const valores = valoresDigitados(formData);

  const supabase = await criarClienteServidor();
  const { data: existente, error: erroBusca } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", aluno.email)
    .maybeSingle();
  if (erroBusca) return { erro: ERRO_BANCO, valores };
  if (existente) return { erro: ERRO_EMAIL_EXISTE, valores };

  const metadados = {
    nome: aluno.nome,
    data_nascimento: aluno.data_nascimento,
    menor_de_12: aluno.responsavel !== null,
  };
  const admin = criarClienteAdmin();

  let alunoId: string;
  let linkAceite: string | undefined;

  if (!aluno.responsavel) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      aluno.email,
      { data: metadados, redirectTo: urlDoSite("/auth/callback") },
    );
    if (error || !data.user)
      return {
        erro:
          error?.code === "email_exists"
            ? ERRO_EMAIL_EXISTE
            : "Não foi possível enviar o convite. Tente de novo.",
        valores,
      };
    alunoId = data.user.id;
  } else {
    // Conta confirmada e sem convite: o acesso só é enviado depois do aceite.
    const { data, error } = await admin.auth.admin.createUser({
      email: aluno.email,
      email_confirm: true,
      user_metadata: metadados,
    });
    if (error || !data.user)
      return {
        erro: error?.code === "email_exists" ? ERRO_EMAIL_EXISTE : ERRO_BANCO,
        valores,
      };
    alunoId = data.user.id;

    const { data: responsavel, error: erroResponsavel } = await supabase
      .from("responsaveis")
      .insert({
        aluno_id: alunoId,
        nome: aluno.responsavel.nome,
        email: aluno.responsavel.email,
      })
      .select("token")
      .single();
    if (erroResponsavel || !responsavel) {
      // Sem o responsável gravado a conta ficaria órfã; desfaz o cadastro.
      await admin.auth.admin.deleteUser(alunoId);
      return { erro: ERRO_BANCO, valores };
    }
    linkAceite = urlDoSite(`/aceite/${responsavel.token}`);
  }

  let aviso = "";
  if (aluno.cursos.length > 0) {
    const { error } = await supabase
      .from("matriculas")
      .insert(
        aluno.cursos.map((curso_id) => ({ aluno_id: alunoId, curso_id })),
      );
    if (error)
      aviso = " As matrículas não foram gravadas; faça-as na página do aluno.";
  }

  atualizarTelas();
  return {
    sucesso: aluno.responsavel
      ? `Conta de ${aluno.nome} criada. Envie o link abaixo para ${aluno.responsavel.nome} autorizar o acesso.${aviso}`
      : `Convite enviado para ${aluno.email}.${aviso}`,
    linkAceite,
  };
}

export async function matricular(
  alunoId: string,
  cursoId: string,
): Promise<void> {
  await exigirProfessor();
  if (!ehUuid(alunoId) || !ehUuid(cursoId)) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("matriculas")
    .upsert(
      { aluno_id: alunoId, curso_id: cursoId },
      { onConflict: "aluno_id,curso_id", ignoreDuplicates: true },
    );
  atualizarTelas();
}

export async function desmatricular(
  alunoId: string,
  cursoId: string,
): Promise<void> {
  await exigirProfessor();
  if (!ehUuid(alunoId) || !ehUuid(cursoId)) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("matriculas")
    .delete()
    .eq("aluno_id", alunoId)
    .eq("curso_id", cursoId);
  atualizarTelas();
}

// Apaga a conta do aluno no login; o banco apaga em cascata o perfil, o
// responsável, as matrículas e o progresso. Não tem volta.
export async function excluirAluno(
  alunoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const supabase = await criarClienteServidor();
  const { data: aluno, error } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", alunoId)
    .eq("papel", "aluno")
    .maybeSingle();
  if (error) return { erro: ERRO_BANCO };
  if (!aluno) return { erro: "Aluno não encontrado." };
  if (!confirmaExclusao(formData.get("confirmacao"), aluno.nome))
    return { erro: "O nome digitado não confere com o nome do aluno." };

  const { error: erroExclusao } =
    await criarClienteAdmin().auth.admin.deleteUser(alunoId);
  if (erroExclusao)
    return { erro: "Não foi possível excluir os dados. Tente de novo." };

  revalidatePath("/professor", "layout");
  redirect("/professor/alunos");
}
