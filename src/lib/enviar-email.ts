import "server-only";
import nodemailer from "nodemailer";
import { configuracaoSmtp, type Mensagem } from "@/lib/email";

// Envia uma mensagem ao professor. Devolve false se o SMTP não estiver
// configurado ou o envio falhar; quem chama decide o que fazer.
export async function enviarAoProfessor(mensagem: Mensagem): Promise<boolean> {
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
      to: config.professor,
      subject: mensagem.assunto,
      text: mensagem.texto,
    });
    return true;
  } catch (erro) {
    console.error("Falha ao enviar e-mail ao professor:", erro);
    return false;
  }
}
