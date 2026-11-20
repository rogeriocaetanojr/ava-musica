import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALHA, supabaseFalso } from "@/testes/supabase-falso";

const falso = vi.hoisted(() => ({
  cliente: null as unknown,
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: falso.revalidatePath }));
vi.mock("@/lib/auth", () => ({
  exigirAluno: async () => ({ id: "aluno-1", papel: "aluno", nome: "Ana" }),
}));
vi.mock("@/lib/supabase/servidor", () => ({
  criarClienteServidor: async () => falso.cliente,
}));

const { marcarAula, marcarProva } = await import("./acoes");

const AULA = "e0000000-0000-0000-0000-000000000001";
const PROVA = "f0000000-0000-0000-0000-000000000002";

beforeEach(() => {
  falso.revalidatePath.mockClear();
});

describe("marcarAula", () => {
  it("devolve o erro e não atualiza a tela quando a gravação falha", async () => {
    falso.cliente = supabaseFalso([{ error: FALHA }]).cliente;
    expect(await marcarAula(AULA, true)).toEqual({
      erro: "Não foi possível marcar a aula como concluída. Tente de novo.",
    });
    // Sem revalidar, nada muda na tela: o check não aparece marcado.
    expect(falso.revalidatePath).not.toHaveBeenCalled();
  });

  it("devolve o erro ao desmarcar", async () => {
    falso.cliente = supabaseFalso([{ error: FALHA }]).cliente;
    expect(await marcarAula(AULA, false)).toEqual({
      erro: "Não foi possível desmarcar a aula. Tente de novo.",
    });
  });

  it("sem erro, atualiza a tela", async () => {
    falso.cliente = supabaseFalso().cliente;
    expect(await marcarAula(AULA, true)).toEqual({});
    expect(falso.revalidatePath).toHaveBeenCalled();
  });

  it("recusa id inválido sem ir ao banco", async () => {
    const { cliente, chamadas } = supabaseFalso();
    falso.cliente = cliente;
    expect((await marcarAula("x", true)).erro).toBeDefined();
    expect(chamadas).toEqual([]);
  });
});

describe("marcarProva", () => {
  it("devolve o erro quando a gravação falha", async () => {
    falso.cliente = supabaseFalso([{ error: FALHA }]).cliente;
    expect(await marcarProva(AULA, PROVA, true)).toEqual({
      erro: "Não foi possível registrar o envio da prova. Tente de novo.",
    });
    expect(falso.revalidatePath).not.toHaveBeenCalled();
  });
});
