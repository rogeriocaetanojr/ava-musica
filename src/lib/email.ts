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

// Modelo único e enxuto dos e-mails da escola: faixa bordô baixa com o nome
// curto, uma frase, um botão, uma linha pequena opcional e o rodapé com o nome
// completo. Sem título no corpo e sem o link por extenso, que fica só no texto
// puro. Layout em tabela e CSS inline, largura máxima de 480 px, que é o que os
// leitores de e-mail aceitam. A frase já vem escapada. Os modelos do Supabase
// (supabase/templates) repetem este mesmo HTML.
export function montarHtml(conteudo: {
  titulo: string;
  frase: string;
  botao: { texto: string; link: string };
  nota?: string;
}): string {
  const link = escaparHtml(conteudo.botao.link);
  const nota = conteudo.nota
    ? `\n<p style="margin:16px 0 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.textoSecundario};">${conteudo.nota}</p>`
    : "";
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
<tr><td align="center" style="padding:16px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:480px;border-collapse:separate;">
<tr><td style="background-color:${COR.bordo};padding:10px 20px;border-radius:12px 12px 0 0;font-family:${FONTE};font-size:16px;line-height:22px;font-weight:bold;color:${COR.sobreBordo};">${escaparHtml(NOME_CURTO_DO_AVA)}</td></tr>
<tr><td style="background-color:${COR.superficie};padding:24px 20px;border:1px solid ${COR.linha};border-top:0;border-radius:0 0 12px 12px;">
<p style="margin:0 0 20px;font-family:${FONTE};font-size:16px;line-height:24px;color:${COR.texto};">${conteudo.frase}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="background-color:${COR.bordo};border-radius:8px;">
<a href="${link}" style="display:inline-block;padding:12px 24px;font-family:${FONTE};font-size:16px;line-height:20px;font-weight:bold;color:${COR.sobreBordo};text-decoration:none;border-radius:8px;">${escaparHtml(conteudo.botao.texto)}</a>
</td></tr>
</table>${nota}
</td></tr>
<tr><td style="padding:12px 20px;font-family:${FONTE};font-size:11px;line-height:16px;color:${COR.textoSecundario};text-align:center;">${escaparHtml(NOME_DO_AVA)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Aviso ao professor de que alguém pediu acesso e espera liberação. Leva só
// nome e e-mail; o botão abre os pedidos no painel do professor.
export function mensagemDePedidoNovo(
  aluno: { nome: string; email: string },
  linkDosPedidos: string,
): Mensagem {
  return {
    assunto: `Novo pedido de acesso: ${aluno.nome}`,
    texto: [
      `${aluno.nome} (${aluno.email}) pediu acesso à escola.`,
      "",
      `Ver pedido: ${linkDosPedidos}`,
    ].join("\n"),
    html: montarHtml({
      titulo: `Novo pedido de acesso: ${aluno.nome}`,
      frase: `<strong>${escaparHtml(aluno.nome)}</strong> (${escaparHtml(aluno.email)}) pediu acesso à escola.`,
      botao: { texto: "Ver pedido", link: linkDosPedidos },
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
  const validade = `O link vale por ${validadeEmDias} dias e funciona uma vez só.`;
  return {
    assunto: `Seu convite para a ${NOME_CURTO_DO_AVA}`,
    texto: [
      `${primeiro}, o professor criou seu acesso à ${NOME_CURTO_DO_AVA}.`,
      "",
      `Criar minha senha: ${linkDoConvite}`,
      "",
      validade,
    ].join("\n"),
    html: montarHtml({
      titulo: `Seu convite para a ${NOME_CURTO_DO_AVA}`,
      frase: `${escaparHtml(primeiro)}, o professor criou seu acesso à ${escaparHtml(NOME_CURTO_DO_AVA)}.`,
      botao: { texto: "Criar minha senha", link: linkDoConvite },
      nota: validade,
    }),
  };
}
