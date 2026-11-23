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
