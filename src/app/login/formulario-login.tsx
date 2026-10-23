"use client";

import { useRef, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { Captcha, type ControleDoCaptcha } from "./captcha";
import {
  ehBloqueado,
  ehCodigoInvalido,
  ehFalhaDoCaptcha,
  ehLimiteDeTentativas,
  ehPedidoBarrado,
  MENSAGEM_BLOQUEADO,
  MENSAGEM_CAPTCHA,
  MENSAGEM_CODIGO_INVALIDO,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_PEDIDO_BARRADO,
} from "./mensagens";

type Etapa =
  { tipo: "email" } | { tipo: "codigo"; email: string; aviso: string };

function urlDeRetorno(): string {
  return `${window.location.origin}/auth/callback`;
}

// A mesma mensagem para quem tem e para quem não tem conta, para a tela não
// revelar quais e-mails estão cadastrados.
function avisoDeEnvio(email: string, reenvio: boolean): string {
  return `${reenvio ? "Enviamos um novo código" : "Enviamos um código de 6 dígitos"} para ${email}. Ele vale por 10 minutos. Se não chegar, olhe a caixa de spam.`;
}

export function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "email" });
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null);
  const captcha = useRef<ControleDoCaptcha>(null);

  async function entrarComGoogle() {
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlDeRetorno() },
    });
    if (error) {
      setErro(
        ehLimiteDeTentativas(error)
          ? MENSAGEM_MUITAS_TENTATIVAS
          : "Não foi possível entrar com o Google. Tente pelo e-mail.",
      );
    }
  }

  // Quem não tem conta ganha uma nova, pendente: o pedido só vale depois que
  // a pessoa confirma o código (ver /auth/concluir).
  async function enviarCodigo(endereco: string, reenvio: boolean) {
    setOcupado(true);
    setErro(null);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({
      email: endereco,
      options: {
        shouldCreateUser: true,
        captchaToken: tokenCaptcha ?? undefined,
      },
    });
    // O token do captcha vale uma vez só.
    captcha.current?.reiniciar();
    setOcupado(false);

    if (!error) {
      setCodigo("");
      setEtapa({
        tipo: "codigo",
        email: endereco,
        aviso: avisoDeEnvio(endereco, reenvio),
      });
    } else if (ehLimiteDeTentativas(error)) {
      setErro(MENSAGEM_MUITAS_TENTATIVAS);
    } else if (ehBloqueado(error)) {
      setErro(MENSAGEM_BLOQUEADO);
    } else if (ehPedidoBarrado(error)) {
      setErro(MENSAGEM_PEDIDO_BARRADO);
    } else if (ehFalhaDoCaptcha(error)) {
      setErro(MENSAGEM_CAPTCHA);
    } else {
      setErro("Não foi possível enviar o código. Tente de novo.");
    }
  }

  async function pedirCodigo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await enviarCodigo(email.trim(), false);
  }

  async function confirmarCodigo(
    evento: React.FormEvent<HTMLFormElement>,
    endereco: string,
  ) {
    evento.preventDefault();
    setOcupado(true);
    setErro(null);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.verifyOtp({
      email: endereco,
      token: codigo.trim(),
      type: "email",
    });

    if (!error) {
      // Navegação completa até a rota do servidor, que lê a sessão nova nos
      // cookies (o router do Next não abre rotas de API).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/auth/concluir");
      return;
    }
    setOcupado(false);
    if (ehLimiteDeTentativas(error)) {
      setErro(MENSAGEM_MUITAS_TENTATIVAS);
    } else if (ehBloqueado(error)) {
      setErro(MENSAGEM_BLOQUEADO);
    } else if (ehCodigoInvalido(error)) {
      setErro(MENSAGEM_CODIGO_INVALIDO);
    } else {
      setErro("Não foi possível confirmar o código. Tente de novo.");
    }
  }

  function usarOutroEmail() {
    setEtapa({ tipo: "email" });
    setCodigo("");
    setErro(null);
  }

  return (
    <div className="space-y-6">
      {etapa.tipo === "email" ? (
        <form onSubmit={pedirCodigo} className="space-y-3">
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
            disabled={ocupado}
            className="w-full rounded-md border border-current px-4 py-3 font-medium disabled:opacity-60"
          >
            {ocupado ? "Enviando…" : "Entrar"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Digite o código</h2>
          <p
            role="status"
            className="rounded-md bg-green-100 p-3 text-green-800"
          >
            {etapa.aviso}
          </p>
          <form
            onSubmit={(evento) => confirmarCodigo(evento, etapa.email)}
            className="space-y-3"
          >
            <label htmlFor="codigo" className="block text-sm font-medium">
              Código
            </label>
            <input
              id="codigo"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              title="Os 6 números enviados por e-mail"
              value={codigo}
              onChange={(evento) =>
                setCodigo(evento.target.value.replace(/\D/g, ""))
              }
              className="w-full rounded-md border border-current bg-transparent px-3 py-3 text-center text-2xl tracking-[0.5em]"
            />
            <button
              type="submit"
              disabled={ocupado}
              className="w-full rounded-md border border-current px-4 py-3 font-medium disabled:opacity-60"
            >
              {ocupado ? "Confirmando…" : "Confirmar"}
            </button>
          </form>
          <div className="flex justify-between gap-3 text-sm">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => enviarCodigo(etapa.email, true)}
              className="underline disabled:opacity-60"
            >
              Reenviar código
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={usarOutroEmail}
              className="underline disabled:opacity-60"
            >
              Usar outro e-mail
            </button>
          </div>
        </div>
      )}

      {/* Fica nas duas etapas: o reenvio do código também passa pelo captcha. */}
      <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />

      {etapa.tipo === "email" && (
        <>
          <p className="text-center text-sm">ou</p>
          <button
            type="button"
            onClick={entrarComGoogle}
            className="w-full rounded-md border border-current px-4 py-3 font-medium"
          >
            Entrar com Google
          </button>
        </>
      )}

      {erro && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {erro}
        </p>
      )}
    </div>
  );
}
