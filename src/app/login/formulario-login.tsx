"use client";

import { useRef, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "./captcha";
import {
  ehBloqueado,
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
  MENSAGEM_BLOQUEADO,
  MENSAGEM_CAPTCHA,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_PEDIDO_BARRADO,
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
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

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
    // Quem não tem conta ganha uma nova, pendente: o pedido só vale depois que
    // a pessoa clica no link (ver /auth/callback). A mensagem de sucesso é a
    // mesma para todos, então a tela não revela se o e-mail tem conta.
    const { error } = await supabase.auth.signInWithOtp({
      email: enderecoDigitado,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: urlDeRetorno(),
        captchaToken: tokenCaptcha ?? undefined,
      },
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();

    if (!error) {
      setEstado({ tipo: "enviado", email: enderecoDigitado });
    } else if (ehLimiteDeTentativas(error)) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_MUITAS_TENTATIVAS });
    } else if (ehBloqueado(error)) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_BLOQUEADO });
    } else if (ehPedidoBarrado(error)) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_PEDIDO_BARRADO });
    } else if (ehFalhaDoCaptcha(error)) {
      setEstado({ tipo: "erro", mensagem: MENSAGEM_CAPTCHA });
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
        Enviamos um link para <strong>{estado.email}</strong>. Abra seu e-mail e
        toque no link para entrar. Se for o seu primeiro acesso, o professor
        recebe o seu pedido e libera em breve.
      </p>
    );
  }

  return (
    <div className="space-y-6">
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
        <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />
        <button
          type="submit"
          disabled={estado.tipo === "enviando"}
          className="w-full rounded-md border border-current px-4 py-3 font-medium disabled:opacity-60"
        >
          {estado.tipo === "enviando" ? "Enviando…" : "Entrar com e-mail"}
        </button>
      </form>

      <p className="text-center text-sm">ou</p>

      <button
        type="button"
        onClick={entrarComGoogle}
        className="w-full rounded-md border border-current px-4 py-3 font-medium"
      >
        Entrar com Google
      </button>

      {estado.tipo === "erro" && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {estado.mensagem}
        </p>
      )}
    </div>
  );
}
