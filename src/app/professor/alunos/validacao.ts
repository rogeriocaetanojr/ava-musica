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

  const responsavel = validarResponsavel(valores, idade, valores.email);
  if (typeof responsavel === "string") return falha(responsavel);

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

// Responsável do menor de 12: devolve os dados, null para quem tem 12 anos ou
// mais, ou a mensagem de erro.
function validarResponsavel(
  valores: { responsavel_nome: string; responsavel_email: string },
  idade: number,
  emailDoAluno: string,
): DadosAluno["responsavel"] | string {
  if (idade >= IDADE_MINIMA_SEM_ACEITE) return null;
  if (!valores.responsavel_nome)
    return "Alunos com menos de 12 anos precisam do nome do responsável.";
  if (valores.responsavel_nome.length > 120)
    return "O nome do responsável pode ter no máximo 120 caracteres.";
  if (
    !EMAIL.test(valores.responsavel_email) ||
    valores.responsavel_email.length > 254
  )
    return "Informe um e-mail válido para o responsável.";
  if (valores.responsavel_email === emailDoAluno)
    return "O e-mail do responsável precisa ser diferente do e-mail do aluno.";
  return { nome: valores.responsavel_nome, email: valores.responsavel_email };
}

export type DadosLiberacao = Pick<
  DadosAluno,
  "data_nascimento" | "idade" | "responsavel"
>;

// Liberação de um pedido de acesso: o professor informa a data de nascimento,
// que o pedido não traz, e o responsável se o aluno tiver menos de 12 anos.
export function validarLiberacao(
  formData: FormData,
  hoje: string,
  emailDoAluno: string,
): Resultado<DadosLiberacao> {
  const valores = {
    data_nascimento: texto(formData, "data_nascimento"),
    responsavel_nome: texto(formData, "responsavel_nome"),
    responsavel_email: texto(formData, "responsavel_email").toLowerCase(),
  };
  const falha = (erro: string) => ({ ok: false as const, erro, valores });

  if (!ehDataValida(valores.data_nascimento))
    return falha("Informe a data de nascimento.");
  if (valores.data_nascimento > hoje)
    return falha("A data de nascimento não pode estar no futuro.");
  const idade = calcularIdade(valores.data_nascimento, hoje);
  if (idade > 120) return falha("Confira o ano de nascimento.");

  const responsavel = validarResponsavel(
    valores,
    idade,
    emailDoAluno.toLowerCase(),
  );
  if (typeof responsavel === "string") return falha(responsavel);

  return {
    ok: true,
    dados: { data_nascimento: valores.data_nascimento, idade, responsavel },
  };
}

export type StatusDoAluno =
  "bloqueado" | "pendente" | "aguardando" | "convidado" | "ativo";

export const NOMES_DOS_STATUS: Record<StatusDoAluno, string> = {
  bloqueado: "Bloqueado",
  pendente: "Pendente",
  aguardando: "Aguardando responsável",
  convidado: "Convidado",
  ativo: "Ativo",
};

export const CORES_DOS_STATUS: Record<StatusDoAluno, string> = {
  bloqueado: "bg-vinho text-superficie",
  pendente: "bg-amarelo text-texto-sobre-amarelo",
  aguardando: "bg-amarelo-claro text-texto-sobre-amarelo",
  convidado: "border border-linha bg-fundo text-texto",
  ativo: "bg-linha text-bordo",
};

// Bloqueado: o professor pausou o acesso (vale acima dos outros).
// Pendente: pediu acesso pelo login (Google ou e-mail) e espera o professor liberar ou recusar.
// Aguardando: menor de 12 sem aceite. Convidado: ainda não entrou nenhuma vez.
// Ativo: já entrou.
export function statusDoAluno(aluno: {
  bloqueado?: boolean;
  pendente?: boolean;
  menor_de_12: boolean;
  aceito: boolean;
  ultimo_acesso: string | null | undefined;
}): StatusDoAluno {
  if (aluno.bloqueado) return "bloqueado";
  if (aluno.pendente) return "pendente";
  if (aluno.menor_de_12 && !aluno.aceito) return "aguardando";
  return aluno.ultimo_acesso ? "ativo" : "convidado";
}

// A exclusão só vale com o nome do aluno digitado igual, sem contar espaços
// nas pontas nem maiúsculas.
export function confirmaExclusao(digitado: unknown, nome: string): boolean {
  return (
    typeof digitado === "string" &&
    digitado.trim().toLocaleLowerCase("pt-BR") ===
      nome.trim().toLocaleLowerCase("pt-BR")
  );
}

// E-mail do formulário "Permitir novo pedido": minúsculas e sem espaços nas
// pontas, como o banco normaliza antes do hash. Devolve null se for inválido.
export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const email = valor.trim().toLowerCase();
  return EMAIL.test(email) && email.length <= 254 ? email : null;
}
