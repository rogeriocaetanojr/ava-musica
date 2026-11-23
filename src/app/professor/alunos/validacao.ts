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
  aguardando: "Aguardando aceite",
  convidado: "Convidado",
  ativo: "Ativo",
};

export const CORES_DOS_STATUS: Record<StatusDoAluno, string> = {
  bloqueado: "bg-bloco-perigo text-texto-sobre-bloco-perigo",
  pendente: "bg-amarelo text-texto-sobre-amarelo",
  aguardando: "bg-amarelo text-texto-sobre-amarelo",
  convidado: "border border-linha bg-fundo text-texto-secundario",
  ativo: "bg-bloco-sucesso text-texto-sobre-bloco-sucesso",
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

// Aluno ativo sem abrir nenhuma aula há mais que isto vai para "Precisam de
// atenção" na Turma, com o selo "Parado há X dias".
export const DIAS_SEM_ATIVIDADE = 14;
const DIA_MS = 24 * 60 * 60 * 1000;

export type MotivoDeAtencao =
  | { tipo: "aguardando" | "convidado" | "sem-curso" }
  | { tipo: "parado"; dias: number };

// Ordem de prioridade dos motivos; a seção e a ordenação dos cards usam o
// primeiro.
export const ORDEM_DOS_MOTIVOS: MotivoDeAtencao["tipo"][] = [
  "aguardando",
  "convidado",
  "sem-curso",
  "parado",
];
const MAXIMO_DE_MOTIVOS = 2;

// Motivos para o aluno aparecer em "Precisam de atenção", na ordem de
// prioridade (aguardando aceite, convidado, sem curso, parado) e no máximo
// dois, por exemplo Convidado + Sem curso. Parado: a última aula concluída
// passou do limite ou, sem nenhuma, a matrícula mais antiga passou dele.
// Bloqueado não entra. Vazio quando não precisa de atenção.
export function motivosDeAtencao(
  aluno: {
    status: StatusDoAluno;
    // Datas de matrícula (criado_em de cada matrícula).
    matriculas: string[];
    // Última aula concluída, em qualquer curso.
    ultimaAtividade: string | null;
  },
  agora: number = Date.now(),
): MotivoDeAtencao[] {
  if (aluno.status === "bloqueado" || aluno.status === "pendente") return [];
  const motivos: MotivoDeAtencao[] = [];
  if (aluno.status === "aguardando") motivos.push({ tipo: "aguardando" });
  if (aluno.status === "convidado") motivos.push({ tipo: "convidado" });
  if (aluno.matriculas.length === 0) motivos.push({ tipo: "sem-curso" });
  else {
    const desde =
      aluno.ultimaAtividade ??
      aluno.matriculas.reduce((a, b) =>
        Date.parse(a) < Date.parse(b) ? a : b,
      );
    const dias = Math.floor((agora - Date.parse(desde)) / DIA_MS);
    if (dias > DIAS_SEM_ATIVIDADE) motivos.push({ tipo: "parado", dias });
  }
  return motivos.slice(0, MAXIMO_DE_MOTIVOS);
}

// Selo do card conforme o motivo: uma cor por motivo (fundo suave e texto
// forte, AA nos dois temas) e um ícone antes do texto, para não depender só
// da cor. Os traços são caminhos SVG de 24×24.
const SELOS_DOS_MOTIVOS: Record<
  MotivoDeAtencao["tipo"],
  { classe: string; icone: string }
> = {
  // Ampulheta.
  aguardando: {
    classe: "bg-selo-amarelo text-sobre-selo-amarelo",
    icone: "M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9",
  },
  // Envelope.
  convidado: {
    classe: "bg-selo-azul text-sobre-selo-azul",
    icone: "M3 6h18v12H3zM3 7l9 6 9-6",
  },
  // Livro.
  "sem-curso": {
    classe: "bg-selo-laranja text-sobre-selo-laranja",
    icone: "M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5",
  },
  // Pausa.
  parado: {
    classe: "bg-selo-vermelho text-sobre-selo-vermelho",
    icone: "M9 6v12M15 6v12",
  },
};

export function seloDoMotivo(motivo: MotivoDeAtencao): {
  texto: string;
  classe: string;
  icone: string;
} {
  const texto =
    motivo.tipo === "sem-curso"
      ? "Sem curso"
      : motivo.tipo === "parado"
        ? `Parado há ${motivo.dias} dias`
        : NOMES_DOS_STATUS[motivo.tipo];
  return { texto, ...SELOS_DOS_MOTIVOS[motivo.tipo] };
}
