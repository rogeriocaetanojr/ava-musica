import { describe, expect, it } from "vitest";
import { ehDirecao, ordenar, proximaOrdem } from "./ordem";

describe("ordenar", () => {
  it("ordena pela ordem e, no empate, pelo id", () => {
    const resultado = ordenar([
      { id: "c", ordem: 1 },
      { id: "b", ordem: 0 },
      { id: "a", ordem: 1 },
    ]);
    expect(resultado.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("não altera a lista original", () => {
    const original = [
      { id: "b", ordem: 1 },
      { id: "a", ordem: 0 },
    ];
    ordenar(original);
    expect(original[0].id).toBe("b");
  });
});

describe("proximaOrdem", () => {
  it("começa em zero numa lista vazia", () => {
    expect(proximaOrdem([])).toBe(0);
  });

  it("coloca o item novo depois do maior", () => {
    expect(
      proximaOrdem([
        { id: "a", ordem: 3 },
        { id: "b", ordem: 7 },
      ]),
    ).toBe(8);
  });
});

describe("ehDirecao", () => {
  it("aceita só subir e descer", () => {
    expect(ehDirecao("subir")).toBe(true);
    expect(ehDirecao("descer")).toBe(true);
    expect(ehDirecao("lado")).toBe(false);
    expect(ehDirecao(undefined)).toBe(false);
  });
});
