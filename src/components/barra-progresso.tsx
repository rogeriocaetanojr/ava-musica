// Barra de progresso do curso, com o número também em texto.
export function BarraProgresso({
  percentual,
  rotulo,
}: {
  percentual: number;
  rotulo: string;
}) {
  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        className="h-3 w-full overflow-hidden rounded-full bg-current/15"
      >
        <div
          className="h-full rounded-full bg-green-600"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="text-sm">{percentual}% concluído</p>
    </div>
  );
}
