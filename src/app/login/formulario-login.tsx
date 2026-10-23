"use client";

import { useRef, useState } from "react";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
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
    <div className="space-y-5">
      {etapa.tipo === "email" ? (
        <>
          <Botao variante="secundario" onClick={entrarComGoogle}>
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full border border-linha text-sm font-extrabold"
            >
              G
            </span>
            Entrar com Google
          </Botao>
          <div
            aria-hidden="true"
            className="flex items-center gap-4 text-sm text-texto-secundario"
          >
            <span className="h-px flex-1 bg-linha" />
            ou
            <span className="h-px flex-1 bg-linha" />
          </div>
          <form onSubmit={pedirCodigo} className="space-y-5">
            <Campo
              id="email"
              rotulo="Seu e-mail"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="nome@email.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
            <Botao type="submit" disabled={ocupado}>
              {ocupado ? "Enviando…" : "Receber código de acesso"}
            </Botao>
          </form>
        </>
      ) : (
        <div className="space-y-5">
          <h2 className="font-titulo text-2xl text-texto">Digite o código</h2>
          <Aviso role="status">
            <p>{etapa.aviso}</p>
          </Aviso>
          <form
            onSubmit={(evento) => confirmarCodigo(evento, etapa.email)}
            className="space-y-5"
          >
            <Campo
              id="codigo"
              rotulo="Código"
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
              className="text-center text-2xl tracking-[0.5em]"
            />
            <Botao type="submit" disabled={ocupado}>
              {ocupado ? "Confirmando…" : "Confirmar"}
            </Botao>
          </form>
          <div className="flex justify-between gap-3 text-sm font-bold text-bordo">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => enviarCodigo(etapa.email, true)}
              className="min-h-12 underline disabled:opacity-60"
            >
              Reenviar código
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={usarOutroEmail}
              className="min-h-12 underline disabled:opacity-60"
            >
              Usar outro e-mail
            </button>
          </div>
        </div>
      )}

      {/* Fica nas duas etapas: o reenvio do código também passa pelo captcha. */}
      <Captcha ref={captcha} aoMudarToken={setTokenCaptcha} />

      {erro && (
        <Aviso role="alert">
          <p>{erro}</p>
        </Aviso>
      )}

      {/* No celular, a versão curta deste aviso fica no rodapé da página. */}
      {etapa.tipo === "email" && (
        <div className="hidden md:block">
          <Aviso>
            <p>
              Acesso só por convite do professor. Para menores de 12 anos, o
              convite vai primeiro ao responsável.
            </p>
          </Aviso>
        </div>
      )}
    </div>
  );
}
