import { describe, expect, it } from "vitest";
import { iniciais } from "./nomes";

describe("iniciais", () => {
  it("usa o primeiro e o último nome", () => {
    expect(iniciais("ana maria souza")).toBe("AS");
  });

  it("aceita nome único e espaços sobrando", () => {
    expect(iniciais("  Ícaro ")).toBe("Í");
  });

  it("mostra interrogação sem nome", () => {
    expect(iniciais("")).toBe("?");
  });
});
