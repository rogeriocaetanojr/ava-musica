import { describe, expect, it } from "vitest";
import { validarCriarConta } from "./validacao";

const valido = {
  nome: "  Ana   Souza ",
  email: " Ana@Exemplo.com ",
  senha: "violao123",
};

describe("validarCriarConta", () => {
  it("aceita e normaliza nome e e-mail, sem mexer na senha", () => {
    expect(validarCriarConta(valido)).toEqual({
      ok: true,
      dados: {
        nome: "Ana Souza",
        email: "ana@exemplo.com",
        senha: "violao123",
      },
    });
  });

  it("mantém os espaços da senha", () => {
    const resultado = validarCriarConta({ ...valido, senha: " violao 123 " });
    expect(resultado.ok && resultado.dados.senha).toBe(" violao 123 ");
  });

  it.each(["", "   ", undefined])("recusa nome vazio: %s", (nome) => {
    expect(validarCriarConta({ ...valido, nome })).toEqual({
      ok: false,
      erro: "Informe o nome completo.",
    });
  });

  it("recusa o e-mail no lugar do nome", () => {
    expect(validarCriarConta({ ...valido, nome: "ana@exemplo.com" })).toEqual({
      ok: false,
      erro: "Digite o seu nome, não o e-mail.",
    });
  });

  it.each(["", "ana", "ana@", "ana@exemplo", "a b@exemplo.com", undefined])(
    "recusa e-mail inválido: %s",
    (email) => {
      expect(validarCriarConta({ ...valido, email })).toEqual({
        ok: false,
        erro: "Informe um e-mail válido.",
      });
    },
  );

  it("recusa e-mail com mais de 254 caracteres", () => {
    const email = `${"a".repeat(250)}@b.co`;
    expect(validarCriarConta({ ...valido, email }).ok).toBe(false);
  });

  it.each(["", "1234567", undefined])(
    "recusa senha com menos de 8 caracteres: %s",
    (senha) => {
      expect(validarCriarConta({ ...valido, senha })).toEqual({
        ok: false,
        erro: "A senha precisa ter pelo menos 8 caracteres.",
      });
    },
  );

  it("aceita senha com exatamente 8 caracteres", () => {
    expect(validarCriarConta({ ...valido, senha: "12345678" }).ok).toBe(true);
  });

  it("recusa senha com mais de 72 bytes", () => {
    expect(validarCriarConta({ ...valido, senha: "a".repeat(73) }).ok).toBe(
      false,
    );
  });
});
