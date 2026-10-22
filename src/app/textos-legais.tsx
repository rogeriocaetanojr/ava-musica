// Partes comuns da política de privacidade e dos termos de uso.

export const estiloDoTexto =
  "mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:pt-2 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5";

// Os textos ainda passam por revisão jurídica antes de abrir para os alunos.
export function AvisoRascunho({ versao }: { versao: string }) {
  return (
    <p className="rounded-md bg-amber-100 p-3 text-sm text-amber-900">
      Rascunho em revisão jurídica (versão {versao}). O texto pode mudar antes
      da abertura para os alunos.
    </p>
  );
}
