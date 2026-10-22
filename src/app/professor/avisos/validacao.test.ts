import { describe, expect, it } from "vitest";
import { validarAviso } from "./validacao";

function formulario(campos: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [nome, valor] of Object.entries(campos)) formData.set(nome, valor);
  return formData;
}

const CURSO = "c0000000-0000-0000-0000-000000000001";

describe("validarAviso", () => {
  it("aceita aviso para todos", () => {
    expect(
      validarAviso(
        formulario({
          titulo: " Recesso ",
          texto: "Sem aula dia 15.",
          curso_id: "",
        }),
      ),
    ).toEqual({
      ok: true,
      dados: { titulo: "Recesso", texto: "Sem aula dia 15.", curso_id: null },
    });
  });

  it("aceita aviso para um curso", () => {
    const resultado = validarAviso(
      formulario({
        titulo: "Prova",
        texto: "Prova na sexta.",
        curso_id: CURSO,
      }),
    );
    expect(resultado.ok && resultado.dados.curso_id).toBe(CURSO);
  });

  it("recusa título ou texto vazio", () => {
    expect(validarAviso(formulario({ titulo: "", texto: "x" })).ok).toBe(false);
    expect(validarAviso(formulario({ titulo: "x", texto: "  " })).ok).toBe(
      false,
    );
  });

  it("recusa textos longos demais", () => {
    expect(
      validarAviso(formulario({ titulo: "a".repeat(121), texto: "x" })).ok,
    ).toBe(false);
    expect(
      validarAviso(formulario({ titulo: "x", texto: "a".repeat(2001) })).ok,
    ).toBe(false);
  });

  it("recusa curso que não é um id válido e devolve o que foi digitado", () => {
    expect(
      validarAviso(formulario({ titulo: "x", texto: "y", curso_id: "abc" })),
    ).toEqual({
      ok: false,
      erro: "Escolha um curso da lista.",
      valores: { titulo: "x", texto: "y", curso_id: "abc" },
    });
  });
});
