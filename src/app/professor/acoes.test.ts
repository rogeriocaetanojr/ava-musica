// Ações do professor com falha do Supabase: cada uma devolve uma mensagem
// clara, em vez de seguir como se tivesse dado certo.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALHA, supabaseFalso } from "@/testes/supabase-falso";

const falso = vi.hoisted(() => ({
  cliente: null as unknown,
  admin: null as unknown,
  registrarAcesso: vi.fn(async () => true),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: falso.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  exigirProfessor: async () => ({ id: "prof", papel: "professor", nome: "P" }),
}));
vi.mock("@/lib/auditoria", () => ({ registrarAcesso: falso.registrarAcesso }));
vi.mock("@/lib/supabase/servidor", () => ({
  criarClienteServidor: async () => falso.cliente,
}));
vi.mock("@/lib/supabase/admin", () => ({
  criarClienteAdmin: () => falso.admin,
}));

const alunos = await import("./alunos/acoes");
const aulas = await import("./aulas/[id]/acoes");
const cursos = await import("./cursos/[id]/acoes");
const avisos = await import("./avisos/acoes");

const ID = "c0000000-0000-0000-0000-000000000001";
const OUTRO = "c0000000-0000-0000-0000-000000000002";

function usar(respostas: Parameters<typeof supabaseFalso>[0]) {
  const falsoCliente = supabaseFalso(respostas);
  falso.cliente = falsoCliente.cliente;
  return falsoCliente;
}

beforeEach(() => {
  falso.revalidatePath.mockClear();
  falso.registrarAcesso.mockClear();
  falso.registrarAcesso.mockResolvedValue(true);
});

describe("matricular e desmatricular", () => {
  it("matricular devolve o erro do banco", async () => {
    usar([{ error: FALHA }]);
    expect(await alunos.matricular(ID, OUTRO)).toEqual({
      erro: "Não foi possível matricular. Tente de novo.",
    });
    expect(falso.revalidatePath).not.toHaveBeenCalled();
  });

  it("desmatricular devolve o erro do banco", async () => {
    usar([{ error: FALHA }]);
    expect(await alunos.desmatricular(ID, OUTRO)).toEqual({
      erro: "Não foi possível desmatricular. Tente de novo.",
    });
  });

  it("sem registro na auditoria, não matricula e avisa", async () => {
    const { chamadas } = usar([]);
    falso.registrarAcesso.mockResolvedValue(false);
    expect((await alunos.matricular(ID, OUTRO)).erro).toMatch(
      /registrar o acesso/,
    );
    expect(chamadas).toEqual([]);
  });

  it("sem erro, matricula e atualiza a tela", async () => {
    usar([]);
    expect(await alunos.matricular(ID, OUTRO)).toEqual({});
    expect(falso.revalidatePath).toHaveBeenCalled();
  });
});

describe("reenviarConvite", () => {
  it("não reenvia quando não consegue saber se o aluno já entrou", async () => {
    usar([{ data: { email: "a@b.c", nome: "Ana", bloqueado_em: null } }]);
    const admin = supabaseFalso([{ error: FALHA }]);
    falso.admin = admin.cliente;
    expect(await alunos.reenviarConvite(ID)).toEqual({
      erro: "Não foi possível conferir o aluno. Tente de novo.",
    });
  });
});

describe("blocos da aula", () => {
  it("removerBloco devolve o erro do banco", async () => {
    usar([{ error: FALHA }]);
    expect(await aulas.removerBloco(ID)).toEqual({
      erro: "Não foi possível remover o bloco. Tente de novo.",
    });
    expect(falso.revalidatePath).not.toHaveBeenCalled();
  });

  it("moverBloco troca a ordem pelo banco, numa chamada só", async () => {
    const { chamadas } = usar([{ data: true }]);
    expect(await aulas.moverBloco(ID, "subir")).toEqual({});
    expect(chamadas).toEqual(["rpc:mover_item"]);
  });

  it("moverBloco avisa quando o banco recusa", async () => {
    usar([{ error: FALHA }]);
    expect(await aulas.moverBloco(ID, "subir")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
  });

  it("moverBloco de um bloco que não existe mais", async () => {
    usar([{ error: { code: "P0002" } }]);
    expect((await aulas.moverBloco(ID, "subir")).erro).toMatch(
      /não encontrado/,
    );
  });
});

describe("aulas e módulos do curso", () => {
  it("publicarAula devolve o erro do banco", async () => {
    usar([{ error: FALHA }]);
    expect(await cursos.publicarAula(ID, true)).toEqual({
      erro: "Não foi possível publicar a aula. Tente de novo.",
    });
  });

  it("despublicar também avisa", async () => {
    usar([{ error: FALHA }]);
    expect(await cursos.publicarAula(ID, false)).toEqual({
      erro: "Não foi possível despublicar a aula. Tente de novo.",
    });
  });

  it("moverModulo e moverAula trocam a ordem pelo banco", async () => {
    const { chamadas } = usar([{ data: true }, { data: true }]);
    expect(await cursos.moverModulo(ID, "subir")).toEqual({});
    expect(await cursos.moverAula(ID, "descer")).toEqual({});
    expect(chamadas).toEqual(["rpc:mover_item", "rpc:mover_item"]);
  });

  it("moverModulo avisa quando o banco recusa", async () => {
    usar([{ error: FALHA }]);
    expect(await cursos.moverModulo(ID, "subir")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
  });

  it("moverAula com direção inválida não chama o banco", async () => {
    const { chamadas } = usar([]);
    expect((await cursos.moverAula(ID, "lado" as "subir")).erro).toMatch(
      /não encontrado/,
    );
    expect(chamadas).toEqual([]);
  });
});

describe("excluir curso, módulo e aula", () => {
  it("excluirAula e excluirModulo apagam pelo banco, que grava a auditoria", async () => {
    const { chamadas } = usar([{}, {}]);
    expect(await cursos.excluirAula(ID)).toEqual({});
    expect(await cursos.excluirModulo(ID)).toEqual({});
    expect(chamadas).toEqual(["rpc:excluir_item", "rpc:excluir_item"]);
  });

  it("excluirCurso devolve o erro do banco e fica na página", async () => {
    usar([{ error: FALHA }]);
    expect(await cursos.excluirCurso(ID)).toEqual({
      erro: "Não foi possível excluir. Tente de novo.",
    });
  });

  it("excluir item que não existe mais", async () => {
    usar([{ error: { code: "P0002" } }]);
    expect((await cursos.excluirAula(ID)).erro).toMatch(/não encontrado/);
  });

  it("id inválido não chama o banco", async () => {
    const { chamadas } = usar([]);
    expect((await cursos.excluirModulo("x")).erro).toMatch(/não encontrado/);
    expect(chamadas).toEqual([]);
  });
});

describe("recados", () => {
  it("apagarAviso devolve o erro do banco", async () => {
    usar([{ error: FALHA }]);
    expect(await avisos.apagarAviso(ID)).toEqual({
      erro: "Não foi possível apagar o recado. Tente de novo.",
    });
    expect(falso.revalidatePath).not.toHaveBeenCalled();
  });
});
