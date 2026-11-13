export const MENSAGEM_NAO_CONVIDADO =
  "Não encontramos o seu cadastro. Crie uma conta para pedir acesso ao professor.";

// Pedido barrado pelo hook do Auth (recusado há menos de 7 dias). A mensagem
// é neutra de propósito: não revela a terceiros que o e-mail foi recusado.
export const MENSAGEM_PEDIDO_BARRADO =
  "Não foi possível pedir acesso agora. Fale com o professor.";

// Texto devolvido pelo hook antes_de_criar_usuario (migração 20261023000000).
const MENSAGEM_DO_HOOK = "Não foi possível pedir acesso agora.";

export const MENSAGEM_CAPTCHA =
  "Não foi possível confirmar que você não é um robô. Espere a verificação terminar e tente de novo.";

// Limite de tentativas do login (supabase/config.toml e painel da nuvem).
export const MENSAGEM_MUITAS_TENTATIVAS =
  "Muitas tentativas de entrar em pouco tempo. Por segurança, o acesso foi pausado: espere alguns minutos e tente de novo. Se o problema continuar, avise o professor.";

// A mesma mensagem para senha errada, e-mail sem conta e conta ainda não
// confirmada, para a tela não revelar quais e-mails estão cadastrados.
export const MENSAGEM_CREDENCIAIS_INVALIDAS =
  "E-mail ou senha incorretos. Se você acabou de criar a conta, confirme pelo link enviado ao seu e-mail.";

export const MENSAGEM_LINK_VENCIDO =
  "O link de confirmação venceu ou já foi usado. Entre com o e-mail e a senha; se a conta ainda não estiver confirmada, crie a conta de novo para receber outro link.";

// Link de "Esqueci minha senha" (supabase/templates/nova-senha.html).
export const MENSAGEM_LINK_DA_SENHA_VENCIDO =
  "O link para criar uma senha nova venceu ou já foi usado. Peça outro em Esqueci minha senha.";

export const MENSAGEM_SENHA_ALTERADA =
  "Senha alterada. Entre com o seu e-mail e a senha nova.";

export const MENSAGEM_SESSAO_EXPIRADA =
  "Sua sessão terminou depois de 2 horas sem uso. Entre de novo para continuar.";

export const MENSAGEM_BLOQUEADO =
  "Seu acesso foi pausado pelo professor. Seus dados e seu progresso continuam guardados. Fale com o professor para voltar a estudar.";

const CODIGOS_DE_LIMITE = [
  "over_email_send_rate_limit",
  "over_request_rate_limit",
];

export function ehLimiteDeTentativas(
  erro: { status?: number; code?: string } | null | undefined,
): boolean {
  return (
    !!erro &&
    (erro.status === 429 || CODIGOS_DE_LIMITE.includes(erro.code ?? ""))
  );
}

// Conta bloqueada pelo professor (ban do Supabase Auth).
export function ehBloqueado(
  erro: { code?: string } | null | undefined,
): boolean {
  return erro?.code === "user_banned";
}

// Criação da conta recusada pelo hook "Before User Created". O erro chega com
// a mensagem do hook (status 403 ao criar a conta, error_description na volta
// do Google).
export function ehPedidoBarrado(
  erro: { message?: string } | null | undefined,
): boolean {
  return !!erro?.message?.includes(MENSAGEM_DO_HOOK);
}

export function ehFalhaDoCaptcha(
  erro: { code?: string } | null | undefined,
): boolean {
  return erro?.code === "captcha_failed";
}

// Senha errada, e-mail sem conta (invalid_credentials nos dois casos) ou
// conta criada e ainda não confirmada pelo link do e-mail.
export function ehCredenciaisInvalidas(
  erro: { code?: string } | null | undefined,
): boolean {
  return (
    erro?.code === "invalid_credentials" || erro?.code === "email_not_confirmed"
  );
}
