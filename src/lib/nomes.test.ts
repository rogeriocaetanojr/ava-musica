import { describe, expect, it } from "vitest";
import {
  iniciais,
  nomeParaExibir,
  primeiroNome,
  SEM_NOME,
  validarNome,
} from "./nomes";

describe("iniciais", () => {
  it("usa o primeiro e o último nome", () => {
    expect(iniciais("ana maria souza")).toBe("AS");
  });

  it("aceita nome único e espaços sobrando", () => {
    expect(iniciais("  Ícaro ")).toBe("Í");
  });

  it("mostra interrogação sem nome", () => {
    expect(iniciais("")).toBe("?");
  });
});

describe("primeiroNome", () => {
  it("fica só com o primeiro nome", () => {
    expect(primeiroNome("  Rogério Caetano Junior")).toBe("Rogério");
  });

  it("devolve vazio sem nome", () => {
    expect(primeiroNome("")).toBe("");
  });
});

describe("nomeParaExibir", () => {
  it("mostra o nome quando existe", () => {
    expect(nomeParaExibir("Ana Souza")).toBe("Ana Souza");
  });

  it("mostra o aviso, nunca o e-mail, quando falta o nome", () => {
    expect(nomeParaExibir(null)).toBe(SEM_NOME);
    expect(nomeParaExibir("  ")).toBe(SEM_NOME);
  });
});

describe("validarNome", () => {
  it("tira os espaços sobrando", () => {
    expect(validarNome("  Ana   Maria  Souza ")).toEqual({
      ok: true,
      nome: "Ana Maria Souza",
    });
  });

  it("recusa nome em branco ou ausente", () => {
    expect(validarNome("   ")).toEqual({
      ok: false,
      erro: "Informe o nome completo.",
    });
    expect(validarNome(null)).toMatchObject({ ok: false });
  });

  it("recusa nome com mais de 120 caracteres", () => {
    expect(validarNome("a".repeat(121))).toMatchObject({ ok: false });
    expect(validarNome("a".repeat(120))).toMatchObject({ ok: true });
  });

  it("recusa o e-mail no lugar do nome", () => {
    expect(validarNome("ana@teste.local")).toEqual({
      ok: false,
      erro: "Digite o seu nome, não o e-mail.",
    });
  });
});
