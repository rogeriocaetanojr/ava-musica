import { NOME_DO_AVA } from "@/lib/site";

export type Mensagem = {
  assunto: string;
  texto: string;
};

export type ConfiguracaoSmtp = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  remetente: string;
  professor: string;
};

// Lê o SMTP das variáveis de ambiente (Resend na nuvem, Mailpit no computador).
// Devolve null se faltar algo: o aviso não sai, mas o pedido aparece no painel.
export function configuracaoSmtp(
  env: Record<string, string | undefined> = process.env,
): ConfiguracaoSmtp | null {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT);
  const remetente = env.SMTP_REMETENTE;
  const professor = env.EMAIL_PROFESSOR;
  if (!host || !Number.isInteger(port) || port <= 0 || !remetente || !professor)
    return null;
  return {
    host,
    port,
    // 465 usa TLS desde o início; as outras portas sobem para TLS se o servidor oferecer.
    secure: port === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    remetente,
    professor,
  };
}

// Aviso ao professor de que alguém pediu acesso (pelo Google ou pelo e-mail)
// e espera liberação. Leva só nome e e-mail.
export function mensagemDePedidoNovo(
  aluno: { nome: string; email: string },
  linkDoPainel: string,
): Mensagem {
  return {
    assunto: `Novo pedido de acesso na ${NOME_DO_AVA}`,
    texto: [
      `${aluno.nome} (${aluno.email}) entrou na ${NOME_DO_AVA} e está aguardando a sua liberação.`,
      "",
      `Para liberar ou recusar, abra o painel: ${linkDoPainel}`,
      "",
      "Se você não conhece essa pessoa, recuse o pedido: a conta é apagada e o e-mail não consegue pedir de novo por 7 dias.",
    ].join("\n"),
  };
}

// Convite ao aluno cadastrado pelo professor: o link abre a tela em que ele
// define a senha. Leva só o primeiro nome e o link.
export function mensagemDeConvite(
  aluno: { nome: string },
  linkDoConvite: string,
  validadeEmDias: number,
): Mensagem {
  const primeiro = aluno.nome.trim().split(/\s+/)[0] ?? "";
  return {
    assunto: `Seu convite para a ${NOME_DO_AVA}`,
    texto: [
      `Olá, ${primeiro}!`,
      "",
      `O professor criou o seu acesso na ${NOME_DO_AVA}. Para entrar pela primeira vez, abra o link abaixo e escolha a sua senha:`,
      "",
      linkDoConvite,
      "",
      `O link vale por ${validadeEmDias} dias e funciona uma vez só. Depois, entre com o seu e-mail e a senha que você escolheu.`,
      "",
      "Se você não esperava este convite, ignore este e-mail.",
    ].join("\n"),
  };
}
