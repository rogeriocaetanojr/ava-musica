// Barra de progresso do curso, com o número também em texto. Sem texto, quem
// usa a barra mostra o número ao lado.
const CORES = {
  sucesso: { trilho: "bg-current/15", barra: "bg-sucesso" },
  bordo: { trilho: "bg-linha", barra: "bg-destaque" },
  amarelo: { trilho: "bg-superficie/30", barra: "bg-amarelo" },
};

export function BarraProgresso({
  percentual,
  rotulo,
  cor = "sucesso",
  comTexto = true,
  grossa = false,
}: {
  percentual: number;
  rotulo: string;
  cor?: keyof typeof CORES;
  comTexto?: boolean;
  // Barra mais alta, para o destaque do Continue de onde parou.
  grossa?: boolean;
}) {
  const { trilho, barra } = CORES[cor];
  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        className={`w-full overflow-hidden rounded-full ${grossa ? "h-3.5" : cor === "sucesso" ? "h-3" : "h-2"} ${trilho}`}
      >
        <div
          className={`h-full rounded-full ${barra}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      {comTexto && <p className="text-sm">{percentual}% concluído</p>}
    </div>
  );
}
