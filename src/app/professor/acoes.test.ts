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

  it("moverBloco avisa quando a leitura falha", async () => {
    usar([{ error: FALHA }]);
    expect(await aulas.moverBloco(ID, "subir")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
  });

  it("moverBloco avisa quando uma gravação da ordem falha", async () => {
    usar([
      { data: { aula_id: OUTRO } },
      {
        data: [
          { id: OUTRO, ordem: 1 },
          { id: ID, ordem: 2 },
        ],
      },
      { error: FALHA },
    ]);
    expect(await aulas.moverBloco(ID, "subir")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
  });

  it("moverBloco de um bloco que não existe mais", async () => {
    usar([{ data: null }]);
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

  it("moverModulo avisa quando uma gravação da ordem falha", async () => {
    usar([
      { data: { curso_id: OUTRO } },
      {
        data: [
          { id: OUTRO, ordem: 1 },
          { id: ID, ordem: 2 },
        ],
      },
      { error: FALHA },
    ]);
    expect(await cursos.moverModulo(ID, "subir")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
  });

  it("moverAula avisa quando a leitura das aulas falha", async () => {
    usar([{ data: { modulo_id: OUTRO } }, { error: FALHA }]);
    expect(await cursos.moverAula(ID, "descer")).toEqual({
      erro: "Não foi possível mudar a ordem. Tente de novo.",
    });
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
