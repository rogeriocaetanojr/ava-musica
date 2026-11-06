"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";

// Widget do Cloudflare Turnstile, carregado direto do script oficial (sem
// pacote), em modo invisível: só aparece quando a Cloudflare pede uma
// interação. O token vale uma vez só: depois de cada pedido, o formulário
// chama reiniciar() para gerar outro.

type OpcoesTurnstile = {
  sitekey: string;
  language: string;
  size: "flexible";
  appearance: "interaction-only";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "before-interactive-callback": () => void;
  "after-interactive-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (elemento: HTMLElement, opcoes: OpcoesTurnstile) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let carregamento: Promise<void> | null = null;

function carregarScript(): Promise<void> {
  carregamento ??= new Promise((resolver, rejeitar) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolver();
    script.onerror = () => {
      carregamento = null;
      rejeitar(new Error("Não foi possível carregar o captcha."));
    };
    document.head.appendChild(script);
  });
  return carregamento;
}

export type ControleDoCaptcha = { reiniciar: () => void };

export function Captcha({
  aoMudarToken,
  ref,
}: {
  aoMudarToken: (token: string | null) => void;
  ref?: Ref<ControleDoCaptcha>;
}) {
  const chave = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const elemento = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // Enquanto não há desafio, o espaço do widget fica fechado.
  const [interativo, setInterativo] = useState(false);
  // O callback muda a cada render do formulário; o widget lê o mais recente.
  const avisar = useRef(aoMudarToken);
  useEffect(() => {
    avisar.current = aoMudarToken;
  });

  useImperativeHandle(ref, () => ({
    reiniciar() {
      avisar.current(null);
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  }));

  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    carregarScript()
      .then(() => {
        if (!ativo || !elemento.current || !window.turnstile) return;
        widget.current = window.turnstile.render(elemento.current, {
          sitekey: chave,
          language: "pt-br",
          size: "flexible",
          appearance: "interaction-only",
          callback: (token) => avisar.current(token),
          "expired-callback": () => avisar.current(null),
          "error-callback": () => avisar.current(null),
          "before-interactive-callback": () => setInterativo(true),
          "after-interactive-callback": () => setInterativo(false),
        });
      })
      .catch(() => avisar.current(null));
    return () => {
      ativo = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [chave]);

  return (
    <div
      ref={elemento}
      className={interativo ? "min-h-[65px]" : "m-0! h-0 overflow-hidden"}
    />
  );
}
