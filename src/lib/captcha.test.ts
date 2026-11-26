import { describe, expect, it } from "vitest";
import { CAPTCHA_LIGADO, captchaLigadoEm, opcoesDoCaptcha } from "./captcha";

describe("captchaLigadoEm", () => {
  it("só liga com true", () => {
    expect(captchaLigadoEm("true")).toBe(true);
    expect(captchaLigadoEm(" true ")).toBe(true);
    expect(captchaLigadoEm(undefined)).toBe(false);
    expect(captchaLigadoEm("")).toBe(false);
    expect(captchaLigadoEm("false")).toBe(false);
    expect(captchaLigadoEm("1")).toBe(false);
  });

  it("fica desligado por padrão", () => {
    expect(CAPTCHA_LIGADO).toBe(false);
  });
});

describe("opcoesDoCaptcha", () => {
  it("desligado, não manda captchaToken mesmo com token", () => {
    expect(opcoesDoCaptcha("token", false)).toEqual({});
    expect(opcoesDoCaptcha(null, false)).toEqual({});
  });

  it("ligado, manda o token quando ele existe", () => {
    expect(opcoesDoCaptcha("token", true)).toEqual({ captchaToken: "token" });
    expect(opcoesDoCaptcha(null, true)).toEqual({});
  });

  it("usa a chave do site como padrão", () => {
    expect(opcoesDoCaptcha("token")).toEqual({});
  });
});
