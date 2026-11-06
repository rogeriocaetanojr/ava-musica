"use client";

import { useState } from "react";
import { Botao } from "@/components/botao";
import { CampoSenha } from "@/components/campo-senha";
import { SENHA_MINIMA } from "@/lib/senha";
import { Captcha } from "../../login/captcha";

// Envia a senha para /convite/<código>/definir, que grava a senha e já abre
// a sessão (por isso o captcha, exigido no login por senha).
export function FormularioSenha({
  codigo,
  email,
}: {
  codigo: string;
  email: string;
}) {
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={`/convite/${codigo}/definir`}
      method="post"
      onSubmit={() => setEnviando(true)}
      className="space-y-5"
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
        rotulo="Crie a sua senha"
        dica={`Pelo menos ${SENHA_MINIMA} caracteres. Você vai usar essa senha para entrar.`}
        required
        minLength={SENHA_MINIMA}
        autoComplete="new-password"
      />
      <input type="hidden" name="captcha" value={tokenCaptcha ?? ""} />
      <Captcha aoMudarToken={setTokenCaptcha} />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar senha e entrar"}
      </Botao>
    </form>
  );
}
