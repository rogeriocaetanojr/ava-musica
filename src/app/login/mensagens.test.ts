import { describe, expect, it } from "vitest";
import {
  ehBloqueado,
  ehCodigoInvalido,
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
} from "./mensagens";

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

describe("ehPedidoBarrado", () => {
  it("reconhece a recusa do hook no envio do código e na volta do Google", () => {
    expect(
      ehPedidoBarrado({ message: "Não foi possível pedir acesso agora." }),
    ).toBe(true);
    expect(
      ehPedidoBarrado({
        message: "Error running hook URI: Não foi possível pedir acesso agora.",
      }),
    ).toBe(true);
  });

  it("não confunde outros erros com a recusa", () => {
    expect(ehPedidoBarrado(null)).toBe(false);
    expect(ehPedidoBarrado({ message: "Forbidden" })).toBe(false);
  });
});

describe("ehFalhaDoCaptcha", () => {
  it("reconhece a falha do captcha", () => {
    expect(ehFalhaDoCaptcha({ code: "captcha_failed" })).toBe(true);
    expect(ehFalhaDoCaptcha({ code: "otp_expired" })).toBe(false);
    expect(ehFalhaDoCaptcha(null)).toBe(false);
  });
});

describe("ehCodigoInvalido", () => {
  it("reconhece o código errado ou vencido", () => {
    expect(ehCodigoInvalido({ code: "otp_expired" })).toBe(true);
    expect(ehCodigoInvalido({ code: "invalid_credentials" })).toBe(true);
  });

  it("não confunde outros erros com o código inválido", () => {
    expect(ehCodigoInvalido(null)).toBe(false);
    expect(ehCodigoInvalido({ code: "user_banned" })).toBe(false);
    expect(ehCodigoInvalido({ code: "over_request_rate_limit" })).toBe(false);
  });
});
