// Erros do servidor para o Sentry, sem o SDK: o evento é montado aqui, campo a
// campo, para nenhum dado pessoal sair (LGPD, há menores entre os alunos).
// Vai só o tipo do erro, a mensagem sem e-mail, IP, ids e códigos de link, a
// pilha só com arquivo, função e linha, e a rota como modelo
// (/aulas/[id]), nunca o endereço com ids, cookies, cabeçalhos ou usuário.

export type DsnDoSentry = { chave: string; endpoint: string };

// https://<chave>@<host>/<projeto> → endpoint de envelopes da API do Sentry.
export function lerDsn(dsn: string | undefined): DsnDoSentry | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projeto = url.pathname.replace(/^\//, "");
    if (!url.username || !/^\d+$/.test(projeto)) return null;
    return {
      chave: url.username,
      endpoint: `${url.protocol}//${url.host}/api/${projeto}/envelope/`,
    };
  } catch {
    return null;
  }
}

const PADROES_PESSOAIS: [RegExp, string][] = [
  [/[^\s@"'<>()]+@[^\s@"'<>()]+\.[^\s@"'<>()]+/g, "[e-mail]"],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[ip]"],
  [/\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b/gi, "[ip]"],
  [
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "[id]",
  ],
  // Códigos de convite e de aceite, tokens e hashes longos.
  [/\b[A-Za-z0-9_-]{32,}\b/g, "[código]"],
];

export function semDadosPessoais(texto: string): string {
  return PADROES_PESSOAIS.reduce(
    (resultado, [padrao, troca]) => resultado.replace(padrao, troca),
    texto,
  ).slice(0, 1000);
}

type Quadro = {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
};

// "    at funcao (arquivo:linha:coluna)" → quadro do Sentry, só com o caminho
// relativo ao projeto (sem a pasta do usuário no servidor).
export function quadrosDaPilha(pilha: string | undefined): Quadro[] {
  if (!pilha) return [];
  const quadros: Quadro[] = [];
  for (const linha of pilha.split("\n").slice(1, 31)) {
    const achado = linha.match(/^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/);
    if (!achado) continue;
    const [, funcao, arquivo, linhaNum, coluna] = achado;
    const relativo = arquivo
      .replace(/\\/g, "/")
      .replace(/^.*?\/(\.next[^/]*|src|node_modules)\//, "$1/");
    quadros.push({
      filename: semDadosPessoais(relativo),
      function: funcao ? semDadosPessoais(funcao) : undefined,
      lineno: Number(linhaNum),
      colno: Number(coluna),
    });
  }
  // O Sentry espera do mais antigo para o mais recente.
  return quadros.reverse();
}

export type ContextoDoErro = {
  routePath: string;
  routeType: string;
  method: string;
};

export function montarEvento(
  erro: unknown,
  contexto: ContextoDoErro,
  opcoes: { ambiente: string; idDoEvento: string; agora: Date },
) {
  const comoErro = erro instanceof Error ? erro : null;
  const digest =
    typeof erro === "object" && erro !== null && "digest" in erro
      ? String((erro as { digest: unknown }).digest)
      : undefined;
  return {
    event_id: opcoes.idDoEvento,
    timestamp: opcoes.agora.toISOString(),
    platform: "node",
    level: "error",
    environment: opcoes.ambiente,
    // Sem isto o Sentry deduz o IP de quem enviou o evento.
    user: { ip_address: null },
    tags: {
      rota: semDadosPessoais(contexto.routePath),
      tipo: contexto.routeType,
      metodo: contexto.method,
      ...(digest ? { digest: semDadosPessoais(digest) } : {}),
    },
    exception: {
      values: [
        {
          type: comoErro?.name ?? "Erro",
          value: semDadosPessoais(comoErro?.message ?? String(erro)),
          stacktrace: { frames: quadrosDaPilha(comoErro?.stack) },
        },
      ],
    },
  };
}

// Formato de envelope da API do Sentry: cabeçalho, item e o evento.
export function montarEnvelope(
  evento: ReturnType<typeof montarEvento>,
  dsn: string,
): string {
  const corpo = JSON.stringify(evento);
  return [
    JSON.stringify({ event_id: evento.event_id, dsn }),
    JSON.stringify({ type: "event", content_type: "application/json" }),
    corpo,
  ].join("\n");
}
