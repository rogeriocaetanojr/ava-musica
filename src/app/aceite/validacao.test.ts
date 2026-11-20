import { describe, expect, it } from "vitest";
import {
  ehTokenDeAceite,
  gerarTokenDeAceite,
  hashDoTokenDeAceite,
  situacaoDoAceite,
  vencimentoDoAceite,
} from "./validacao";

describe("ehTokenDeAceite", () => {
  it("aceita o código gerado: 43 caracteres base64url", () => {
    expect(ehTokenDeAceite(gerarTokenDeAceite())).toBe(true);
  });

  it("recusa o formato antigo, tamanho errado e outros caracteres", () => {
    expect(ehTokenDeAceite("a1".repeat(32))).toBe(false);
    expect(ehTokenDeAceite("a".repeat(42))).toBe(false);
    expect(ehTokenDeAceite(`${"a".repeat(42)}=`)).toBe(false);
    expect(ehTokenDeAceite(undefined)).toBe(false);
  });
});

describe("hashDoTokenDeAceite", () => {
  it("é o SHA-256 em hexadecimal, no formato que o banco aceita", () => {
    expect(hashDoTokenDeAceite("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("dois códigos gerados são diferentes", () => {
    expect(gerarTokenDeAceite()).not.toBe(gerarTokenDeAceite());
  });
});

describe("situacaoDoAceite", () => {
  const agora = new Date("2026-11-21T12:00:00Z");

  it("vale 7 dias a partir da geração", () => {
    const expira_em = vencimentoDoAceite(agora.getTime());
    expect(expira_em).toBe("2026-11-28T12:00:00.000Z");
    expect(situacaoDoAceite({ aceito_em: null, expira_em }, agora)).toBe(
      "valido",
    );
    expect(
      situacaoDoAceite(
        { aceito_em: null, expira_em },
        new Date("2026-11-28T12:00:00Z"),
      ),
    ).toBe("vencido");
  });

  it("sem link gerado conta como vencido; o aceite dado vale sempre", () => {
    expect(situacaoDoAceite({ aceito_em: null, expira_em: null }, agora)).toBe(
      "vencido",
    );
    expect(
      situacaoDoAceite(
        { aceito_em: "2026-01-01T00:00:00Z", expira_em: null },
        agora,
      ),
    ).toBe("aceito");
  });
});
