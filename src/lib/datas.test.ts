import { describe, expect, it } from "vitest";
import { dataPorExtenso, formatarDataHora, quandoFoi, saudacao } from "./datas";

describe("formatarDataHora", () => {
  it("mostra a data e a hora no horário de Brasília", () => {
    expect(formatarDataHora("2026-10-22T02:30:00Z")).toBe("21/10/2026, 23:30");
  });
});

describe("saudacao", () => {
  it("usa a hora de Brasília, não a do servidor", () => {
    expect(saudacao(new Date("2026-10-22T13:00:00Z"))).toBe("Bom dia");
    expect(saudacao(new Date("2026-10-22T15:00:00Z"))).toBe("Boa tarde");
    expect(saudacao(new Date("2026-10-22T21:00:00Z"))).toBe("Boa noite");
  });

  it("troca nas viradas de 5h, 12h e 18h", () => {
    expect(saudacao(new Date("2026-10-22T07:59:00Z"))).toBe("Boa noite");
    expect(saudacao(new Date("2026-10-22T08:00:00Z"))).toBe("Bom dia");
    expect(saudacao(new Date("2026-10-22T14:59:00Z"))).toBe("Bom dia");
    expect(saudacao(new Date("2026-10-22T15:00:00Z"))).toBe("Boa tarde");
    expect(saudacao(new Date("2026-10-22T20:59:00Z"))).toBe("Boa tarde");
    expect(saudacao(new Date("2026-10-22T21:00:00Z"))).toBe("Boa noite");
  });
});

describe("dataPorExtenso", () => {
  it("usa o dia de Brasília, sem o -feira", () => {
    expect(dataPorExtenso(new Date("2026-10-22T15:00:00Z"))).toBe(
      "Quinta, 22 de outubro",
    );
    // 01h UTC de sexta ainda é quinta em Brasília.
    expect(dataPorExtenso(new Date("2026-10-23T01:00:00Z"))).toBe(
      "Quinta, 22 de outubro",
    );
    expect(dataPorExtenso(new Date("2026-10-25T15:00:00Z"))).toBe(
      "Domingo, 25 de outubro",
    );
  });
});

describe("quandoFoi", () => {
  const agora = new Date("2026-10-22T15:00:00Z");
  it("conta os dias no calendário de Brasília", () => {
    expect(quandoFoi("2026-10-22T04:00:00Z", agora)).toBe("hoje");
    expect(quandoFoi("2026-10-22T02:00:00Z", agora)).toBe("ontem");
    expect(quandoFoi("2026-10-17T15:00:00Z", agora)).toBe("há 5 dias");
    expect(quandoFoi("2026-10-10T15:00:00Z", agora)).toBe("10/10/2026");
  });
});
