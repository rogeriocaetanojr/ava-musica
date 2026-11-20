// Resposta das ações de um botão só (matricular, mover, remover, concluir a
// aula...): sem erro, a tela é recarregada com o que está no banco; com erro,
// a mensagem aparece ao lado do botão.
export type ResultadoDaAcao = { erro?: string };

export const ERRO_AO_SALVAR = "Não foi possível salvar. Tente de novo.";
