import { describe, expect, it } from "vitest";
import { LIMITE_SEM_USO_MS, semValidade, sessaoExpirou } from "./sessao";

describe("semValidade", () => {
  it("tira a validade dos cookies gravados", () => {
    expect(
      semValidade({
        path: "/",
        maxAge: 400 * 24 * 60 * 60,
        expires: new Date(),
      }),
    ).toEqual({ path: "/" });
  });

  it("mantém a remoção do cookie", () => {
    expect(semValidade({ path: "/", maxAge: 0 })).toEqual({
      path: "/",
      maxAge: 0,
    });
  });
});

describe("sessaoExpirou", () => {
  const agora = 1_800_000_000_000;

  it("não expira a sessão que acabou de começar", () => {
    expect(sessaoExpirou(undefined, agora)).toBe(false);
  });

  it("aceita até 2 horas sem uso", () => {
    expect(sessaoExpirou(String(agora - LIMITE_SEM_USO_MS), agora)).toBe(false);
    expect(sessaoExpirou(String(agora - 60_000), agora)).toBe(false);
  });

  it("expira depois de 2 horas sem uso", () => {
    expect(sessaoExpirou(String(agora - LIMITE_SEM_USO_MS - 1), agora)).toBe(
      true,
    );
  });

  it("trata valor inválido como vencido", () => {
    expect(sessaoExpirou("abc", agora)).toBe(true);
  });
});
