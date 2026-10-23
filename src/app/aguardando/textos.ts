export type TextoDaEspera = {
  titulo: string;
  explicacao: string;
  dica: string;
};

// O pedido pendente espera o professor; o menor de 12 já liberado espera o
// responsável. O pendente vem primeiro: só depois de liberado o professor
// informa a idade e, se preciso, o responsável.
export function textoDaEspera(pendente: boolean): TextoDaEspera {
  if (pendente)
    return {
      titulo: "Aguardando liberação do professor",
      explicacao:
        "Recebemos o seu pedido de acesso. Assim que o professor liberar, você vai poder ver seus cursos e aulas. Não é preciso pedir de novo: é só voltar aqui mais tarde.",
      dica: "Se já faz um tempo, fale com o professor.",
    };
  return {
    titulo: "Aguardando o responsável",
    explicacao:
      "Seu acesso está aguardando a autorização do seu responsável. Assim que ele autorizar, você vai poder ver seus cursos e aulas.",
    dica: "Se já faz um tempo, peça ao seu responsável para conferir o e-mail ou fale com o professor.",
  };
}
