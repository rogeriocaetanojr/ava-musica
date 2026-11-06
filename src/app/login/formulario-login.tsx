"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { CampoSenha } from "@/components/campo-senha";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "./captcha";
import {
  ehBloqueado,
  ehCredenciaisInvalidas,
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  MENSAGEM_CAPTCHA,
  MENSAGEM_CREDENCIAIS_INVALIDAS,
  MENSAGEM_MUITAS_TENTATIVAS,
} from "./mensagens";

const link =
  "inline-flex min-h-12 items-center text-sm font-bold text-destaque underline";

export function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

  async function entrarComGoogle() {
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErro(
        ehLimiteDeTentativas(error)
          ? MENSAGEM_MUITAS_TENTATIVAS
          : "Não foi possível entrar com o Google. Tente com e-mail e senha.",
      );
    }
  }

  async function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setOcupado(true);
    setErro(null);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
      options: { captchaToken: tokenCaptcha ?? undefined },
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();

    if (!error) {
      // Navegação completa até a rota do servidor, que lê a sessão nova nos
      // cookies (o router do Next não abre rotas de API).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/auth/concluir");
      return;
    }
    setOcupado(false);
    if (ehBloqueado(error)) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/bloqueado");
    } else if (ehLimiteDeTentativas(error)) {
      setErro(MENSAGEM_MUITAS_TENTATIVAS);
    } else if (ehFalhaDoCaptcha(error)) {
      setErro(MENSAGEM_CAPTCHA);
    } else if (ehCredenciaisInvalidas(error)) {
      setErro(MENSAGEM_CREDENCIAIS_INVALIDAS);
    } else {
      setErro("Não foi possível entrar. Tente de novo.");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={entrar} className="space-y-5">
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="nome@email.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
        <div className="space-y-1">
          <CampoSenha
            id="senha"
            rotulo="Senha"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
          />
          <Link href="/esqueci-senha" className={link}>
            Esqueci minha senha
          </Link>
        </div>
        <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />
        <Botao type="submit" disabled={ocupado}>
          {ocupado ? "Entrando…" : "Entrar"}
        </Botao>
      </form>

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}

      <div
        aria-hidden="true"
        className="flex items-center gap-4 text-sm text-texto-secundario"
      >
        <span className="h-px flex-1 bg-linha" />
        ou
        <span className="h-px flex-1 bg-linha" />
      </div>
      <Botao variante="secundario" onClick={entrarComGoogle}>
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full border border-linha text-sm font-extrabold"
        >
          G
        </span>
        Entrar com Google
      </Botao>

      <p className="text-sm text-texto-secundario">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className={link}>
          Criar conta
        </Link>
      </p>

      {/* No celular, a versão curta deste aviso fica no rodapé da página. */}
      <div className="hidden md:block">
        <Aviso>
          <p>
            Quem cria a conta espera o professor liberar o acesso. Para menores
            de 12 anos, o responsável autoriza primeiro.
          </p>
        </Aviso>
      </div>
    </div>
  );
}
