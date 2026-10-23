import { describe, expect, it } from "vitest";

import { NOME_CURTO_DO_AVA, tituloDaPagina } from "@/lib/site";

describe("tituloDaPagina", () => {
  it("usa só o nome do AVA quando não há título", () => {
    expect(tituloDaPagina()).toBe(NOME_CURTO_DO_AVA);
  });

  it("junta o título da página ao nome curto do AVA", () => {
    expect(tituloDaPagina("Login")).toBe("Login · Escola John Meyer");
  });
});
