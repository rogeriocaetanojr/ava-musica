import { describe, expect, it } from "vitest";
import { validarBloco } from "./validacao";

function formulario(campos: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [nome, valor] of Object.entries(campos)) formData.set(nome, valor);
  return formData;
}

describe("validarBloco", () => {
  it("aceita um bloco de texto e ignora o link", () => {
    expect(
      validarBloco(
        formulario({
          tipo: "texto",
          titulo: " Aquecimento ",
          texto: " Toque a escala. ",
          url: "https://exemplo.com",
        }),
      ),
    ).toEqual({
      ok: true,
      dados: {
        tipo: "texto",
        titulo: "Aquecimento",
        texto: "Toque a escala.",
        url: null,
      },
    });
  });

  it("aceita um vídeo sem título e guarda o link como colado", () => {
    expect(
      validarBloco(
        formulario({ tipo: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" }),
      ),
    ).toEqual({
      ok: true,
      dados: {
        tipo: "youtube",
        titulo: null,
        texto: null,
        url: "https://youtu.be/dQw4w9WgXcQ",
      },
    });
  });

  it("guarda a prova com o marcador de e-mail", () => {
    const resultado = validarBloco(
      formulario({
        tipo: "prova",
        url: "https://docs.google.com/forms/d/e/abc/viewform?entry.1=EMAIL_DO_ALUNO",
      }),
    );
    expect(resultado.ok && resultado.dados.url).toContain("EMAIL_DO_ALUNO");
  });

  it.each([
    [{ tipo: "html", texto: "x" }, "Escolha um tipo de conteúdo."],
    [{ tipo: "texto", texto: "  " }, "Escreva o texto do bloco."],
    [{ tipo: "texto", texto: "x".repeat(10001) }, "no máximo 10000"],
    [{ tipo: "link", titulo: "x".repeat(121), url: "https://a.com" }, "120"],
    [{ tipo: "link", url: "" }, "Cole o link do conteúdo."],
    [{ tipo: "link", url: "javascript:alert(1)" }, "https://"],
    [{ tipo: "drive", url: "https://youtu.be/dQw4w9WgXcQ" }, "Google Drive"],
    [{ tipo: "prova", url: "https://exemplo.com/form" }, "Google Forms"],
  ])("recusa %o", (campos, trecho) => {
    const resultado = validarBloco(formulario(campos));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toContain(trecho);
      expect(resultado.valores.tipo).toBe(campos.tipo);
    }
  });
});
