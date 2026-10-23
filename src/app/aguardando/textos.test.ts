import { describe, expect, it } from "vitest";
import { textoDaEspera } from "./textos";

describe("textoDaEspera", () => {
  it("mostra a espera pelo professor para o pedido pendente", () => {
    const texto = textoDaEspera(true);
    expect(texto.titulo).toBe("Aguardando liberação do professor");
    expect(texto.explicacao).not.toContain("responsável");
  });

  it("mostra a espera pelo responsável para o menor já liberado", () => {
    const texto = textoDaEspera(false);
    expect(texto.titulo).toBe("Aguardando o responsável");
    expect(texto.explicacao).toContain("responsável");
  });
});
