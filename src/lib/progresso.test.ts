import { describe, expect, it } from "vitest";
import {
  aulasEmOrdem,
  percentualDeProgresso,
  proximaAula,
  resumoDoCurso,
} from "./progresso";

const modulos = [
  {
    id: "m2",
    ordem: 1,
    aulas: [
      { id: "c", ordem: 0, publicada: true },
      { id: "rascunho", ordem: 1, publicada: false },
    ],
  },
  {
    id: "m1",
    ordem: 0,
    aulas: [
      { id: "b", ordem: 1, publicada: true },
      { id: "a", ordem: 0, publicada: true },
    ],
  },
];

describe("percentualDeProgresso", () => {
  it("é zero num curso sem aulas", () => {
    expect(percentualDeProgresso(0, 0)).toBe(0);
  });

  it("é zero sem aulas concluídas", () => {
    expect(percentualDeProgresso(0, 5)).toBe(0);
  });

  it("calcula a fração arredondando para baixo", () => {
    expect(percentualDeProgresso(1, 3)).toBe(33);
    expect(percentualDeProgresso(2, 3)).toBe(66);
  });

  it("só chega a 100 com todas as aulas concluídas", () => {
    expect(percentualDeProgresso(199, 200)).toBe(99);
    expect(percentualDeProgresso(3, 3)).toBe(100);
  });

  it("nunca passa de 100", () => {
    expect(percentualDeProgresso(4, 3)).toBe(100);
  });
});

describe("aulasEmOrdem", () => {
  it("segue a ordem dos módulos e das aulas e ignora rascunhos", () => {
    expect(aulasEmOrdem(modulos).map((aula) => aula.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("proximaAula", () => {
  const aulas = aulasEmOrdem(modulos);

  it("é a primeira aula quando nada foi concluído", () => {
    expect(proximaAula(aulas, new Set())?.id).toBe("a");
  });

  it("pula as aulas concluídas, mesmo fora de ordem", () => {
    expect(proximaAula(aulas, new Set(["a", "c"]))?.id).toBe("b");
  });

  it("é nula quando tudo foi concluído", () => {
    expect(proximaAula(aulas, new Set(["a", "b", "c"]))).toBeNull();
  });
});

describe("resumoDoCurso", () => {
  it("conta só aulas publicadas", () => {
    expect(resumoDoCurso(modulos, new Set(["a", "rascunho"]))).toMatchObject({
      total: 3,
      concluidas: 1,
      percentual: 33,
    });
  });
});
