import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALHA, supabaseFalso } from "@/testes/supabase-falso";

const falso = vi.hoisted(() => ({
  admin: null as unknown,
  enviarAoProfessor: vi.fn(async () => true),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/enviar-email", () => ({
  enviarAoProfessor: falso.enviarAoProfessor,
}));
vi.mock("@/lib/supabase/admin", () => ({
  criarClienteAdmin: () => falso.admin,
}));

const { confirmarPedido } = await import("./pedidos");

const ALUNO = { id: "a1", nome: "Ana", email: "ana@teste.local" };

beforeEach(() => {
  falso.enviarAoProfessor.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("confirmarPedido", () => {
  it("devolve false quando o pedido não foi gravado, sem avisar o professor", async () => {
    falso.admin = supabaseFalso([{ error: FALHA }]).cliente;
    expect(await confirmarPedido(ALUNO)).toBe(false);
    expect(falso.enviarAoProfessor).not.toHaveBeenCalled();
  });

  it("com o pedido gravado e a marcação do aviso falhando, o pedido vale", async () => {
    falso.admin = supabaseFalso([{}, { error: FALHA }]).cliente;
    expect(await confirmarPedido(ALUNO)).toBe(true);
    expect(falso.enviarAoProfessor).not.toHaveBeenCalled();
  });

  it("grava o pedido e avisa o professor uma vez", async () => {
    falso.admin = supabaseFalso([{}, { data: [{ id: "a1" }] }]).cliente;
    expect(await confirmarPedido(ALUNO)).toBe(true);
    expect(falso.enviarAoProfessor).toHaveBeenCalledOnce();
  });

  it("e-mail que não sai desfaz a marcação; o pedido continua valendo", async () => {
    const { cliente, chamadas } = supabaseFalso([
      {},
      { data: [{ id: "a1" }] },
      {},
    ]);
    falso.admin = cliente;
    falso.enviarAoProfessor.mockResolvedValueOnce(false);
    expect(await confirmarPedido(ALUNO)).toBe(true);
    expect(chamadas).toEqual(["from:perfis", "from:perfis", "from:perfis"]);
  });
});
