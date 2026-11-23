"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { Aviso } from "@/components/aviso";
import { TIPOS_DA_FOTO, validarFoto } from "@/lib/foto-validacao";
import { criarClienteNavegador } from "@/lib/supabase/navegador";

// Foto do perfil com o botão de editar (lápis) no canto. A imagem vai direto
// do navegador para o bucket privado, no caminho "<id>/foto"; a RLS do
// Storage só aceita a pasta de quem está logado, e o bucket recusa o que não
// for imagem ou passar de 2 MB.
export function FotoDePerfil({
  id,
  foto,
  cores,
}: {
  id: string;
  foto: string | null;
  // Cores do avatar de cada área.
  cores: string;
}) {
  const campo = useId();
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [, iniciarTransicao] = useTransition();

  async function enviar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    const problema = validarFoto(arquivo);
    setErro(problema);
    if (problema) return;

    setEnviando(true);
    const { error } = await criarClienteNavegador()
      .storage.from("fotos-de-perfil")
      .upload(`${id}/foto`, arquivo, {
        upsert: true,
        contentType: arquivo.type,
        cacheControl: "3600",
      });
    setEnviando(false);
    if (error) {
      setErro("Não foi possível salvar a foto. Tente de novo.");
      return;
    }
    iniciarTransicao(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <Avatar
          foto={foto}
          className={`size-20 md:size-24 ${cores} ${enviando ? "opacity-60" : ""}`}
        />
        <label
          htmlFor={campo}
          className="absolute -right-2 -bottom-1 inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-linha bg-superficie text-texto shadow-sm hover:border-borda-campo has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h4L19 9l-4-4L4 16z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          <span className="sr-only">
            {foto ? "Trocar a foto de perfil" : "Enviar uma foto de perfil"}
          </span>
          <input
            id={campo}
            type="file"
            accept={TIPOS_DA_FOTO.join(",")}
            onChange={enviar}
            disabled={enviando}
            className="sr-only"
          />
        </label>
      </div>
      <p aria-live="polite" className="text-sm text-texto-secundario">
        {enviando ? "Enviando a foto…" : null}
      </p>
      {erro && (
        <Aviso role="alert" className="max-w-64">
          {erro}
        </Aviso>
      )}
    </div>
  );
}
