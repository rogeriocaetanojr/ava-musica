import { criarClienteServidor } from "@/lib/supabase/servidor";

export type AcaoAuditada =
  | "abrir"
  | "editar"
  | "matricular"
  | "desmatricular"
  | "excluir"
  | "bloquear"
  | "desbloquear"
  | "liberar"
  | "recusar";

export const NOMES_DAS_ACOES: Record<AcaoAuditada, string> = {
  abrir: "Abriu a ficha",
  editar: "Editou os dados",
  matricular: "Matriculou em um curso",
  desmatricular: "Desmatriculou de um curso",
  excluir: "Excluiu os dados",
  bloquear: "Bloqueou o acesso",
  desbloquear: "Desbloqueou o acesso",
  liberar: "Liberou o pedido de acesso",
  recusar: "Recusou o pedido de acesso",
};

// Registra o acesso do professor ao aluno. O banco decide se registra (só
// menores de 18 anos). Devolve false se a gravação falhar.
export async function registrarAcesso(
  acao: AcaoAuditada,
  alunoId: string,
): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("registrar_acesso", {
    acao,
    aluno: alunoId,
  });
  return !error;
}
