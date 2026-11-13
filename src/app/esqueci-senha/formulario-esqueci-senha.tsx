"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "../login/captcha";
import {
  ehFalhaDoCaptcha,
  MENSAGEM_CAPTCHA,
  MENSAGEM_MUITAS_TENTATIVAS,
} from "../login/mensagens";

const link =
  "inline-flex min-h-12 items-center text-sm font-bold text-destaque underline";

// Validação simples de formato, como em Criar conta.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pede o link de senha nova. O aviso é o mesmo para e-mail com ou sem conta,
// para a tela não revelar quais e-mails estão cadastrados.
export function FormularioEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

  async function pedir(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    const endereco = email.trim().toLowerCase();
    if (!EMAIL.test(endereco) || endereco.length > 254) {
      setErro("Informe um e-mail válido.");
      return;
    }

    setOcupado(true);
    const supabase = criarClienteNavegador();
    // O link do e-mail é montado pelo modelo (token_hash para /auth/callback);
    // o retorno vai junto para o caso de o modelo usar o endereço do Auth.
    const { error } = await supabase.auth.resetPasswordForEmail(endereco, {
      redirectTo: `${window.location.origin}/auth/callback`,
      captchaToken: tokenCaptcha ?? undefined,
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();
    setOcupado(false);

    if (!error) {
      setEnviado(true);
    } else if (ehFalhaDoCaptcha(error)) {
      setErro(MENSAGEM_CAPTCHA);
    } else if (error.code === "over_request_rate_limit") {
      // Limite por endereço de rede: vale igual para qualquer e-mail.
      setErro(MENSAGEM_MUITAS_TENTATIVAS);
    } else {
      // Os outros erros (como o intervalo entre dois envios para o mesmo
      // e-mail) só acontecem com e-mail cadastrado: o aviso continua o mesmo.
      setEnviado(true);
    }
  }

  if (enviado)
    return (
      <div className="space-y-5">
        <Aviso role="status">
          <p>
            Se houver uma conta com este e-mail, enviamos um link para criar uma
            senha nova. O link vale por 24 horas e só pode ser usado uma vez. Se
            não chegar, olhe a caixa de spam.
          </p>
        </Aviso>
        <Link href="/login" className={link}>
          Voltar para Entrar
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      <form onSubmit={pedir} noValidate className="space-y-4">
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
        <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />
        <Botao type="submit" disabled={ocupado}>
          {ocupado ? "Enviando…" : "Enviar link"}
        </Botao>
      </form>

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}

      <Link href="/login" className={link}>
        Voltar para Entrar
      </Link>
    </div>
  );
}
