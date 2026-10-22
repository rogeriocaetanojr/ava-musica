import {
  ehDataValida,
  calcularIdade,
  IDADE_MINIMA_SEM_ACEITE,
} from "@/lib/idade";
import { ehUuid } from "../cursos/validacao";

export type DadosAluno = {
  nome: string;
  email: string;
  data_nascimento: string;
  idade: number;
  cursos: string[];
  // Preenchido só para menores de 12.
  responsavel: { nome: string; email: string } | null;
};

type Resultado<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; valores: Record<string, string> };

// Validação simples de formato; quem confirma o e-mail é o convite.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// A idade é calculada aqui, no servidor, a partir de "hoje" informado por quem
// chama; o formulário só sugere na tela se os campos do responsável aparecem.
export function validarAluno(
  formData: FormData,
  hoje: string,
): Resultado<DadosAluno> {
  const valores = {
    nome: texto(formData, "nome"),
    email: texto(formData, "email").toLowerCase(),
    data_nascimento: texto(formData, "data_nascimento"),
    responsavel_nome: texto(formData, "responsavel_nome"),
    responsavel_email: texto(formData, "responsavel_email").toLowerCase(),
  };
  const falha = (erro: string) => ({ ok: false as const, erro, valores });

  if (!valores.nome) return falha("Informe o nome do aluno.");
  if (valores.nome.length > 120)
    return falha("O nome pode ter no máximo 120 caracteres.");
  if (!EMAIL.test(valores.email) || valores.email.length > 254)
    return falha("Informe um e-mail válido para o aluno.");
  if (!ehDataValida(valores.data_nascimento))
    return falha("Informe a data de nascimento.");
  if (valores.data_nascimento > hoje)
    return falha("A data de nascimento não pode estar no futuro.");

  const idade = calcularIdade(valores.data_nascimento, hoje);
  if (idade > 120) return falha("Confira o ano de nascimento.");

  const cursos = formData.getAll("cursos");
  if (!cursos.every(ehUuid)) return falha("Escolha cursos da lista.");

  let responsavel: DadosAluno["responsavel"] = null;
  if (idade < IDADE_MINIMA_SEM_ACEITE) {
    if (!valores.responsavel_nome)
      return falha(
        "Alunos com menos de 12 anos precisam do nome do responsável.",
      );
    if (valores.responsavel_nome.length > 120)
      return falha("O nome do responsável pode ter no máximo 120 caracteres.");
    if (
      !EMAIL.test(valores.responsavel_email) ||
      valores.responsavel_email.length > 254
    )
      return falha("Informe um e-mail válido para o responsável.");
    if (valores.responsavel_email === valores.email)
      return falha(
        "O e-mail do responsável precisa ser diferente do e-mail do aluno.",
      );
    responsavel = {
      nome: valores.responsavel_nome,
      email: valores.responsavel_email,
    };
  }

  return {
    ok: true,
    dados: {
      nome: valores.nome,
      email: valores.email,
      data_nascimento: valores.data_nascimento,
      idade,
      cursos: [...new Set(cursos as string[])],
      responsavel,
    },
  };
}

export type StatusDoAluno = "aguardando" | "convidado" | "ativo";

export const NOMES_DOS_STATUS: Record<StatusDoAluno, string> = {
  aguardando: "Aguardando responsável",
  convidado: "Convidado",
  ativo: "Ativo",
};

export const CORES_DOS_STATUS: Record<StatusDoAluno, string> = {
  aguardando: "bg-yellow-100 text-yellow-800",
  convidado: "bg-blue-100 text-blue-800",
  ativo: "bg-green-100 text-green-800",
};

// Aguardando: menor de 12 sem aceite. Convidado: ainda não entrou nenhuma vez.
// Ativo: já entrou.
export function statusDoAluno(aluno: {
  menor_de_12: boolean;
  aceito: boolean;
  ultimo_acesso: string | null | undefined;
}): StatusDoAluno {
  if (aluno.menor_de_12 && !aluno.aceito) return "aguardando";
  return aluno.ultimo_acesso ? "ativo" : "convidado";
}
