import "server-only";
import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Fotos de perfil no bucket privado "fotos-de-perfil", uma por pessoa em
// "<id>/foto" (migração 20261124000000). As telas recebem links assinados,
// gerados aqui com a sessão de quem pede: a RLS do Storage deixa cada um ver
// a própria foto e o professor ver as dos alunos.
export const BUCKET_DAS_FOTOS = "fotos-de-perfil";
const VALIDADE_DO_LINK_S = 60 * 60;

export function caminhoDaFoto(id: string): string {
  return `${id}/foto`;
}

// Link da foto de cada id; quem não tem foto (ou não pode vê-la) fica de fora.
export async function fotosDe(ids: string[]): Promise<Map<string, string>> {
  const fotos = new Map<string, string>();
  if (ids.length === 0) return fotos;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.storage
    .from(BUCKET_DAS_FOTOS)
    .createSignedUrls(ids.map(caminhoDaFoto), VALIDADE_DO_LINK_S);
  for (const item of data ?? []) {
    if (item.error || !item.signedUrl || !item.path) continue;
    fotos.set(item.path.split("/")[0], item.signedUrl);
  }
  return fotos;
}

// Foto de uma pessoa, memoizada por requisição (o avatar do cabeçalho e o
// perfil pedem a mesma).
export const fotoDe = cache(async (id: string): Promise<string | null> => {
  const fotos = await fotosDe([id]);
  return fotos.get(id) ?? null;
});
