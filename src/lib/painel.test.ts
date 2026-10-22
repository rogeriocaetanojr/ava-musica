import { describe, expect, it } from "vitest";
import { resumoParaProfessor, ultimaAtividade } from "./painel";

const modulos = [
  {
    id: "m1",
    ordem: 0,
    aulas: [
      {
        id: "a1",
        ordem: 0,
        publicada: true,
        conteudos: [{ id: "p1", tipo: "prova" }],
      },
      {
        id: "a2",
        ordem: 1,
        publicada: true,
        conteudos: [{ id: "v1", tipo: "youtube" }],
      },
      {
        id: "a3",
        ordem: 2,
        publicada: false,
        conteudos: [{ id: "p2", tipo: "prova" }],
      },
    ],
  },
];

describe("resumoParaProfessor", () => {
  it("conta aulas concluídas e provas enviadas só das aulas publicadas", () => {
    const resumo = resumoParaProfessor(modulos, [
      {
        aula_id: "a1",
        conteudo_id: null,
        concluido_em: "2026-10-01T10:00:00Z",
      },
      {
        aula_id: "a1",
        conteudo_id: "p1",
        concluido_em: "2026-10-01T10:05:00Z",
      },
      {
        aula_id: "a3",
        conteudo_id: null,
        concluido_em: "2026-10-02T10:00:00Z",
      },
      {
        aula_id: "a3",
        conteudo_id: "p2",
        concluido_em: "2026-10-02T10:00:00Z",
      },
    ]);
    expect(resumo).toEqual({
      total: 2,
      concluidas: 1,
      percentual: 50,
      provas: 1,
      provasEnviadas: 1,
    });
  });

  it("curso sem progresso fica zerado", () => {
    expect(resumoParaProfessor(modulos, [])).toMatchObject({
      concluidas: 0,
      percentual: 0,
      provasEnviadas: 0,
    });
  });
});

describe("ultimaAtividade", () => {
  it("devolve o registro mais recente", () => {
    expect(
      ultimaAtividade([
        {
          aula_id: "a1",
          conteudo_id: null,
          concluido_em: "2026-10-01T10:00:00Z",
        },
        {
          aula_id: "a2",
          conteudo_id: null,
          concluido_em: "2026-10-03T10:00:00Z",
        },
        {
          aula_id: "a1",
          conteudo_id: "p1",
          concluido_em: "2026-10-02T10:00:00Z",
        },
      ]),
    ).toBe("2026-10-03T10:00:00Z");
  });

  it("é nula sem registros", () => {
    expect(ultimaAtividade([])).toBeNull();
  });
});
