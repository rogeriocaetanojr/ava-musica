import { describe, expect, it } from "vitest";
import { ehUuid, validarCurso, validarTitulo } from "./validacao";

function formulario(campos: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [nome, valor] of Object.entries(campos)) formData.set(nome, valor);
  return formData;
}

describe("validarCurso", () => {
  it("aceita um curso completo", () => {
    const resultado = validarCurso(
      formulario({
        titulo: "  Violão para iniciantes ",
        instrumento: "Violão",
        nivel: "Iniciante",
        descricao: "Primeiros acordes.",
        capa_url: "https://exemplo.com/capa.jpg",
        publicado: "on",
      }),
    );
    expect(resultado).toEqual({
      ok: true,
      dados: {
        titulo: "Violão para iniciantes",
        instrumento: "Violão",
        nivel: "Iniciante",
        descricao: "Primeiros acordes.",
        capa_url: "https://exemplo.com/capa.jpg",
        publicado: true,
      },
    });
  });

  it("guarda campos opcionais vazios como nulos e despublicado", () => {
    const resultado = validarCurso(
      formulario({ titulo: "Piano", instrumento: "Piano" }),
    );
    expect(resultado).toEqual({
      ok: true,
      dados: {
        titulo: "Piano",
        instrumento: "Piano",
        nivel: null,
        descricao: null,
        capa_url: null,
        publicado: false,
      },
    });
  });

  it("exige título e instrumento", () => {
    expect(validarCurso(formulario({ instrumento: "Piano" }))).toMatchObject({
      ok: false,
      erro: "Informe o título do curso.",
    });
    expect(validarCurso(formulario({ titulo: "Piano" }))).toMatchObject({
      ok: false,
      erro: "Informe o instrumento.",
    });
  });

  it("recusa nível fora da lista", () => {
    expect(
      validarCurso(
        formulario({ titulo: "Piano", instrumento: "Piano", nivel: "Mestre" }),
      ),
    ).toMatchObject({ ok: false, erro: "Escolha um nível da lista." });
  });

  it("recusa capa que não é link http ou https", () => {
    for (const capa of ["javascript:alert(1)", "capa.jpg"]) {
      expect(
        validarCurso(
          formulario({ titulo: "Piano", instrumento: "Piano", capa_url: capa }),
        ),
      ).toMatchObject({ ok: false });
    }
  });

  it("devolve o que foi digitado quando há erro", () => {
    const resultado = validarCurso(
      formulario({ titulo: "", instrumento: "Flauta" }),
    );
    expect(resultado).toMatchObject({
      ok: false,
      valores: { instrumento: "Flauta" },
    });
  });
});

describe("validarTitulo", () => {
  it("exige título com mensagem do tipo certo", () => {
    expect(validarTitulo(formulario({ titulo: " " }), "da aula")).toMatchObject(
      { ok: false, erro: "Informe o título da aula." },
    );
  });

  it("recusa título longo demais", () => {
    expect(
      validarTitulo(formulario({ titulo: "a".repeat(121) }), "do módulo"),
    ).toMatchObject({ ok: false });
  });

  it("aceita e apara o título", () => {
    expect(
      validarTitulo(formulario({ titulo: " Acordes " }), "do módulo"),
    ).toEqual({ ok: true, dados: "Acordes" });
  });
});

describe("ehUuid", () => {
  it("reconhece só identificadores válidos", () => {
    expect(ehUuid("6f1c2a9e-1b2c-4d3e-8f9a-0b1c2d3e4f5a")).toBe(true);
    expect(ehUuid("1 or 1=1")).toBe(false);
    expect(ehUuid(null)).toBe(false);
  });
});
