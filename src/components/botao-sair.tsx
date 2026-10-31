import { classesDoBotao } from "@/components/botao";

export function BotaoSair() {
  return (
    <form action="/auth/sair" method="post">
      <button type="submit" className={classesDoBotao("secundario")}>
        Sair
      </button>
    </form>
  );
}
