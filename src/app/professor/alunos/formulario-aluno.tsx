"use client";

import { useActionState, useState } from "react";
import { ehDataValida, hojeNoBrasil, precisaDeAceite } from "@/lib/idade";
import { cadastrarAluno, type EstadoCadastro } from "./acoes";
import { BotaoCopiar } from "./botao-copiar";

type Curso = { id: string; titulo: string; publicado: boolean };

const campo =
  "w-full rounded-md border border-current bg-transparent px-3 py-2";

// Campos controlados para não se perderem quando o servidor recusa; a decisão
// sobre o responsável aqui é só visual: quem decide é o servidor.
export function FormularioAluno({ cursos }: { cursos: Curso[] }) {
  const hoje = hojeNoBrasil();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");

  const [estado, enviar, enviando] = useActionState(
    async (anterior: EstadoCadastro, formData: FormData) => {
      const resultado = await cadastrarAluno(anterior, formData);
      if (!resultado.erro) {
        setNome("");
        setEmail("");
        setNascimento("");
        setEscolhidos([]);
        setResponsavelNome("");
        setResponsavelEmail("");
      }
      return resultado;
    },
    {},
  );

  const menor =
    ehDataValida(nascimento) &&
    nascimento <= hoje &&
    precisaDeAceite(nascimento, hoje);

  return (
    <form action={enviar} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome</span>
        <input
          name="nome"
          required
          maxLength={120}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={campo}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Data de nascimento</span>
        <input
          name="data_nascimento"
          type="date"
          required
          max={hoje}
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
          className={campo}
        />
      </label>

      {menor && (
        <fieldset className="space-y-3 rounded-md border border-current/50 p-3">
          <legend className="px-1 text-sm font-medium">Responsável</legend>
          <p className="text-sm">
            Menos de 12 anos: a conta é criada sem convite e só é liberada
            depois que o responsável autorizar.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Nome do responsável</span>
            <input
              name="responsavel_nome"
              required
              maxLength={120}
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              className={campo}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">E-mail do responsável</span>
            <input
              name="responsavel_email"
              type="email"
              required
              maxLength={254}
              value={responsavelEmail}
              onChange={(e) => setResponsavelEmail(e.target.value)}
              className={campo}
            />
          </label>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Cursos</legend>
        {cursos.length === 0 ? (
          <p className="text-sm">Nenhum curso criado ainda.</p>
        ) : (
          cursos.map((curso) => (
            <label key={curso.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="cursos"
                value={curso.id}
                checked={escolhidos.includes(curso.id)}
                onChange={(e) =>
                  setEscolhidos((atual) =>
                    e.target.checked
                      ? [...atual, curso.id]
                      : atual.filter((id) => id !== curso.id),
                  )
                }
                className="h-4 w-4"
              />
              <span className="break-words">
                {curso.titulo}
                {!curso.publicado && " (rascunho)"}
              </span>
            </label>
          ))
        )}
      </fieldset>

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md border border-current px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        {enviando ? "Salvando…" : menor ? "Criar conta" : "Enviar convite"}
      </button>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-2 text-sm text-red-800"
        >
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <div role="status" className="space-y-2 text-sm text-green-700">
          <p>{estado.sucesso}</p>
          {estado.linkAceite && (
            <BotaoCopiar
              texto={estado.linkAceite}
              rotulo="Link de autorização do responsável"
            />
          )}
        </div>
      )}
    </form>
  );
}
