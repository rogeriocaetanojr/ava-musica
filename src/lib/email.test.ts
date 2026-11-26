import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  configuracaoSmtp,
  mensagemDeConvite,
  mensagemDePedidoNovo,
} from "./email";

const resend = {
  SMTP_HOST: "smtp.resend.com",
  SMTP_PORT: "465",
  SMTP_USER: "resend",
  SMTP_PASS: "re_chave",
  SMTP_REMETENTE: "AVA <avisos@exemplo.com>",
  EMAIL_PROFESSOR: "professor@exemplo.com",
};

describe("configuracaoSmtp", () => {
  it("monta o Resend com TLS na porta 465", () => {
    expect(configuracaoSmtp(resend)).toEqual({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: "re_chave" },
      remetente: "AVA <avisos@exemplo.com>",
      professor: "professor@exemplo.com",
    });
  });

  it("aceita o Mailpit local sem usuário nem senha", () => {
    const config = configuracaoSmtp({
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "54325",
      SMTP_REMETENTE: "ava@teste.local",
      EMAIL_PROFESSOR: "professor@teste.local",
    });
    expect(config).toMatchObject({ port: 54325, secure: false });
    expect(config?.auth).toBeUndefined();
  });

  it("devolve null se faltar host, porta, remetente ou professor", () => {
    expect(configuracaoSmtp({})).toBeNull();
    expect(configuracaoSmtp({ ...resend, SMTP_PORT: "abc" })).toBeNull();
    expect(configuracaoSmtp({ ...resend, SMTP_REMETENTE: "" })).toBeNull();
    expect(configuracaoSmtp({ ...resend, EMAIL_PROFESSOR: undefined })).toBe(
      null,
    );
  });
});

describe("mensagemDePedidoNovo", () => {
  const link = "https://ava.exemplo.com/professor/alunos?pedidos=abrir";
  const pedido = () =>
    mensagemDePedidoNovo({ nome: "Ana Souza", email: "ana@exemplo.com" }, link);

  it("põe o nome no assunto e a frase com nome e e-mail", () => {
    const { assunto, texto, html } = pedido();
    expect(assunto).toBe("Novo pedido de acesso: Ana Souza");
    expect(texto).toContain(
      "Ana Souza (ana@exemplo.com) pediu acesso à escola.",
    );
    expect(html).toContain("pediu acesso à escola.");
  });

  it("leva o botão Ver pedido aos pedidos do painel", () => {
    const { html } = pedido();
    expect(html).toContain("Ver pedido</a>");
    expect(html).toContain(`href="${link}"`);
  });

  it("deixa o link por extenso só no texto puro", () => {
    const { texto, html } = pedido();
    expect(texto).toContain(link);
    expect(html.split(link)).toHaveLength(2);
    expect(html).not.toContain("Se o botão não abrir");
  });

  it("tira o título repetido, a frase de liberar e o aviso dos 7 dias", () => {
    const { texto, html } = pedido();
    for (const parte of [texto, html]) {
      expect(parte).not.toContain("Para liberar ou recusar");
      expect(parte).not.toContain("7 dias");
    }
    expect(html).not.toContain("<h1");
  });

  it("usa faixa mais baixa com Escola John Meyer e rodapé pequeno", () => {
    const { html } = pedido();
    expect(html).toContain("padding:10px 20px");
    expect(html).toContain("Escola John Meyer</td>");
    expect(html).toMatch(/font-size:11px[^>]*>Escola de Música John Meyer</);
    expect(html).toContain("max-width:480px");
  });
});

describe("mensagemDeConvite", () => {
  const link = "https://ava.exemplo.com/convite/abc";
  const convite = () => mensagemDeConvite({ nome: "Ana Souza" }, link, 7);

  it("traz o primeiro nome, o link e a validade, sem o sobrenome", () => {
    const { assunto, texto, html } = convite();
    expect(assunto).toBe("Seu convite para a Escola John Meyer");
    expect(texto).toContain("Ana, o professor criou seu acesso");
    expect(texto).not.toContain("Souza");
    expect(html).not.toContain("Souza");
    expect(texto).toContain(link);
    expect(texto).toContain("7 dias");
  });

  it("segue o layout enxuto: uma frase, o botão e a validade em letra pequena", () => {
    const { html } = convite();
    expect(html).toContain(`href="${link}"`);
    expect(html).toContain("Criar minha senha</a>");
    expect(html.split(link)).toHaveLength(2);
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("Se o botão não abrir");
    expect(html).toMatch(/font-size:13px[^>]*>O link vale por 7 dias/);
  });
});

// Paleta dos e-mails do app e dos modelos do Supabase.
const CORES = [
  "#f4f4f5",
  "#ffffff",
  "#e4e4e7",
  "#18181b",
  "#71717a",
  "#6e1a2d",
];
const CORES_ANTIGAS = ["#fbf5ea", "#fffdf8", "#ebddc8", "#2e1a1c", "#6e5558"];

describe("html dos e-mails", () => {
  it("usa a paleta neutra com a faixa e o botão no vinho", () => {
    const { html } = mensagemDePedidoNovo(
      { nome: "Ana Souza", email: "ana@exemplo.com" },
      "https://ava.exemplo.com/professor/alunos?pedidos=abrir",
    );
    for (const cor of CORES) expect(html).toContain(cor);
    for (const cor of CORES_ANTIGAS) expect(html).not.toContain(cor);
    expect(html).toContain("background-color:#6e1a2d;padding:10px 20px");
    expect(html).toMatch(/background-color:#6e1a2d;[^"]*color:#ffffff/);
  });

  it("escapa < e & no nome e no e-mail do aluno", () => {
    const { html } = mensagemDePedidoNovo(
      { nome: "Ana <b>& Cia", email: "a&b@<x>.com" },
      "https://ava.exemplo.com/professor",
    );
    expect(html).toContain("Ana &lt;b&gt;&amp; Cia");
    expect(html).toContain("a&amp;b@&lt;x&gt;.com");
    expect(html).not.toContain("<b>&");
    expect(html).not.toContain("<x>");
  });

  it("escapa o primeiro nome no convite", () => {
    const { html } = mensagemDeConvite(
      { nome: "<Ana>& Souza" },
      "https://ava.exemplo.com/convite/abc",
      7,
    );
    expect(html).toContain("&lt;Ana&gt;&amp;");
    expect(html).not.toContain("<Ana>");
  });
});

// Os modelos do Supabase repetem o layout do app e precisam manter o link.
describe("modelos do Supabase", () => {
  const ler = (nome: string) =>
    readFileSync(join(process.cwd(), "supabase", "templates", nome), "utf8");

  it.each([
    [
      "confirmacao.html",
      "{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email",
      "Confirmar e-mail",
    ],
    [
      "nova-senha.html",
      "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery",
      "Criar nova senha",
    ],
  ])("%s mantém o link e segue o layout enxuto", (nome, link, botao) => {
    const html = ler(nome);
    expect(html.split(`href="${link}"`)).toHaveLength(2);
    expect(html).toContain(botao);
    expect(html).toContain("max-width: 480px");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("Se o botão não abrir");
    expect(html).toContain("Escola de Música John Meyer");
    for (const cor of CORES) expect(html).toContain(cor);
    for (const cor of CORES_ANTIGAS) expect(html).not.toContain(cor);
  });
});
