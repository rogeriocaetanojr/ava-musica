// Supabase falso para os testes das server actions. Cada consulta (from,
// rpc...) devolve a próxima resposta da fila, na ordem em que as ações as
// fazem; sem resposta na fila, devolve sucesso sem dados. Os métodos de
// filtro (eq, is, select...) só encadeiam, e a consulta é resolvida no await.

type Resposta = {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
};

export const FALHA = { code: "XX000", message: "falha simulada" };

export function supabaseFalso(respostas: Resposta[] = []) {
  const fila = [...respostas];
  const chamadas: string[] = [];

  function proxima() {
    const r = fila.shift() ?? {};
    return { data: r.data ?? null, error: r.error ?? null };
  }

  function consulta(nome: string) {
    chamadas.push(nome);
    let resposta: ReturnType<typeof proxima> | undefined;
    const alvo: Record<string, unknown> = {};
    const encadear = new Proxy(alvo, {
      get(_, prop) {
        if (prop === "then") {
          resposta ??= proxima();
          const r = resposta;
          return (ok: (v: unknown) => unknown) => Promise.resolve(r).then(ok);
        }
        return () => encadear;
      },
    });
    return encadear;
  }

  const cliente = {
    from: (tabela: string) => consulta(`from:${tabela}`),
    rpc: (funcao: string) => consulta(`rpc:${funcao}`),
    auth: {
      signOut: () => Promise.resolve({ error: null }),
      admin: {
        getUserById: () => consulta("auth:getUserById"),
        deleteUser: () => consulta("auth:deleteUser"),
      },
    },
  };
  return { cliente, chamadas };
}
