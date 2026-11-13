"use client";

import { useRef, useState } from "react";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { CampoSenha } from "@/components/campo-senha";
import { erroDaNovaSenha, SENHA_MINIMA } from "@/lib/senha";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "@/app/login/captcha";
import {
  ehBloqueado,
  ehCredenciaisInvalidas,
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  MENSAGEM_CAPTCHA,
  MENSAGEM_MUITAS_TENTATIVAS,
} from "@/app/login/mensagens";

// Cartão "Trocar senha" do perfil do aluno e do professor. A senha atual é
// conferida com um login por senha (por isso o captcha); depois a senha nova é
// gravada e as sessões dos outros aparelhos são encerradas.
export function TrocarSenha({ email }: { email: string }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trocada, setTrocada] = useState(false);
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

  async function trocar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setTrocada(false);
    if (!atual) {
      setErro("Informe a sua senha atual.");
      return;
    }
    const problema = erroDaNovaSenha({ senha: nova, confirmacao });
    if (problema) {
      setErro(problema);
      return;
    }
    if (nova === atual) {
      setErro("A senha nova precisa ser diferente da senha atual.");
      return;
    }

    setOcupado(true);
    const supabase = criarClienteNavegador();
    const { error: erroDaAtual } = await supabase.auth.signInWithPassword({
      email,
      password: atual,
      options: { captchaToken: tokenCaptcha ?? undefined },
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();
    if (erroDaAtual) {
      setOcupado(false);
      if (ehBloqueado(erroDaAtual)) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/bloqueado");
      } else if (ehLimiteDeTentativas(erroDaAtual)) {
        setErro(MENSAGEM_MUITAS_TENTATIVAS);
      } else if (ehFalhaDoCaptcha(erroDaAtual)) {
        setErro(MENSAGEM_CAPTCHA);
      } else if (ehCredenciaisInvalidas(erroDaAtual)) {
        setErro("A senha atual não confere.");
      } else {
        setErro("Não foi possível trocar a senha. Tente de novo.");
      }
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nova });
    if (error) {
      setOcupado(false);
      if (error.code === "same_password")
        setErro("A senha nova precisa ser diferente da senha atual.");
      else if (error.code === "weak_password")
        setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      else setErro("Não foi possível trocar a senha. Tente de novo.");
      return;
    }

    // Quem estava logado em outro aparelho com a senha antiga sai.
    await supabase.auth.signOut({ scope: "others" });
    setOcupado(false);
    setAtual("");
    setNova("");
    setConfirmacao("");
    setTrocada(true);
  }

  return (
    <section
      aria-labelledby="trocar-senha"
      className="space-y-4 rounded-3xl border border-linha bg-superficie p-5"
    >
      <h2 id="trocar-senha" className="font-titulo text-2xl text-texto">
        Trocar senha
      </h2>
      <form onSubmit={trocar} noValidate className="space-y-4">
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
          id="senha-atual"
          rotulo="Senha atual"
          required
          autoComplete="current-password"
          value={atual}
          onChange={(evento) => setAtual(evento.target.value)}
        />
        <CampoSenha
          id="senha-nova"
          rotulo="Senha nova"
          dica={`Pelo menos ${SENHA_MINIMA} caracteres.`}
          required
          minLength={SENHA_MINIMA}
          autoComplete="new-password"
          value={nova}
          onChange={(evento) => setNova(evento.target.value)}
        />
        <CampoSenha
          id="senha-confirmacao"
          rotulo="Repita a senha nova"
          required
          minLength={SENHA_MINIMA}
          autoComplete="new-password"
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
        />
        <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />
        <Botao type="submit" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Trocar senha"}
        </Botao>
      </form>

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}
      {trocada && (
        <Aviso role="status">
          <p>
            Senha alterada. Nos outros aparelhos, entre de novo com a senha
            nova.
          </p>
        </Aviso>
      )}
    </section>
  );
}
