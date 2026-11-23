// Variáveis de ambiente do site, conferidas no build de produção
// (next.config.ts). Sem uma delas, o build para dizendo qual falta, em vez de
// o site subir e quebrar só quando alguém usa a parte que depende dela.
// Os nomes e o que cada uma faz estão no .env.example.

type Regra = {
  nome: string;
  // Por que é necessária, para a mensagem de erro.
  para: string;
  formato?: "url" | "porta" | "email";
};

export const OBRIGATORIAS: readonly Regra[] = [
  {
    nome: "NEXT_PUBLIC_SUPABASE_URL",
    para: "falar com o Supabase",
    formato: "url",
  },
  { nome: "NEXT_PUBLIC_SUPABASE_ANON_KEY", para: "falar com o Supabase" },
  {
    nome: "SUPABASE_SERVICE_ROLE_KEY",
    para: "convidar, bloquear e excluir alunos",
  },
  {
    nome: "NEXT_PUBLIC_SITE_URL",
    para: "os links dos convites e do aceite",
    formato: "url",
  },
  {
    nome: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    para: "o captcha do login, de Criar conta e do convite",
  },
  { nome: "SMTP_HOST", para: "enviar os e-mails" },
  { nome: "SMTP_PORT", para: "enviar os e-mails", formato: "porta" },
  { nome: "SMTP_REMETENTE", para: "enviar os e-mails" },
  {
    nome: "EMAIL_PROFESSOR",
    para: "o aviso de pedido de acesso",
    formato: "email",
  },
];

function formatoValido(valor: string, formato: Regra["formato"]): boolean {
  switch (formato) {
    case "url":
      try {
        return ["http:", "https:"].includes(new URL(valor).protocol);
      } catch {
        return false;
      }
    case "porta": {
      const porta = Number(valor);
      return Number.isInteger(porta) && porta > 0 && porta < 65536;
    }
    case "email":
      return /^[^\s@]+@[^\s@]+$/.test(valor);
    default:
      return true;
  }
}

// Devolve um problema por linha; lista vazia quando está tudo certo.
export function problemasDoAmbiente(
  env: Record<string, string | undefined>,
): string[] {
  const problemas: string[] = [];
  for (const regra of OBRIGATORIAS) {
    const valor = env[regra.nome]?.trim();
    if (!valor)
      problemas.push(`${regra.nome} não está definida (${regra.para}).`);
    else if (!formatoValido(valor, regra.formato))
      problemas.push(
        `${regra.nome} está em formato inválido (esperado: ${regra.formato}).`,
      );
  }
  // Usuário e senha do SMTP vêm juntos (Resend) ou nenhum dos dois (Mailpit).
  if (!env.SMTP_USER?.trim() !== !env.SMTP_PASS?.trim())
    problemas.push(
      "SMTP_USER e SMTP_PASS precisam estar as duas definidas ou as duas vazias.",
    );
  return problemas;
}

export function validarAmbiente(
  env: Record<string, string | undefined> = process.env,
): void {
  const problemas = problemasDoAmbiente(env);
  if (problemas.length > 0)
    throw new Error(
      `Variáveis de ambiente com problema (ver .env.example e guias/deploy.md):\n- ${problemas.join("\n- ")}`,
    );
}
