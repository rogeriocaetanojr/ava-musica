// Liga e desliga o captcha (Cloudflare Turnstile) do site inteiro. Desligado
// (o padrão), as telas de entrar, criar conta, esqueci minha senha e convite
// não carregam o script da Cloudflare, não desenham o widget e não mandam
// captchaToken ao Supabase. Para religar: NEXT_PUBLIC_CAPTCHA_LIGADO=true e
// NEXT_PUBLIC_TURNSTILE_SITE_KEY no site, e o captcha ligado no Supabase
// (guias/deploy.md).

export function captchaLigadoEm(valor: string | undefined): boolean {
  return valor?.trim() === "true";
}

// Lido pelo nome completo para o Next gravar o valor no código do navegador.
export const CAPTCHA_LIGADO = captchaLigadoEm(
  process.env.NEXT_PUBLIC_CAPTCHA_LIGADO,
);

// Opções extras das chamadas do Supabase Auth: com o captcha desligado, nada
// vai junto.
export function opcoesDoCaptcha(
  token: string | null | undefined,
  ligado: boolean = CAPTCHA_LIGADO,
): { captchaToken?: string } {
  return ligado && token ? { captchaToken: token } : {};
}
