import { describe, expect, it } from "vitest";
import { ehBloqueado, ehLimiteDeTentativas } from "./mensagens";

describe("ehLimiteDeTentativas", () => {
  it("reconhece o status 429 e os códigos de limite do Supabase", () => {
    expect(ehLimiteDeTentativas({ status: 429 })).toBe(true);
    expect(ehLimiteDeTentativas({ code: "over_email_send_rate_limit" })).toBe(
      true,
    );
    expect(ehLimiteDeTentativas({ code: "over_request_rate_limit" })).toBe(
      true,
    );
  });

  it("não confunde outros erros com o limite", () => {
    expect(ehLimiteDeTentativas(null)).toBe(false);
    expect(ehLimiteDeTentativas({ status: 400, code: "otp_expired" })).toBe(
      false,
    );
  });
});

describe("ehBloqueado", () => {
  it("reconhece a conta bloqueada pelo professor", () => {
    expect(ehBloqueado({ code: "user_banned" })).toBe(true);
  });

  it("não confunde outros erros com o bloqueio", () => {
    expect(ehBloqueado(null)).toBe(false);
    expect(ehBloqueado({ code: "otp_expired" })).toBe(false);
    expect(ehBloqueado({ code: "over_request_rate_limit" })).toBe(false);
  });
});
