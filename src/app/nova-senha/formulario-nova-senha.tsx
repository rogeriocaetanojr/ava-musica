"use client";

import { useState } from "react";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { CampoSenha } from "@/components/campo-senha";
import { erroDaNovaSenha, SENHA_MINIMA } from "@/lib/senha";

// Envia a senha nova para /nova-senha/salvar, que confere de novo, grava e
// encerra a sessão. A conferência daqui só poupa a ida ao servidor.
export function FormularioNovaSenha({ email }: { email: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function conferir(evento: React.FormEvent<HTMLFormElement>) {
    const dados = new FormData(evento.currentTarget);
    const problema = erroDaNovaSenha({
      senha: dados.get("senha"),
      confirmacao: dados.get("confirmacao"),
    });
    if (problema) {
      evento.preventDefault();
      setErro(problema);
      return;
    }
    setErro(null);
    setEnviando(true);
  }

  return (
    <div className="space-y-4">
      <form
        action="/nova-senha/salvar"
        method="post"
        onSubmit={conferir}
        noValidate
        className="space-y-4"
      >
        {/* Ajuda o gerenciador de senhas a guardar a senha com o e-mail certo. */}
        <input
          type="email"
          name="email"
          value={email}
          autoComplete="username"
          readOnly
          hidden
        />
        <CampoSenha
          id="senha"
          name="senha"
          rotulo="Senha nova"
          dica={`Pelo menos ${SENHA_MINIMA} caracteres.`}
          required
          minLength={SENHA_MINIMA}
          autoComplete="new-password"
        />
        <CampoSenha
          id="confirmacao"
          name="confirmacao"
          rotulo="Repita a senha nova"
          required
          minLength={SENHA_MINIMA}
          autoComplete="new-password"
        />
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar senha nova"}
        </Botao>
      </form>

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}
    </div>
  );
}
