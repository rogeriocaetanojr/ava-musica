import { describe, expect, it } from "vitest";
import { OBRIGATORIAS, problemasDoAmbiente, validarAmbiente } from "./env";

const completo = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  NEXT_PUBLIC_SITE_URL: "https://escola.example",
  SMTP_HOST: "smtp.resend.com",
  SMTP_PORT: "465",
  SMTP_USER: "resend",
  SMTP_PASS: "chave",
  SMTP_REMETENTE: "Escola <avisos@escola.example>",
  EMAIL_PROFESSOR: "professor@escola.example",
};

describe("problemasDoAmbiente", () => {
  it("aceita o ambiente completo", () => {
    expect(problemasDoAmbiente(completo)).toEqual([]);
  });

  it("aceita SMTP sem usuário e senha (Mailpit)", () => {
    expect(
      problemasDoAmbiente({ ...completo, SMTP_USER: "", SMTP_PASS: "" }),
    ).toEqual([]);
  });

  it.each(OBRIGATORIAS.map((r) => r.nome))("diz quando falta %s", (nome) => {
    const problemas = problemasDoAmbiente({ ...completo, [nome]: "" });
    expect(problemas).toHaveLength(1);
    expect(problemas[0]).toMatch(
      new RegExp(`^${nome} não está definida \\((pública|de servidor), para `),
    );
  });

  it("recusa endereço, porta e e-mail inválidos", () => {
    expect(
      problemasDoAmbiente({
        ...completo,
        NEXT_PUBLIC_SITE_URL: "escola.example",
        SMTP_PORT: "porta",
        EMAIL_PROFESSOR: "professor",
      }),
    ).toEqual([
      "NEXT_PUBLIC_SITE_URL está em formato inválido (esperado: url).",
      "SMTP_PORT está em formato inválido (esperado: porta).",
      "EMAIL_PROFESSOR está em formato inválido (esperado: email).",
    ]);
  });

  it("recusa chave de servidor com prefixo NEXT_PUBLIC_", () => {
    expect(
      problemasDoAmbiente({
        ...completo,
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "service",
      }),
    ).toEqual([
      "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY não pode existir: SUPABASE_SERVICE_ROLE_KEY é de servidor e iria para o navegador.",
    ]);
  });

  it("não exige a chave do Turnstile com o captcha desligado", () => {
    expect(problemasDoAmbiente(completo)).toEqual([]);
    expect(
      problemasDoAmbiente({ ...completo, NEXT_PUBLIC_CAPTCHA_LIGADO: "false" }),
    ).toEqual([]);
  });

  it("exige a chave do Turnstile com o captcha ligado", () => {
    const ligado = { ...completo, NEXT_PUBLIC_CAPTCHA_LIGADO: "true" };
    expect(problemasDoAmbiente(ligado)).toEqual([
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY não está definida (pública, com o captcha ligado, para o captcha do login, de Criar conta, de Esqueci minha senha e do convite).",
    ]);
    expect(
      problemasDoAmbiente({
        ...ligado,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      }),
    ).toEqual([]);
  });

  it("avisa quando NEXT_PUBLIC_CAPTCHA_LIGADO tem outro valor", () => {
    expect(
      problemasDoAmbiente({ ...completo, NEXT_PUBLIC_CAPTCHA_LIGADO: "sim" }),
    ).toEqual([
      "NEXT_PUBLIC_CAPTCHA_LIGADO precisa ser true, false ou ficar vazia.",
    ]);
  });

  it("exige SMTP_USER e SMTP_PASS juntos", () => {
    expect(problemasDoAmbiente({ ...completo, SMTP_PASS: "" })).toEqual([
      "SMTP_USER e SMTP_PASS precisam estar as duas definidas ou as duas vazias.",
    ]);
  });
});

describe("validarAmbiente", () => {
  it("para com a lista do que falta", () => {
    expect(() => validarAmbiente({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL não está definida[\s\S]*EMAIL_PROFESSOR não está definida/,
    );
  });
});
