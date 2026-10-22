import { describe, expect, it } from "vitest";
import { formatarDataHora } from "./datas";

describe("formatarDataHora", () => {
  it("mostra a data e a hora no horário de Brasília", () => {
    expect(formatarDataHora("2026-10-22T02:30:00Z")).toBe("21/10/2026, 23:30");
  });
});
