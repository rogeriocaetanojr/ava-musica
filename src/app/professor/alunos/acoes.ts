"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import { registrarAcesso } from "@/lib/auditoria";
import { hojeNoBrasil } from "@/lib/idade";
import { reservarEnvioDeConvite } from "@/lib/limite-convites";
import { urlDoSite } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  ehUuid,
  type EstadoFormulario,
  valoresDigitados,
} from "../cursos/validacao";
import {
  confirmaExclusao,
  normalizarEmail,
  validarAluno,
  validarLiberacao,
} from "./validacao";

export type EstadoCadastro = EstadoFormulario & {
  // Link /aceite/<token> que o professor envia ao responsável do menor de 12.
  linkAceite?: string;
};

const ERRO_EMAIL_EXISTE = "Já existe uma conta com este e-mail.";
const ERRO_EMAIL_PENDENTE =
  "Este e-mail já pediu acesso. Libere o pedido no painel.";
// Marca o cadastro feito pelo professor: o gatilho do banco libera o acesso.
// Só a chave de serviço grava app_metadata, então o aluno não forja isso.
const ORIGEM_PROFESSOR = { origem: "professor" };
const ERRO_BANCO = "Não foi possível salvar. Tente de novo.";
// O Auth não tem ban sem prazo; 100 anos fazem esse papel.
const BLOQUEIO_SEM_PRAZO = "876000h";
const ERRO_AUDITORIA =
  "Não foi possível registrar o acesso, então nada foi feito. Tente de novo.";

function atualizarTelas() {
  revalidatePath("/professor/alunos");
  revalidatePath("/professor/alunos/[id]", "page");
}

// Fluxo "Cadastro do aluno": 12 anos ou mais recebe convite por e-mail na hora;
// menor de 12 tem a conta criada sem convite e fica aguardando o aceite do
// responsável. O papel nunca é informado: o gatilho do banco sempre cria aluno.
// A conta é criada antes do convite para levar a marca ORIGEM_PROFESSOR, que
// o convite não aceita. O cadastro passa por cima de uma recusa recente do
// e-mail e de uma conta criada pelo pedido de código e nunca confirmada.
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
    .select("id, liberado_em, pedido_em")
    .eq("email", aluno.email)
    .maybeSingle();
  if (erroBusca) return { erro: ERRO_BANCO, valores };
  if (existente?.liberado_em) return { erro: ERRO_EMAIL_EXISTE, valores };
  if (existente?.pedido_em) return { erro: ERRO_EMAIL_PENDENTE, valores };

  const admin = criarClienteAdmin();
  if (existente) {
    // Alguém digitou o e-mail no login e nunca clicou no link: a conta não
    // tem dados de ninguém e dá lugar ao cadastro do professor.
    const { error } = await admin.auth.admin.deleteUser(existente.id);
    if (error) return { erro: ERRO_BANCO, valores };
  }
  const { error: erroRecusa } = await supabase.rpc(
    "permitir_novo_pedido_por_email",
    { email: aluno.email },
  );
  if (erroRecusa) return { erro: ERRO_BANCO, valores };

  const metadados = {
    nome: aluno.nome,
    data_nascimento: aluno.data_nascimento,
    menor_de_12: aluno.responsavel !== null,
  };

  let alunoId: string;
  let linkAceite: string | undefined;

  if (!aluno.responsavel) {
    const reserva = await reservarEnvioDeConvite(supabase);
    if (!reserva.ok) return { erro: reserva.erro, valores };
    const { data, error } = await admin.auth.admin.createUser({
      email: aluno.email,
      user_metadata: metadados,
      app_metadata: ORIGEM_PROFESSOR,
    });
    if (error || !data.user)
      return {
        erro: error?.code === "email_exists" ? ERRO_EMAIL_EXISTE : ERRO_BANCO,
        valores,
      };
    alunoId = data.user.id;
    const { error: erroConvite } = await admin.auth.admin.inviteUserByEmail(
      aluno.email,
      { data: metadados },
    );
    if (erroConvite) {
      // Sem o convite o aluno não teria como entrar; desfaz o cadastro.
      await admin.auth.admin.deleteUser(alunoId);
      return {
        erro: "Não foi possível enviar o convite. Tente de novo.",
        valores,
      };
    }
  } else {
    // Conta confirmada e sem convite: o acesso só é enviado depois do aceite.
    const { data, error } = await admin.auth.admin.createUser({
      email: aluno.email,
      email_confirm: true,
      user_metadata: metadados,
      app_metadata: ORIGEM_PROFESSOR,
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
    // Sem o registro do acesso, a matrícula não é feita.
    const registrado = await registrarAcesso("matricular", alunoId);
    const { error } = registrado
      ? await supabase
          .from("matriculas")
          .insert(
            aluno.cursos.map((curso_id) => ({ aluno_id: alunoId, curso_id })),
          )
      : { error: true };
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
  if (!(await registrarAcesso("matricular", alunoId)))
    throw new Error(ERRO_AUDITORIA);

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
  if (!(await registrarAcesso("desmatricular", alunoId)))
    throw new Error(ERRO_AUDITORIA);

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
  // Registra antes de apagar: depois não haveria mais a data de nascimento.
  if (!(await registrarAcesso("excluir", alunoId)))
    return { erro: ERRO_AUDITORIA };

  const { error: erroExclusao } =
    await criarClienteAdmin().auth.admin.deleteUser(alunoId);
  if (erroExclusao)
    return { erro: "Não foi possível excluir os dados. Tente de novo." };

  revalidatePath("/professor", "layout");
  redirect("/professor/alunos");
}

// Reenvia o acesso a quem ainda não entrou. Quem tem 12 anos ou mais recebe o
// convite de novo; o menor de 12 já autorizado recebe um código de acesso,
// como no aceite. Conta no mesmo limite por hora dos convites.
// O estado anterior do formulário não é usado, por isso fica fora da assinatura.
export async function reenviarConvite(
  alunoId: string,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const supabase = await criarClienteServidor();
  const { data: aluno, error } = await supabase
    .from("perfis")
    .select(
      "email, nome, data_nascimento, menor_de_12, bloqueado_em, responsaveis (aceito_em)",
    )
    .eq("id", alunoId)
    .eq("papel", "aluno")
    .maybeSingle();
  if (error) return { erro: ERRO_BANCO };
  if (!aluno) return { erro: "Aluno não encontrado." };
  if (aluno.bloqueado_em)
    return { erro: "O acesso deste aluno está bloqueado; desbloqueie antes." };
  const responsavel = aluno.responsaveis as unknown as {
    aceito_em: string | null;
  } | null;
  if (aluno.menor_de_12 && !responsavel?.aceito_em)
    return { erro: "O responsável ainda não autorizou o acesso." };

  const admin = criarClienteAdmin();
  const { data: usuario } = await admin.auth.admin.getUserById(alunoId);
  if (usuario?.user?.last_sign_in_at)
    return { erro: `${aluno.nome} já entrou no site; não é preciso reenviar.` };

  const reserva = await reservarEnvioDeConvite(supabase);
  if (!reserva.ok) return { erro: reserva.erro };

  const { error: erroEnvio } = aluno.menor_de_12
    ? await admin.auth.signInWithOtp({
        email: aluno.email,
        options: { shouldCreateUser: false },
      })
    : await admin.auth.admin.inviteUserByEmail(aluno.email, {
        data: {
          nome: aluno.nome,
          data_nascimento: aluno.data_nascimento,
          menor_de_12: false,
        },
      });
  if (erroEnvio)
    return { erro: "Não foi possível reenviar o convite. Tente de novo." };

  return { sucesso: `Convite reenviado para ${aluno.email}.` };
}

// Bloqueia o acesso do aluno sem apagar nada. O banco corta o acesso na hora
// e registra a ação na auditoria; o ban do Auth recusa novos logins e a
// renovação da sessão. Repetir a ação é seguro.
export async function bloquearAluno(
  alunoId: string,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("definir_bloqueio", {
    aluno: alunoId,
    bloquear: true,
  });
  if (error) return { erro: "Não foi possível bloquear. Tente de novo." };

  const { error: erroAuth } =
    await criarClienteAdmin().auth.admin.updateUserById(alunoId, {
      ban_duration: BLOQUEIO_SEM_PRAZO,
    });
  atualizarTelas();
  if (erroAuth)
    return {
      erro: "O acesso foi cortado, mas não foi possível impedir novos logins. Tente bloquear de novo.",
    };
  return { sucesso: "Acesso bloqueado." };
}

// Desfaz o ban do Auth antes de liberar no banco: se o banco falhar, o aluno
// entra mas continua sem ver nada até a nova tentativa.
export async function desbloquearAluno(
  alunoId: string,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const { error: erroAuth } =
    await criarClienteAdmin().auth.admin.updateUserById(alunoId, {
      ban_duration: "none",
    });
  if (erroAuth) return { erro: "Não foi possível desbloquear. Tente de novo." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("definir_bloqueio", {
    aluno: alunoId,
    bloquear: false,
  });
  if (error) return { erro: "Não foi possível desbloquear. Tente de novo." };

  atualizarTelas();
  return { sucesso: "Acesso desbloqueado." };
}

// Libera um pedido de acesso com a data de nascimento informada. O menor de 12
// ganha o responsável antes da liberação e só acessa depois do aceite (o banco
// confere). O banco grava a liberação e a auditoria juntos. Depois de liberar
// o menor, o professor vai para a ficha, onde está o link de autorização.
export async function liberarPedido(
  alunoId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };
  const valores = valoresDigitados(formData);

  const supabase = await criarClienteServidor();
  const { data: aluno, error } = await supabase
    .from("perfis")
    .select("nome, email")
    .eq("id", alunoId)
    .eq("papel", "aluno")
    .is("liberado_em", null)
    .maybeSingle();
  if (error) return { erro: ERRO_BANCO, valores };
  if (!aluno) return { erro: "Pedido não encontrado ou já resolvido." };

  const resultado = validarLiberacao(formData, hojeNoBrasil(), aluno.email);
  if (!resultado.ok) return { erro: resultado.erro, valores };
  const { data_nascimento, responsavel } = resultado.dados;

  if (responsavel) {
    const { error: erroResponsavel } = await supabase
      .from("responsaveis")
      .upsert(
        { aluno_id: alunoId, nome: responsavel.nome, email: responsavel.email },
        { onConflict: "aluno_id" },
      );
    if (erroResponsavel) return { erro: ERRO_BANCO, valores };
  }

  const { error: erroLiberacao } = await supabase.rpc("liberar_aluno", {
    aluno: alunoId,
    nascimento: data_nascimento,
  });
  if (erroLiberacao) {
    if (responsavel)
      await supabase.from("responsaveis").delete().eq("aluno_id", alunoId);
    return { erro: "Não foi possível liberar. Tente de novo.", valores };
  }

  revalidatePath("/professor", "layout");
  if (responsavel) redirect(`/professor/alunos/${alunoId}`);
  return { sucesso: `${aluno.nome} foi liberado e já pode entrar.` };
}

// Recusa um pedido de acesso: registra na auditoria e apaga a conta. Ficam o
// registro, com o id, e por 7 dias o hash do e-mail com a dica mascarada, que
// impede um novo pedido até o prazo acabar ou o professor permitir.
export async function recusarPedido(
  alunoId: string,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("registrar_recusa", { aluno: alunoId });
  if (error) return { erro: "Não foi possível recusar. Tente de novo." };

  const { error: erroExclusao } =
    await criarClienteAdmin().auth.admin.deleteUser(alunoId);
  if (erroExclusao)
    return {
      erro: "A recusa foi registrada, mas a conta não foi apagada. Tente recusar de novo.",
    };

  revalidatePath("/professor", "layout");
  return { sucesso: "Pedido recusado." };
}

function atualizarAlunos() {
  revalidatePath("/professor/alunos");
}

// Apaga a recusa escolhida em "Recusados recentemente": a pessoa pode pedir
// acesso de novo. O banco registra na auditoria.
export async function permitirNovoPedido(
  alunoId: string,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  if (!ehUuid(alunoId)) return { erro: ERRO_BANCO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("permitir_novo_pedido", {
    aluno: alunoId,
  });
  if (error)
    return {
      erro:
        error.code === "P0002"
          ? "Essa recusa já tinha acabado ou foi apagada."
          : "Não foi possível permitir. Tente de novo.",
    };

  atualizarAlunos();
  return { sucesso: "Pronto: a pessoa já pode pedir acesso de novo." };
}

// O mesmo, pelo e-mail digitado pelo professor. O banco compara o hash.
export async function permitirNovoPedidoPorEmail(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirProfessor();
  const valores = valoresDigitados(formData);
  const email = normalizarEmail(formData.get("email"));
  if (!email) return { erro: "Digite um e-mail válido.", valores };

  const supabase = await criarClienteServidor();
  const { data: havia, error } = await supabase.rpc(
    "permitir_novo_pedido_por_email",
    { email },
  );
  if (error)
    return { erro: "Não foi possível permitir. Tente de novo.", valores };
  if (!havia)
    return {
      erro: "Não há recusa recente para este e-mail. A pessoa já pode pedir acesso.",
      valores,
    };

  atualizarAlunos();
  return { sucesso: `Pronto: ${email} já pode pedir acesso de novo.` };
}
