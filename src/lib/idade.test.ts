import { describe, expect, it } from "vitest";
import {
  calcularIdade,
  ehDataValida,
  hojeNoBrasil,
  precisaDeAceite,
} from "./idade";

describe("calcularIdade", () => {
  it("conta o ano só depois do aniversário", () => {
    expect(calcularIdade("2010-06-15", "2026-06-14")).toBe(15);
    expect(calcularIdade("2010-06-15", "2026-06-15")).toBe(16);
    expect(calcularIdade("2010-06-15", "2026-06-16")).toBe(16);
  });

  it("compara o mês antes do dia", () => {
    expect(calcularIdade("2010-12-01", "2026-11-30")).toBe(15);
    expect(calcularIdade("2010-01-31", "2026-02-01")).toBe(16);
  });

  it("trata quem nasceu em 29 de fevereiro", () => {
    expect(calcularIdade("2012-02-29", "2026-02-28")).toBe(13);
    expect(calcularIdade("2012-02-29", "2026-03-01")).toBe(14);
    expect(calcularIdade("2012-02-29", "2028-02-29")).toBe(16);
  });

  it("dá zero para quem nasceu hoje", () => {
    expect(calcularIdade("2026-10-22", "2026-10-22")).toBe(0);
  });

  it("recusa datas inválidas", () => {
    expect(() => calcularIdade("2014-02-30", "2026-10-22")).toThrow();
    expect(() => calcularIdade("22/10/2014", "2026-10-22")).toThrow();
  });
});

describe("precisaDeAceite", () => {
  const hoje = "2026-10-22";

  it("não exige aceite de quem faz 12 anos hoje", () => {
    expect(precisaDeAceite("2014-10-22", hoje)).toBe(false);
  });

  it("não exige aceite de quem fez 12 anos ontem", () => {
    expect(precisaDeAceite("2014-10-21", hoje)).toBe(false);
  });

  it("exige aceite de quem só faz 12 anos amanhã", () => {
    expect(precisaDeAceite("2014-10-23", hoje)).toBe(true);
  });

  it("decide pelos anos completos", () => {
    expect(precisaDeAceite("2020-01-01", hoje)).toBe(true);
    expect(precisaDeAceite("2000-01-01", hoje)).toBe(false);
  });
});

describe("ehDataValida", () => {
  it.each(["2014-10-22", "2012-02-29", "2000-12-31"])("aceita %s", (data) => {
    expect(ehDataValida(data)).toBe(true);
  });

  it.each(["2013-02-29", "2014-13-01", "2014-04-31", "2014-1-5", "", "hoje"])(
    "recusa %s",
    (data) => {
      expect(ehDataValida(data)).toBe(false);
    },
  );
});

describe("hojeNoBrasil", () => {
  it("usa o fuso de Brasília, não o UTC", () => {
    // 22/10 às 01h UTC ainda é 21/10 às 22h em Brasília.
    expect(hojeNoBrasil(new Date("2026-10-22T01:00:00Z"))).toBe("2026-10-21");
    expect(hojeNoBrasil(new Date("2026-10-22T15:00:00Z"))).toBe("2026-10-22");
  });
});
