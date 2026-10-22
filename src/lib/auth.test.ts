import { describe, expect, it } from "vitest";
import { destinoDoPapel } from "./auth";

describe("destinoDoPapel", () => {
  it("leva o professor ao painel", () => {
    expect(destinoDoPapel("professor")).toBe("/professor");
  });

  it("leva o aluno aos cursos", () => {
    expect(destinoDoPapel("aluno")).toBe("/cursos");
  });
});
