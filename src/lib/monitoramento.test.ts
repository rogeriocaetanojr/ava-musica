import { describe, expect, it } from "vitest";
import {
  lerDsn,
  montarEnvelope,
  montarEvento,
  quadrosDaPilha,
  semDadosPessoais,
} from "./monitoramento";

describe("lerDsn", () => {
  it("monta o endpoint de envelopes", () => {
    expect(lerDsn("https://abc123@o1.ingest.sentry.io/4507")).toEqual({
      chave: "abc123",
      endpoint: "https://o1.ingest.sentry.io/api/4507/envelope/",
    });
  });

  it("ignora DSN vazio ou inválido", () => {
    expect(lerDsn(undefined)).toBeNull();
    expect(lerDsn("")).toBeNull();
    expect(lerDsn("não é url")).toBeNull();
    expect(lerDsn("https://o1.ingest.sentry.io/4507")).toBeNull();
  });
});

describe("semDadosPessoais", () => {
  it("tira e-mail, IP, ids e códigos de link", () => {
    expect(
      semDadosPessoais(
        "falha para ana.souza@gmail.com de 189.12.3.4 e ::ffff:10:0:0:1, aluno 6f1c2d3e-1111-4222-8333-444455556666, convite AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde",
      ),
    ).toBe(
      "falha para [e-mail] de [ip] e ::[ip], aluno [id], convite [código]",
    );
  });

  it("mantém a mensagem técnica", () => {
    expect(semDadosPessoais('relation "cursos" does not exist')).toBe(
      'relation "cursos" does not exist',
    );
  });
});

describe("quadrosDaPilha", () => {
  it("guarda só o caminho do projeto, a função e a linha, do mais antigo ao mais recente", () => {
    const pilha = [
      "Error: x",
      "    at carregar (C:\\Users\\rcaet\\ava\\src\\app\\page.tsx:10:5)",
      "    at /home/runner/work/ava/.next/server/chunk.js:2:3",
    ].join("\n");
    expect(quadrosDaPilha(pilha)).toEqual([
      {
        filename: ".next/server/chunk.js",
        function: undefined,
        lineno: 2,
        colno: 3,
      },
      {
        filename: "src/app/page.tsx",
        function: "carregar",
        lineno: 10,
        colno: 5,
      },
    ]);
  });
});

describe("montarEvento", () => {
  const evento = montarEvento(
    Object.assign(new Error("perfil de ana@x.com não achado"), {
      digest: "123",
    }),
    { routePath: "/aulas/[id]", routeType: "render", method: "GET" },
    {
      ambiente: "producao",
      idDoEvento: "0".repeat(32),
      agora: new Date("2026-11-23T10:00:00Z"),
    },
  );

  it("leva só dados técnicos", () => {
    expect(evento.exception.values[0]).toMatchObject({
      type: "Error",
      value: "perfil de [e-mail] não achado",
    });
    expect(evento.tags).toEqual({
      rota: "/aulas/[id]",
      tipo: "render",
      metodo: "GET",
      digest: "123",
    });
    expect(evento.user).toEqual({ ip_address: null });
    expect(evento).not.toHaveProperty("request");
    expect(JSON.stringify(evento)).not.toContain("ana@x.com");
  });

  it("vira um envelope de três linhas", () => {
    const linhas = montarEnvelope(evento, "https://a@b.io/1").split("\n");
    expect(linhas).toHaveLength(3);
    expect(JSON.parse(linhas[0])).toEqual({
      event_id: "0".repeat(32),
      dsn: "https://a@b.io/1",
    });
    expect(JSON.parse(linhas[1]).type).toBe("event");
  });
});
