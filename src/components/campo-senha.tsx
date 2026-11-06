"use client";

import { useState, type InputHTMLAttributes } from "react";

// Campo de senha com o rótulo acima e o botão de mostrar ou esconder a senha.
export function CampoSenha({
  id,
  rotulo,
  dica,
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  rotulo: string;
  dica?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-texto">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          aria-describedby={dica ? `${id}-dica` : undefined}
          className="min-h-14 w-full rounded-xl border border-borda-campo bg-superficie py-3 pr-16 pl-4 text-base text-texto placeholder:text-texto-secundario"
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-pressed={visivel}
          aria-controls={id}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          className="absolute inset-y-1 right-1 grid w-12 place-items-center rounded-lg text-texto-secundario hover:text-texto"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visivel && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
      {dica && (
        <p id={`${id}-dica`} className="text-sm text-texto-secundario">
          {dica}
        </p>
      )}
    </div>
  );
}
