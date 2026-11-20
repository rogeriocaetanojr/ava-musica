import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  CABECALHOS_DE_SEGURANCA,
  gerarNonce,
  hashDoScript,
  montarCsp,
  origemConfere,
  recusarOutraOrigem,
} from "./seguranca";

function diretivas(csp: string): Map<string, string[]> {
  return new Map(
    csp.split("; ").map((parte) => {
      const [nome, ...valores] = parte.split(" ");
      return [nome, valores];
    }),
  );
}

const base = {
  nonce: "abc123",
  hashes: ["sha256-xyz"],
  supabaseUrl: "https://projeto.supabase.co",
  desenvolvimento: false,
};

describe("montarCsp", () => {
  it("libera script só pelo site, pelo nonce, pelos hashes e pelo captcha", () => {
    const script = diretivas(montarCsp(base)).get("script-src");
    expect(script).toEqual([
      "'self'",
      "'nonce-abc123'",
      "'sha256-xyz'",
      "https://challenges.cloudflare.com",
    ]);
  });

  it("nunca libera script inline sem nonce", () => {
    for (const desenvolvimento of [false, true]) {
      const script = diretivas(montarCsp({ ...base, desenvolvimento })).get(
        "script-src",
      );
      expect(script).not.toContain("'unsafe-inline'");
    }
  });

  it("só libera eval no desenvolvimento", () => {
    expect(diretivas(montarCsp(base)).get("script-src")).not.toContain(
      "'unsafe-eval'",
    );
    expect(
      diretivas(montarCsp({ ...base, desenvolvimento: true })).get(
        "script-src",
      ),
    ).toContain("'unsafe-eval'");
  });

  it("libera os iframes do YouTube sem cookies e do captcha", () => {
    expect(diretivas(montarCsp(base)).get("frame-src")).toEqual([
      "https://www.youtube-nocookie.com",
      "https://challenges.cloudflare.com",
    ]);
  });

  it("libera o Supabase para dados e áudio, e nada mais de fora", () => {
    const csp = diretivas(montarCsp(base));
    expect(csp.get("connect-src")).toEqual([
      "'self'",
      "https://projeto.supabase.co",
    ]);
    expect(csp.get("media-src")).toEqual([
      "'self'",
      "https://projeto.supabase.co",
    ]);
  });

  it("proíbe ser incorporado e restringe o resto", () => {
    const csp = diretivas(montarCsp(base));
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("default-src")).toEqual(["'self'"]);
  });

  it("só pede upgrade para https no ar", () => {
    expect(diretivas(montarCsp(base)).has("upgrade-insecure-requests")).toBe(
      true,
    );
    expect(
      diretivas(
        montarCsp({ ...base, supabaseUrl: "http://127.0.0.1:54321" }),
      ).has("upgrade-insecure-requests"),
    ).toBe(false);
  });

  it("sem o endereço do Supabase, não libera origem de fora", () => {
    const csp = diretivas(montarCsp({ ...base, supabaseUrl: undefined }));
    expect(csp.get("connect-src")).toEqual(["'self'"]);
    expect(csp.get("media-src")).toEqual(["'self'"]);
  });
});

describe("CABECALHOS_DE_SEGURANCA", () => {
  it("traz os cabeçalhos fixos", () => {
    const nomes = CABECALHOS_DE_SEGURANCA.map(({ key }) => key);
    expect(nomes).toEqual([
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]);
  });
});

describe("gerarNonce", () => {
  it("gera um valor novo em base64 a cada chamada", () => {
    const a = gerarNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(gerarNonce()).not.toBe(a);
  });
});

describe("hashDoScript", () => {
  it("calcula o sha256 em base64, como a CSP espera", async () => {
    const esperado = createHash("sha256").update("alert(1)").digest("base64");
    expect(await hashDoScript("alert(1)")).toBe(`sha256-${esperado}`);
  });
});

describe("origemConfere", () => {
  const site = "https://escola.netlify.app";
  const com = (valores: Record<string, string>) => new Headers(valores);

  it("aceita o Origin do próprio site", () => {
    expect(origemConfere(com({ origin: site }), site)).toBe(true);
  });

  it("aceita o Origin do endereço oficial do site", () => {
    expect(
      origemConfere(com({ origin: site }), "http://interno:8080", [`${site}/`]),
    ).toBe(true);
  });

  it.each([
    "https://golpe.com",
    "https://escola.netlify.app.golpe.com",
    "http://escola.netlify.app",
    "null",
  ])("recusa o Origin %s", (origem) => {
    expect(origemConfere(com({ origin: origem }), site)).toBe(false);
  });

  it("sem Origin, vale o Sec-Fetch-Site do mesmo site", () => {
    expect(origemConfere(com({ "sec-fetch-site": "same-origin" }), site)).toBe(
      true,
    );
    expect(origemConfere(com({ "sec-fetch-site": "cross-site" }), site)).toBe(
      false,
    );
    expect(origemConfere(com({}), site)).toBe(false);
  });
});

describe("recusarOutraOrigem", () => {
  const pedido = (origem: string) => ({
    headers: new Headers({ origin: origem }),
    nextUrl: { origin: "http://localhost:3000" },
  });

  it("deixa seguir o pedido do próprio site", () => {
    expect(recusarOutraOrigem(pedido("http://localhost:3000"))).toBeNull();
  });

  it("recusa com 403 o pedido de outro site", () => {
    expect(recusarOutraOrigem(pedido("https://golpe.com"))?.status).toBe(403);
  });
});
