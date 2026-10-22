import { describe, expect, it } from "vitest";
import {
  type ClienteConvites,
  LIMITE_DE_CONVITES_POR_HORA,
  MENSAGEM_LIMITE_DE_CONVITES,
  reservarEnvioDeConvite,
} from "./limite-convites";

function clienteFalso(
  enviados: number | null,
  erroContagem: { code?: string } | null = null,
  erroInsercao: { code?: string } | null = null,
) {
  const insercoes: unknown[] = [];
  const cliente: ClienteConvites = {
    rpc: async () => ({ data: enviados, error: erroContagem }),
    from: () => ({
      insert: async (linha) => {
        insercoes.push(linha);
        return { error: erroInsercao };
      },
    }),
  };
  return { cliente, insercoes };
}

describe("reservarEnvioDeConvite", () => {
  it("o limite é de 20 por hora", () => {
    expect(LIMITE_DE_CONVITES_POR_HORA).toBe(20);
  });

  it("libera e registra o envio enquanto há vaga", async () => {
    const { cliente, insercoes } = clienteFalso(19);
    expect(await reservarEnvioDeConvite(cliente)).toEqual({ ok: true });
    expect(insercoes).toHaveLength(1);
  });

  it("recusa o 21º envio sem registrar nada", async () => {
    const { cliente, insercoes } = clienteFalso(20);
    expect(await reservarEnvioDeConvite(cliente)).toEqual({
      ok: false,
      erro: MENSAGEM_LIMITE_DE_CONVITES,
    });
    expect(insercoes).toHaveLength(0);
  });

  it("mostra a mensagem do limite quando o banco recusa a inclusão", async () => {
    const { cliente } = clienteFalso(19, null, { code: "42501" });
    expect(await reservarEnvioDeConvite(cliente)).toEqual({
      ok: false,
      erro: MENSAGEM_LIMITE_DE_CONVITES,
    });
  });

  it("não envia se não conseguir contar", async () => {
    const { cliente, insercoes } = clienteFalso(null, { code: "XX000" });
    const resultado = await reservarEnvioDeConvite(cliente);
    expect(resultado.ok).toBe(false);
    expect(resultado).not.toEqual({
      ok: false,
      erro: MENSAGEM_LIMITE_DE_CONVITES,
    });
    expect(insercoes).toHaveLength(0);
  });

  it("não envia se outro erro impedir o registro", async () => {
    const { cliente } = clienteFalso(3, null, { code: "08006" });
    expect((await reservarEnvioDeConvite(cliente)).ok).toBe(false);
  });
});
