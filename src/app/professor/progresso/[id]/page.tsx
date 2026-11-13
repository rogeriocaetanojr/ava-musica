import { redirect } from "next/navigation";

// O progresso do aluno agora fica na ficha; o endereço antigo leva para lá.
export default async function ProgressoDoAluno({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/professor/alunos/${encodeURIComponent(id)}`);
}
