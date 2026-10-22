export function BotaoSair() {
  return (
    <form action="/auth/sair" method="post">
      <button
        type="submit"
        className="rounded-md border border-current px-4 py-2 text-sm"
      >
        Sair
      </button>
    </form>
  );
}
