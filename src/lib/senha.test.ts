import { describe, expect, it } from "vitest";
import { erroDaNovaSenha, erroDaSenha } from "./senha";

describe("erroDaNovaSenha", () => {
  it("aceita a mesma senha válida nos dois campos", () => {
    expect(
      erroDaNovaSenha({ senha: "violao12", confirmacao: "violao12" }),
    ).toBeNull();
  });

  it("recusa confirmação diferente, inclusive só na caixa ou num espaço", () => {
    for (const confirmacao of ["violao13", "Violao12", "violao12 ", ""])
      expect(erroDaNovaSenha({ senha: "violao12", confirmacao })).toContain(
        "não são iguais",
      );
  });

  it("confere as regras da senha antes da confirmação", () => {
    expect(
      erroDaNovaSenha({ senha: "1234567", confirmacao: "1234567" }),
    ).toContain("pelo menos 8");
    expect(
      erroDaNovaSenha({ senha: "a".repeat(73), confirmacao: "a".repeat(73) }),
    ).toContain("longa demais");
    expect(
      erroDaNovaSenha({ senha: "        ", confirmacao: "        " }),
    ).toContain("espaços");
  });

  it("recusa campos que não são texto", () => {
    expect(
      erroDaNovaSenha({ senha: undefined, confirmacao: undefined }),
    ).toContain("pelo menos 8");
    expect(erroDaNovaSenha({ senha: "violao12", confirmacao: null })).toContain(
      "não são iguais",
    );
  });
});

describe("erroDaSenha", () => {
  it("aceita 8 caracteres ou mais", () => {
    expect(erroDaSenha("violao12")).toBeNull();
    expect(erroDaSenha("a".repeat(72))).toBeNull();
  });

  it.each(["", "1234567", undefined, null, 12345678])("recusa %s", (senha) => {
    expect(erroDaSenha(senha)).toContain("pelo menos 8");
  });

  it("recusa mais de 72 bytes, contando acentos", () => {
    expect(erroDaSenha("a".repeat(73))).toContain("longa demais");
    expect(erroDaSenha("é".repeat(37))).toContain("longa demais");
  });

  it("recusa senha só de espaços", () => {
    expect(erroDaSenha("        ")).toContain("espaços");
  });
});
