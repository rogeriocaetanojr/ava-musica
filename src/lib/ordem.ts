export type ItemOrdenado = { id: string; ordem: number };

export type Direcao = "subir" | "descer";

export function ehDirecao(valor: unknown): valor is Direcao {
  return valor === "subir" || valor === "descer";
}

// Ordena pela coluna ordem; em caso de empate, pelo id, para a tela e o servidor concordarem.
export function ordenar<T extends ItemOrdenado>(itens: readonly T[]): T[] {
  return [...itens].sort(
    (a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id),
  );
}

// Ordem para um item novo, colocado no fim da lista.
export function proximaOrdem(itens: readonly ItemOrdenado[]): number {
  return itens.length === 0 ? 0 : Math.max(...itens.map((i) => i.ordem)) + 1;
}

// Troca o item com o vizinho e renumera a lista de 0 a n-1, o que também
// conserta ordens repetidas ou com buracos. Devolve só os itens cuja ordem mudou;
// lista vazia quando não há o que mover.
export function reordenar(
  itens: readonly ItemOrdenado[],
  id: string,
  direcao: Direcao,
): ItemOrdenado[] {
  const lista = ordenar(itens);
  const posicao = lista.findIndex((item) => item.id === id);
  if (posicao === -1) return [];

  const vizinho = direcao === "subir" ? posicao - 1 : posicao + 1;
  if (vizinho < 0 || vizinho >= lista.length) return [];

  [lista[posicao], lista[vizinho]] = [lista[vizinho], lista[posicao]];

  const ordemAtual = new Map(itens.map((item) => [item.id, item.ordem]));
  return lista
    .map((item, indice) => ({ id: item.id, ordem: indice }))
    .filter((item) => ordemAtual.get(item.id) !== item.ordem);
}
