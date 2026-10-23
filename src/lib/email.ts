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
    assunto: `Novo pedido de acesso no ${NOME_DO_AVA}`,
    texto: [
      `${aluno.nome} (${aluno.email}) entrou no ${NOME_DO_AVA} e está aguardando a sua liberação.`,
      "",
      `Para liberar ou recusar, abra o painel: ${linkDoPainel}`,
      "",
      "Se você não conhece essa pessoa, recuse o pedido: a conta é apagada e o e-mail não consegue pedir de novo por 7 dias.",
    ].join("\n"),
  };
}
