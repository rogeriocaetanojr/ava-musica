import { describe, expect, it } from "vitest";
import { ehTokenDeAceite } from "./validacao";

describe("ehTokenDeAceite", () => {
  it("aceita 64 caracteres hexadecimais minúsculos", () => {
    expect(ehTokenDeAceite("a1".repeat(32))).toBe(true);
  });

  it("recusa tamanho errado, maiúsculas e outros caracteres", () => {
    expect(ehTokenDeAceite("a1".repeat(31))).toBe(false);
    expect(ehTokenDeAceite("A1".repeat(32))).toBe(false);
    expect(ehTokenDeAceite(`${"a".repeat(63)}-`)).toBe(false);
    expect(ehTokenDeAceite(undefined)).toBe(false);
  });
});
