import { Esqueleto } from "@/components/esqueleto";
import { TelaDoProfessor } from "@/components/tela-do-professor";

// Enquanto a página do professor carrega: cabeçalho e abas sem aba marcada.
export default function Carregando() {
  return (
    <TelaDoProfessor>
      <Esqueleto />
    </TelaDoProfessor>
  );
}
