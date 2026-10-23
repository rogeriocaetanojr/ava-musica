import { describe, expect, it } from "vitest";
import { formatarDataHora, saudacao } from "./datas";

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
