import { EditarNome } from "@/components/editar-nome";
import { FotoDePerfil } from "@/components/foto-de-perfil";
import type { SessaoComNome } from "@/lib/auth";
import { fotoDe } from "@/lib/fotos";
import type { EstadoDoMeuNome } from "@/lib/meu-nome";

// Card compacto do Meu perfil, igual para aluno e professor: a foto com o
// botão de editar, o nome (editável) e o e-mail. O Sair fica no menu da
// conta do cabeçalho.
export async function CartaoDoPerfil({
  sessao,
  cores,
  acaoDoNome,
}: {
  sessao: SessaoComNome;
  cores: string;
  acaoDoNome: (
    estado: EstadoDoMeuNome,
    formData: FormData,
  ) => Promise<EstadoDoMeuNome>;
}) {
  const foto = await fotoDe(sessao.id);
  return (
    <section
      aria-label="Dados da conta"
      className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-linha bg-superficie p-4 text-center md:p-5"
    >
      <FotoDePerfil id={sessao.id} foto={foto} cores={cores} />
      <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
        <EditarNome nome={sessao.nome} acao={acaoDoNome} />
        <p className="text-sm break-all text-texto-secundario">
          {sessao.email}
        </p>
      </div>
    </section>
  );
}
