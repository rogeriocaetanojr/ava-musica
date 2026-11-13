import { Esqueleto } from "@/components/esqueleto";
import { TelaDoAluno } from "@/components/tela-do-aluno";

// Enquanto a página do aluno carrega: cabeçalho e abas sem aba marcada.
export default function Carregando() {
  return (
    <TelaDoAluno>
      <Esqueleto />
    </TelaDoAluno>
  );
}
