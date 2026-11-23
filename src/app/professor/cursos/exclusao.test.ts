import { describe, expect, it } from "vitest";
import { type ResumoDaExclusao, textoDaExclusao } from "./exclusao";

const vazio: ResumoDaExclusao = {
  tipo: "curso",
  id: "c",
  modulos: 0,
  aulas: 0,
  conteudos: 0,
  alunos_com_progresso: 0,
  matriculas: 0,
  avisos: 0,
};

describe("textoDaExclusao", () => {
  it("lista tudo o que vai junto com o curso", () => {
    expect(
      textoDaExclusao("curso", "Violão I", {
        ...vazio,
        modulos: 2,
        aulas: 5,
        conteudos: 12,
        alunos_com_progresso: 3,
        matriculas: 4,
        avisos: 1,
      }),
    ).toBe(
      'Excluir o curso "Violão I"? Vão junto: 2 módulos, 5 aulas, 12 blocos de conteúdo, o progresso de 3 alunos, 4 matrículas e 1 recado do curso. Isso não pode ser desfeito.',
    );
  });

  it("usa o singular e não fala de matrículas no módulo", () => {
    expect(
      textoDaExclusao("modulo", "Acordes", {
        ...vazio,
        tipo: "modulo",
        aulas: 1,
        conteudos: 1,
        alunos_com_progresso: 1,
        matriculas: 9,
      }),
    ).toBe(
      'Excluir o módulo "Acordes"? Vão junto: 1 aula, 1 bloco de conteúdo e o progresso de 1 aluno. Isso não pode ser desfeito.',
    );
  });

  it("na aula, não conta a própria aula", () => {
    expect(
      textoDaExclusao("aula", "Pestana", {
        ...vazio,
        tipo: "aula",
        aulas: 1,
        conteudos: 2,
      }),
    ).toBe(
      'Excluir a aula "Pestana"? Vão junto: 2 blocos de conteúdo. Isso não pode ser desfeito.',
    );
  });

  it("avisa quando não há nada dentro", () => {
    expect(textoDaExclusao("aula", "Nova", { ...vazio, tipo: "aula" })).toBe(
      'Excluir a aula "Nova"? Não há mais nada dentro. Isso não pode ser desfeito.',
    );
  });

  it("sem o resumo, avisa sem números que vai tudo junto", () => {
    expect(textoDaExclusao("modulo", "Acordes", undefined)).toBe(
      'Excluir o módulo "Acordes"? Vai junto tudo o que estiver dentro, inclusive o progresso dos alunos. Isso não pode ser desfeito.',
    );
  });
});
