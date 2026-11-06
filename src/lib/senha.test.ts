import { describe, expect, it } from "vitest";
import { erroDaSenha } from "./senha";

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
