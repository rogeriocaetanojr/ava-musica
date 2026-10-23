import { describe, expect, it } from "vitest";
import { configuracaoSmtp, mensagemDePedidoNovo } from "./email";

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
  it("traz nome, e-mail e o link do painel", () => {
    const { assunto, texto } = mensagemDePedidoNovo(
      { nome: "Ana Souza", email: "ana@exemplo.com" },
      "https://ava.exemplo.com/professor",
    );
    expect(assunto).toContain("Novo pedido de acesso");
    expect(texto).toContain("Ana Souza (ana@exemplo.com)");
    expect(texto).toContain("https://ava.exemplo.com/professor");
  });
});
