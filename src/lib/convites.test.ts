import { describe, expect, it } from "vitest";
import {
  ehCodigoDeConvite,
  gerarCodigoDeConvite,
  hashDoConvite,
  situacaoDoConvite,
} from "./convites";

describe("gerarCodigoDeConvite", () => {
  it("gera códigos no formato aceito e diferentes a cada vez", () => {
    const a = gerarCodigoDeConvite();
    const b = gerarCodigoDeConvite();
    expect(ehCodigoDeConvite(a)).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("hashDoConvite", () => {
  it("devolve o sha256 em hexadecimal, sem o código", () => {
    const codigo = gerarCodigoDeConvite();
    const hash = hashDoConvite(codigo);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashDoConvite(codigo));
    expect(hash).not.toContain(codigo);
  });
});

describe("ehCodigoDeConvite", () => {
  it.each([
    "",
    "curto",
    "a".repeat(44),
    `${"a".repeat(42)}=`,
    `${"a".repeat(42)}/`,
    "../../../../../../../../../../../etc/passwd",
    undefined,
  ])("recusa %s", (valor) => {
    expect(ehCodigoDeConvite(valor)).toBe(false);
  });
});

describe("situacaoDoConvite", () => {
  const agora = new Date("2026-11-06T12:00:00Z");

  it("vale até a data de validade", () => {
    expect(
      situacaoDoConvite(
        { expira_em: "2026-11-13T12:00:00Z", usado_em: null },
        agora,
      ),
    ).toBe("valido");
  });

  it("vence na data de validade", () => {
    expect(
      situacaoDoConvite(
        { expira_em: "2026-11-06T12:00:00Z", usado_em: null },
        agora,
      ),
    ).toBe("vencido");
  });

  it("usado vale mais que vencido", () => {
    expect(
      situacaoDoConvite(
        { expira_em: "2026-11-01T12:00:00Z", usado_em: "2026-10-31T12:00:00Z" },
        agora,
      ),
    ).toBe("usado");
  });
});
