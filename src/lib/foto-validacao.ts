// Mesmos limites do bucket "fotos-de-perfil", conferidos antes do envio para
// dar a mensagem certa; o Storage confere de novo.
export const TAMANHO_MAXIMO_DA_FOTO = 2 * 1024 * 1024;
export const TIPOS_DA_FOTO = ["image/jpeg", "image/png", "image/webp"];

export function validarFoto(arquivo: {
  type: string;
  size: number;
}): string | null {
  if (!TIPOS_DA_FOTO.includes(arquivo.type))
    return "Escolha uma imagem JPG, PNG ou WebP.";
  if (arquivo.size > TAMANHO_MAXIMO_DA_FOTO)
    return "A foto pode ter no máximo 2 MB.";
  return null;
}
