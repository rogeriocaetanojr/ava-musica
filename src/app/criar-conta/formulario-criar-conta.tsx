"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { CampoSenha } from "@/components/campo-senha";
import { SENHA_MINIMA } from "@/lib/senha";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "../login/captcha";
import {
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
  MENSAGEM_CAPTCHA,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_PEDIDO_BARRADO,
} from "../login/mensagens";
import { validarCriarConta } from "./validacao";

const link =
  "inline-flex min-h-12 items-center text-sm font-bold text-destaque underline";

// Cria a conta com confirmação de e-mail. O pedido de acesso só vale depois
// que a pessoa abre o link do e-mail (ver /auth/confirmar).
export function FormularioCriarConta() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

  async function criar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    const resultado = validarCriarConta({ nome, email, senha });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setOcupado(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signUp({
      email: resultado.dados.email,
      password: resultado.dados.senha,
      options: {
        data: { nome: resultado.dados.nome },
        captchaToken: tokenCaptcha ?? undefined,
      },
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();
    setOcupado(false);

    // Com a confirmação de e-mail ligada, o Auth responde do mesmo jeito para
    // e-mail novo e já cadastrado, então a tela também não revela a diferença.
    if (!error) {
      setEnviadoPara(resultado.dados.email);
    } else if (ehLimiteDeTentativas(error)) {
      setErro(MENSAGEM_MUITAS_TENTATIVAS);
    } else if (ehPedidoBarrado(error)) {
      setErro(MENSAGEM_PEDIDO_BARRADO);
    } else if (ehFalhaDoCaptcha(error)) {
      setErro(MENSAGEM_CAPTCHA);
    } else if (error.code === "weak_password") {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    } else {
      setErro("Não foi possível criar a conta. Tente de novo.");
    }
  }

  if (enviadoPara)
    return (
      <div className="space-y-5">
        <Aviso role="status">
          <p>
            Enviamos um link de confirmação para{" "}
            <strong className="break-all">{enviadoPara}</strong>. Abra o link
            para confirmar o e-mail; depois disso, o professor recebe o seu
            pedido de acesso. Se não chegar, olhe a caixa de spam.
          </p>
        </Aviso>
        <Link href="/login" className={link}>
          Voltar para Entrar
        </Link>
      </div>
    );

  return (
    <div className="space-y-5">
      <form onSubmit={criar} noValidate className="space-y-5">
        <Campo
          id="nome"
          rotulo="Nome completo"
          required
          autoComplete="name"
          maxLength={120}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
        />
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
        <CampoSenha
          id="senha"
          rotulo="Senha"
          dica={`Pelo menos ${SENHA_MINIMA} caracteres.`}
          required
          minLength={SENHA_MINIMA}
          autoComplete="new-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />
        <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />
        <Botao type="submit" disabled={ocupado}>
          {ocupado ? "Criando…" : "Criar conta"}
        </Botao>
      </form>

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}

      <p className="text-sm text-texto-secundario">
        Já tem conta?{" "}
        <Link href="/login" className={link}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
