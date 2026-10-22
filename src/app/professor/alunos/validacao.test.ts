import { describe, expect, it } from "vitest";
import { confirmaExclusao, statusDoAluno, validarAluno } from "./validacao";

const HOJE = "2026-10-22";
const CURSO = "11111111-1111-4111-8111-111111111111";

function formulario(
  campos: Record<string, string>,
  cursos: string[] = [],
): FormData {
  const formData = new FormData();
  for (const [nome, valor] of Object.entries(campos)) formData.set(nome, valor);
  for (const curso of cursos) formData.append("cursos", curso);
  return formData;
}

const maior = {
  nome: " Ana Souza ",
  email: " Ana@Exemplo.com ",
  data_nascimento: "2012-03-10",
};

describe("validarAluno", () => {
  it("aceita aluno de 14 anos sem responsável", () => {
    const resultado = validarAluno(
      formulario({ ...maior, responsavel_nome: "Ignorado" }, [CURSO, CURSO]),
      HOJE,
    );
    expect(resultado).toEqual({
      ok: true,
      dados: {
        nome: "Ana Souza",
        email: "ana@exemplo.com",
        data_nascimento: "2012-03-10",
        idade: 14,
        cursos: [CURSO],
        responsavel: null,
      },
    });
  });

  it("exige o responsável de aluno de 10 anos", () => {
    const campos = { ...maior, data_nascimento: "2016-05-01" };
    const sem = validarAluno(formulario(campos), HOJE);
    expect(sem.ok).toBe(false);
    if (!sem.ok) expect(sem.erro).toContain("nome do responsável");

    const com = validarAluno(
      formulario({
        ...campos,
        responsavel_nome: "Carlos Souza",
        responsavel_email: "Carlos@Exemplo.com",
      }),
      HOJE,
    );
    expect(com.ok && com.dados.responsavel).toEqual({
      nome: "Carlos Souza",
      email: "carlos@exemplo.com",
    });
  });

  it("decide pelos 12 anos completos no dia do cadastro", () => {
    const hoje = validarAluno(
      formulario({ ...maior, data_nascimento: "2014-10-22" }),
      HOJE,
    );
    expect(hoje.ok && hoje.dados.responsavel).toBeNull();

    const amanha = validarAluno(
      formulario({ ...maior, data_nascimento: "2014-10-23" }),
      HOJE,
    );
    expect(amanha.ok).toBe(false);
  });

  it.each([
    [{ ...maior, nome: "" }, "nome do aluno"],
    [{ ...maior, email: "sem-arroba" }, "e-mail válido para o aluno"],
    [{ ...maior, data_nascimento: "" }, "data de nascimento"],
    [{ ...maior, data_nascimento: "2013-02-29" }, "data de nascimento"],
    [{ ...maior, data_nascimento: "2026-10-23" }, "futuro"],
    [{ ...maior, data_nascimento: "1880-01-01" }, "ano de nascimento"],
    [
      {
        ...maior,
        data_nascimento: "2016-05-01",
        responsavel_nome: "Carlos",
        responsavel_email: "x",
      },
      "e-mail válido para o responsável",
    ],
    [
      {
        ...maior,
        data_nascimento: "2016-05-01",
        responsavel_nome: "Carlos",
        responsavel_email: "ana@exemplo.com",
      },
      "diferente",
    ],
  ])("recusa %o", (campos, trecho) => {
    const resultado = validarAluno(formulario(campos), HOJE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain(trecho);
  });

  it("recusa curso que não é um id", () => {
    const resultado = validarAluno(formulario(maior, ["abc"]), HOJE);
    expect(resultado.ok).toBe(false);
  });
});

describe("statusDoAluno", () => {
  it("menor sem aceite fica aguardando, mesmo que já tenha entrado", () => {
    expect(
      statusDoAluno({
        menor_de_12: true,
        aceito: false,
        ultimo_acesso: "2026-10-01T10:00:00Z",
      }),
    ).toBe("aguardando");
  });

  it("quem nunca entrou está convidado", () => {
    expect(
      statusDoAluno({ menor_de_12: false, aceito: false, ultimo_acesso: null }),
    ).toBe("convidado");
    expect(
      statusDoAluno({ menor_de_12: true, aceito: true, ultimo_acesso: null }),
    ).toBe("convidado");
  });

  it("quem já entrou está ativo", () => {
    expect(
      statusDoAluno({
        menor_de_12: false,
        aceito: false,
        ultimo_acesso: "2026-10-01T10:00:00Z",
      }),
    ).toBe("ativo");
  });
});

describe("confirmaExclusao", () => {
  it("aceita o nome igual, sem contar espaços e maiúsculas", () => {
    expect(confirmaExclusao(" ana souza ", "Ana Souza")).toBe(true);
  });

  it("recusa nome diferente, vazio ou ausente", () => {
    expect(confirmaExclusao("Ana", "Ana Souza")).toBe(false);
    expect(confirmaExclusao("", "Ana Souza")).toBe(false);
    expect(confirmaExclusao(null, "Ana Souza")).toBe(false);
  });
});
