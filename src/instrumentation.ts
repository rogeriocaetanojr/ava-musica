import type { Instrumentation } from "next";

// Erros do servidor (páginas, rotas, server actions e proxy) vão para o Sentry
// quando SENTRY_DSN está definida, sem dados pessoais (ver
// src/lib/monitoramento.ts). Sem a variável, nada sai, como no computador e
// nos testes. O envio nunca derruba a resposta: falhou, só fica no log.
export const onRequestError: Instrumentation.onRequestError = async (
  erro,
  pedido,
  contexto,
) => {
  const { lerDsn, montarEnvelope, montarEvento } =
    await import("./lib/monitoramento");
  const dsn = process.env.SENTRY_DSN;
  const destino = lerDsn(dsn);
  if (!dsn || !destino) return;

  const evento = montarEvento(
    erro,
    {
      routePath: contexto.routePath,
      routeType: contexto.routeType,
      method: pedido.method,
    },
    {
      ambiente: process.env.SENTRY_AMBIENTE || "producao",
      idDoEvento: crypto.randomUUID().replaceAll("-", ""),
      agora: new Date(),
    },
  );
  try {
    await fetch(destino.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${destino.chave}, sentry_client=ava-musica/1.0`,
      },
      body: montarEnvelope(evento, dsn),
      signal: AbortSignal.timeout(3000),
    });
  } catch (falha) {
    console.error("Não foi possível enviar o erro ao Sentry", falha);
  }
};
