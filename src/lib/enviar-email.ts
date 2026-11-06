import "server-only";
import nodemailer from "nodemailer";
import { configuracaoSmtp, type Mensagem } from "@/lib/email";

// Envia uma mensagem. Devolve false se o SMTP não estiver configurado ou o
// envio falhar; quem chama decide o que fazer.
async function enviar(
  para: (config: { professor: string }) => string,
  mensagem: Mensagem,
): Promise<boolean> {
  const config = configuracaoSmtp();
  if (!config) return false;

  const transporte = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  try {
    await transporte.sendMail({
      from: config.remetente,
      to: para(config),
      subject: mensagem.assunto,
      text: mensagem.texto,
    });
    return true;
  } catch (erro) {
    console.error("Falha ao enviar e-mail:", erro);
    return false;
  }
}

export function enviarAoProfessor(mensagem: Mensagem): Promise<boolean> {
  return enviar((config) => config.professor, mensagem);
}

// Convite do aluno. O endereço vem do cadastro feito pelo professor.
export function enviarAoAluno(
  email: string,
  mensagem: Mensagem,
): Promise<boolean> {
  return enviar(() => email, mensagem);
}
