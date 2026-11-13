import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// Classes do campo, para inputs que não usam o rótulo acima (ex.: busca).
export function classesDoCampo(extra = ""): string {
  return `min-h-13 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario ${extra}`;
}

function Rotulo({ id, rotulo }: { id: string; rotulo: string }) {
  return (
    <label htmlFor={id} className="block text-sm font-bold text-texto">
      {rotulo}
    </label>
  );
}

// Campo de texto com o rótulo sempre visível acima.
export function Campo({
  id,
  rotulo,
  className,
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & { id: string; rotulo: string }) {
  return (
    <div className="space-y-2">
      <Rotulo id={id} rotulo={rotulo} />
      <input id={id} className={classesDoCampo(className)} {...resto} />
    </div>
  );
}

// Lista de opções com o rótulo sempre visível acima.
export function CampoSelect({
  id,
  rotulo,
  className,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; rotulo: string }) {
  return (
    <div className="space-y-2">
      <Rotulo id={id} rotulo={rotulo} />
      <select id={id} className={classesDoCampo(className)} {...resto} />
    </div>
  );
}

// Texto longo com o rótulo sempre visível acima.
export function CampoTexto({
  id,
  rotulo,
  className,
  ...resto
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  rotulo: string;
}) {
  return (
    <div className="space-y-2">
      <Rotulo id={id} rotulo={rotulo} />
      <textarea id={id} className={classesDoCampo(className)} {...resto} />
    </div>
  );
}
