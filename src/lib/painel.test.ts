import { describe, expect, it } from "vitest";
import {
  aulasConcluidasNaSemana,
  resumoParaProfessor,
  situacaoDoAluno,
  ultimaAtividade,
} from "./painel";

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
  it("usa os totais das aulas publicadas e as contagens do banco", () => {
    const resumo = resumoParaProfessor(modulos, {
      aulas_concluidas: 1,
      provas_enviadas: 1,
    });
    expect(resumo).toEqual({
      total: 2,
      concluidas: 1,
      percentual: 50,
      provas: 1,
      provasEnviadas: 1,
    });
  });

  it("curso sem progresso fica zerado", () => {
    expect(resumoParaProfessor(modulos, undefined)).toMatchObject({
      concluidas: 0,
      percentual: 0,
      provasEnviadas: 0,
    });
  });

  it("nunca passa de 100%, mesmo com contagem acima do total", () => {
    expect(
      resumoParaProfessor(modulos, { aulas_concluidas: 5, provas_enviadas: 3 }),
    ).toMatchObject({ concluidas: 2, percentual: 100, provasEnviadas: 1 });
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

describe("aulasConcluidasNaSemana", () => {
  it("soma as aulas da semana de todos os cursos", () => {
    expect(
      aulasConcluidasNaSemana([{ aulas_na_semana: 2 }, { aulas_na_semana: 3 }]),
    ).toBe(5);
    expect(aulasConcluidasNaSemana([])).toBe(0);
  });
});

describe("situacaoDoAluno", () => {
  const base = { menor_de_12: false, bloqueado_em: null, aceito_em: null };
  it("separa ativo, aguardando responsável e bloqueado", () => {
    expect(situacaoDoAluno(base)).toBe("ativo");
    expect(situacaoDoAluno({ ...base, menor_de_12: true })).toBe("aguardando");
    expect(
      situacaoDoAluno({ ...base, menor_de_12: true, aceito_em: "2026-10-01" }),
    ).toBe("ativo");
    expect(
      situacaoDoAluno({
        ...base,
        menor_de_12: true,
        bloqueado_em: "2026-10-01",
      }),
    ).toBe("bloqueado");
  });
});
