import { describe, expect, it } from "vitest";
import { iniciais, primeiroNome } from "./nomes";

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
