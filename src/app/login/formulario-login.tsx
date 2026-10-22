"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import {
  ehLimiteDeTentativas,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_NAO_CONVIDADO,
} from "./mensagens";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "enviando" }
  | { tipo: "enviado"; email: string }
  | { tipo: "erro"; mensagem: string };

function urlDeRetorno(): string {
  return `${window.location.origin}/auth/callback`;
}

export function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function entrarComGoogle() {
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlDeRetorno() },
    });
    if (error) {
      setEstado({
        tipo: "erro",
        mensagem: ehLimiteDeTentativas(error)
          ? MENSAGEM_MUITAS_TENTATIVAS
          : "Não foi possível entrar com o Google. Tente pelo e-mail.",
      });
    }
  }

  async function enviarLink(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado({ tipo: "enviando" });

    const enderecoDigitado = email.trim();
    const supabase = criarClienteNavegador();
    // shouldCreateUser: false faz o Supabase recusar quem não foi convidado.
    const { error } = await supabase.auth.signInWithOtp({
      email: enderecoDigitado,
      options: { shouldCreateUser: false, emailRedirectTo: urlDeRetorno() },
    });

    if (!error) {
      setEstado({ tipo: "enviado", email: enderecoDigitado });
    } else if (ehLimiteDeTentativas(error)) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_MUITAS_TENTATIVAS });
    } else if (
      error.code === "otp_disabled" ||
      error.code === "signup_disabled" ||
      error.code === "user_not_found"
    ) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_NAO_CONVIDADO });
    } else {
      setEstado({
        tipo: "erro",
        mensagem: "Não foi possível enviar o link. Tente de novo.",
      });
    }
  }

  if (estado.tipo === "enviado") {
    return (
      <p role="status" className="rounded-md bg-green-100 p-3 text-green-800">
        Enviamos um link de acesso para <strong>{estado.email}</strong>. Abra
        seu e-mail e toque no link para entrar.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={entrarComGoogle}
        className="w-full rounded-md border border-current px-4 py-3 font-medium"
      >
        Entrar com Google
      </button>

      <p className="text-center text-sm">ou receba um link por e-mail</p>

      <form onSubmit={enviarLink} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className="w-full rounded-md border border-current bg-transparent px-3 py-3"
        />
        <button
          type="submit"
          disabled={estado.tipo === "enviando"}
          className="w-full rounded-md border border-current px-4 py-3 font-medium disabled:opacity-60"
        >
          {estado.tipo === "enviando" ? "Enviando…" : "Enviar link de acesso"}
        </button>
      </form>

      {estado.tipo === "erro" && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.mensagem}
        </p>
      )}
    </div>
  );
}
