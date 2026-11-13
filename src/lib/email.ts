import { NOME_CURTO_DO_AVA, NOME_DO_AVA } from "@/lib/site";

export type Mensagem = {
  assunto: string;
  texto: string;
  html: string;
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

// Cores do tema (globals.css). E-mail não lê variáveis CSS, então vão por extenso.
const COR = {
  fundo: "#fbf5ea",
  superficie: "#fffdf8",
  linha: "#ebddc8",
  texto: "#2e1a1c",
  textoSecundario: "#6e5558",
  bordo: "#6e1a2d",
  sobreBordo: "#fffdf8",
};
const FONTE = "Arial, Helvetica, sans-serif";

export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Modelo único dos e-mails da escola: cabeçalho bordô com o nome, corpo creme,
// botão bordô e o link por extenso. Layout em tabela e CSS inline, que é o que
// os leitores de e-mail aceitam. Os parágrafos já vêm escapados.
export function montarHtml(conteudo: {
  titulo: string;
  paragrafos: string[];
  botao: { texto: string; link: string };
  depoisDoBotao?: string[];
}): string {
  const p = (html: string) =>
    `<p style="margin:0 0 16px;font-family:${FONTE};font-size:16px;line-height:24px;color:${COR.texto};">${html}</p>`;
  const link = escaparHtml(conteudo.botao.link);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escaparHtml(conteudo.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COR.fundo};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COR.fundo};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:separate;">
<tr><td style="background-color:${COR.bordo};padding:20px 24px;border-radius:12px 12px 0 0;font-family:${FONTE};font-size:22px;line-height:28px;font-weight:bold;color:${COR.sobreBordo};">${escaparHtml(NOME_CURTO_DO_AVA)}</td></tr>
<tr><td style="background-color:${COR.superficie};padding:28px 24px;border:1px solid ${COR.linha};border-top:0;border-radius:0 0 12px 12px;">
<h1 style="margin:0 0 16px;font-family:${FONTE};font-size:22px;line-height:28px;color:${COR.texto};">${escaparHtml(conteudo.titulo)}</h1>
${conteudo.paragrafos.map(p).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
<tr><td style="background-color:${COR.bordo};border-radius:8px;">
<a href="${link}" style="display:inline-block;padding:14px 28px;font-family:${FONTE};font-size:16px;line-height:20px;font-weight:bold;color:${COR.sobreBordo};text-decoration:none;border-radius:8px;">${escaparHtml(conteudo.botao.texto)}</a>
</td></tr>
</table>
${(conteudo.depoisDoBotao ?? []).map(p).join("\n")}
<p style="margin:16px 0 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.textoSecundario};">Se o botão não abrir, copie este endereço no navegador:<br><a href="${link}" style="color:${COR.bordo};word-break:break-all;">${link}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.textoSecundario};text-align:center;">${escaparHtml(NOME_DO_AVA)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
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
    html: montarHtml({
      titulo: "Novo pedido de acesso",
      paragrafos: [
        `<strong>${escaparHtml(aluno.nome)}</strong> (${escaparHtml(aluno.email)}) entrou na ${escaparHtml(NOME_DO_AVA)} e está aguardando a sua liberação.`,
        "Para liberar ou recusar, abra o painel:",
      ],
      botao: { texto: "Abrir o painel", link: linkDoPainel },
      depoisDoBotao: [
        "Se você não conhece essa pessoa, recuse o pedido: a conta é apagada e o e-mail não consegue pedir de novo por 7 dias.",
      ],
    }),
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
    html: montarHtml({
      titulo: `Olá, ${primeiro}!`,
      paragrafos: [
        `O professor criou o seu acesso na ${escaparHtml(NOME_DO_AVA)}. Para entrar pela primeira vez, abra o link abaixo e escolha a sua senha:`,
      ],
      botao: { texto: "Criar minha senha", link: linkDoConvite },
      depoisDoBotao: [
        `O link vale por ${validadeEmDias} dias e funciona uma vez só. Depois, entre com o seu e-mail e a senha que você escolheu.`,
        "Se você não esperava este convite, ignore este e-mail.",
      ],
    }),
  };
}
