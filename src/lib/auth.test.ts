import { describe, expect, it } from "vitest";
import { destinoDaSessao, destinoDoPapel, TELA_DO_NOME } from "./auth";

describe("destinoDoPapel", () => {
  it("leva o professor ao painel", () => {
    expect(destinoDoPapel("professor")).toBe("/professor");
  });

  it("leva o aluno aos cursos", () => {
    expect(destinoDoPapel("aluno")).toBe("/cursos");
  });
});

describe("destinoDaSessao", () => {
  it("leva quem não tem nome à tela do nome, antes de qualquer outra", () => {
    expect(destinoDaSessao({ nome: null, papel: "aluno" })).toBe(TELA_DO_NOME);
    expect(destinoDaSessao({ nome: null, papel: "professor" })).toBe(
      TELA_DO_NOME,
    );
  });

  it("leva quem tem nome à área do seu papel", () => {
    expect(destinoDaSessao({ nome: "Ana", papel: "aluno" })).toBe("/cursos");
    expect(destinoDaSessao({ nome: "Prof", papel: "professor" })).toBe(
      "/professor",
    );
  });
});
