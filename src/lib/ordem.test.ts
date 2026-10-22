import { describe, expect, it } from "vitest";
import { ehDirecao, ordenar, proximaOrdem, reordenar } from "./ordem";

const itens = [
  { id: "a", ordem: 0 },
  { id: "b", ordem: 1 },
  { id: "c", ordem: 2 },
];

describe("reordenar", () => {
  it("sobe um item trocando com o anterior", () => {
    expect(reordenar(itens, "b", "subir")).toEqual([
      { id: "b", ordem: 0 },
      { id: "a", ordem: 1 },
    ]);
  });

  it("desce um item trocando com o seguinte", () => {
    expect(reordenar(itens, "b", "descer")).toEqual([
      { id: "c", ordem: 1 },
      { id: "b", ordem: 2 },
    ]);
  });

  it("não sobe o primeiro item", () => {
    expect(reordenar(itens, "a", "subir")).toEqual([]);
  });

  it("não desce o último item", () => {
    expect(reordenar(itens, "c", "descer")).toEqual([]);
  });

  it("ignora um id que não está na lista", () => {
    expect(reordenar(itens, "x", "subir")).toEqual([]);
  });

  it("não depende da ordem em que os itens chegam", () => {
    const embaralhados = [itens[2], itens[0], itens[1]];
    expect(reordenar(embaralhados, "c", "subir")).toEqual([
      { id: "c", ordem: 1 },
      { id: "b", ordem: 2 },
    ]);
  });

  it("renumera ordens com buracos", () => {
    const comBuracos = [
      { id: "a", ordem: 0 },
      { id: "b", ordem: 5 },
      { id: "c", ordem: 9 },
    ];
    expect(reordenar(comBuracos, "c", "subir")).toEqual([
      { id: "c", ordem: 1 },
      { id: "b", ordem: 2 },
    ]);
  });

  it("desempata ordens repetidas pelo id", () => {
    const repetidas = [
      { id: "b", ordem: 0 },
      { id: "a", ordem: 0 },
    ];
    // Empatados, "a" vem antes de "b"; ao descer, só "a" muda (b já tem ordem 0).
    expect(reordenar(repetidas, "a", "descer")).toEqual([
      { id: "a", ordem: 1 },
    ]);
  });

  it("não move nada numa lista de um item", () => {
    expect(reordenar([{ id: "a", ordem: 0 }], "a", "descer")).toEqual([]);
  });
});

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
