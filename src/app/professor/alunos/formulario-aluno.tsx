"use client";

import Link from "next/link";
import {
  type FormEvent,
  useActionState,
  useState,
  useSyncExternalStore,
} from "react";
import { Aviso } from "@/components/aviso";
import { classesDoBotao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { ehDataValida, hojeNoBrasil, precisaDeAceite } from "@/lib/idade";
import { cadastrarAluno, type EstadoCadastro } from "./acoes";
import { BotaoCopiar } from "./botao-copiar";

type Curso = { id: string; titulo: string; publicado: boolean };

type NomeDoCampo =
  | "nome"
  | "data_nascimento"
  | "email"
  | "responsavel_nome"
  | "responsavel_email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Icone({ caminho }: { caminho: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={caminho} />
    </svg>
  );
}

// Até 767 px vale o layout de celular. No servidor conta como computador; o
// bloco do responsável só aparece depois de digitada a data, já no navegador.
const CELULAR = "(max-width: 767px)";

function assinarCelular(avisar: () => void) {
  const consulta = window.matchMedia(CELULAR);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

// Folga para o campo focado não ficar atrás do rodapé fixo do celular.
const FOLGA_DO_RODAPE = "max-md:scroll-mb-48";

// Campo com a mensagem de erro logo abaixo, ligada por aria-describedby.
function CampoComErro({
  nome,
  erro,
  ...resto
}: Parameters<typeof Campo>[0] & { nome: NomeDoCampo; erro?: string }) {
  const idDoErro = `${resto.id}-erro`;
  return (
    <div className="space-y-1">
      <Campo
        className={FOLGA_DO_RODAPE}
        name={nome}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idDoErro : undefined}
        {...resto}
      />
      {erro && (
        <p id={idDoErro} className="text-sm font-bold text-destaque">
          {erro}
        </p>
      )}
    </div>
  );
}

// Campos controlados para não se perderem quando o servidor recusa. A
// conferência na tela só adianta os erros mais comuns e decide se o bloco do
// responsável aparece: quem valida de verdade, inclusive a idade, é o servidor.
export function FormularioAluno({ cursos }: { cursos: Curso[] }) {
  const hoje = hojeNoBrasil();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");
  const [erros, setErros] = useState<Partial<Record<NomeDoCampo, string>>>({});

  const [estado, enviar, enviando] = useActionState(
    async (anterior: EstadoCadastro, formData: FormData) => {
      const resultado = await cadastrarAluno(anterior, formData);
      if (!resultado.erro) {
        setNome("");
        setEmail("");
        setNascimento("");
        setEscolhidos([]);
        setResponsavelNome("");
        setResponsavelEmail("");
      }
      return resultado;
    },
    {},
  );

  const celular = useSyncExternalStore(
    assinarCelular,
    () => window.matchMedia(CELULAR).matches,
    () => false,
  );

  const menor =
    ehDataValida(nascimento) &&
    nascimento <= hoje &&
    precisaDeAceite(nascimento, hoje);

  function conferir(evento: FormEvent<HTMLFormElement>) {
    const novos: Partial<Record<NomeDoCampo, string>> = {};
    if (!nome.trim()) novos.nome = "Informe o nome do aluno.";
    if (!ehDataValida(nascimento))
      novos.data_nascimento = "Informe a data de nascimento.";
    else if (nascimento > hoje)
      novos.data_nascimento = "A data de nascimento não pode estar no futuro.";
    if (!EMAIL.test(email.trim()))
      novos.email = "Informe um e-mail válido para o aluno.";
    if (menor) {
      if (!responsavelNome.trim())
        novos.responsavel_nome = "Informe o nome do responsável.";
      if (!EMAIL.test(responsavelEmail.trim()))
        novos.responsavel_email =
          "Informe um e-mail válido para o responsável.";
    }
    setErros(novos);

    const primeiro = Object.keys(novos)[0];
    if (primeiro) {
      evento.preventDefault();
      evento.currentTarget
        .querySelector<HTMLInputElement>(`[name="${primeiro}"]`)
        ?.focus();
    }
  }

  // No computador o bloco fica depois dos cursos; no celular, logo abaixo da
  // data de nascimento, que é o que o faz aparecer.
  const blocoDoResponsavel = menor && (
    <fieldset className="space-y-4 rounded-2xl bg-bloco p-5 text-texto-sobre-bloco">
      <legend className="sr-only">Responsável</legend>
      <div className="flex gap-3">
        <Icone caminho="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
        <div className="space-y-1">
          <p className="font-bold">Aluno com menos de 12 anos</p>
          <p className="text-sm">
            A conta só é liberada depois que o responsável autorizar pelo link
            que aparece ao enviar.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CampoComErro
          id="responsavel-nome"
          nome="responsavel_nome"
          rotulo="Nome do responsável"
          autoComplete="off"
          required
          maxLength={120}
          value={responsavelNome}
          onChange={(e) => setResponsavelNome(e.target.value)}
          erro={erros.responsavel_nome}
        />
        <CampoComErro
          id="responsavel-email"
          nome="responsavel_email"
          rotulo="E-mail do responsável"
          type="email"
          autoComplete="off"
          required
          maxLength={254}
          value={responsavelEmail}
          onChange={(e) => setResponsavelEmail(e.target.value)}
          erro={erros.responsavel_email}
        />
      </div>
    </fieldset>
  );

  return (
    <form action={enviar} onSubmit={conferir} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-bold text-destaque">
          Dados do aluno
        </legend>
        <div className="grid gap-4 md:grid-cols-3">
          <CampoComErro
            id="aluno-nome"
            nome="nome"
            rotulo="Nome completo"
            autoComplete="off"
            required
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            erro={erros.nome}
          />
          <CampoComErro
            id="aluno-nascimento"
            nome="data_nascimento"
            rotulo="Data de nascimento"
            type="date"
            required
            max={hoje}
            value={nascimento}
            onChange={(e) => setNascimento(e.target.value)}
            inputMode="numeric"
            erro={erros.data_nascimento}
          />
          {celular && blocoDoResponsavel}
          <CampoComErro
            id="aluno-email"
            nome="email"
            rotulo="E-mail do aluno"
            type="email"
            autoComplete="off"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-texto">
          Matricular nos cursos
        </legend>
        {cursos.length === 0 ? (
          <p className="text-sm text-texto-secundario">
            Nenhum curso criado ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {cursos.map((curso) => (
              <label
                key={curso.id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-linha bg-superficie px-4 py-3 font-bold text-texto hover:border-borda-campo has-checked:border-destaque has-checked:bg-destaque/10"
              >
                <input
                  type="checkbox"
                  name="cursos"
                  value={curso.id}
                  checked={escolhidos.includes(curso.id)}
                  onChange={(e) =>
                    setEscolhidos((atual) =>
                      e.target.checked
                        ? [...atual, curso.id]
                        : atual.filter((id) => id !== curso.id),
                    )
                  }
                  className="size-5 shrink-0 accent-destaque"
                />
                <span className="break-words">
                  {curso.titulo}
                  {!curso.publicado && (
                    <span className="font-normal text-texto-secundario">
                      {" "}
                      (rascunho)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <p aria-live="polite" className="sr-only">
        {menor
          ? "Aluno com menos de 12 anos: preencha os dados do responsável."
          : ""}
      </p>
      {!celular && blocoDoResponsavel}

      {estado.erro && <Aviso role="alert">{estado.erro}</Aviso>}
      {estado.sucesso && (
        <div role="status" className="space-y-2 text-sm text-sucesso">
          <p>{estado.sucesso}</p>
          {estado.linkAceite && (
            <BotaoCopiar
              texto={estado.linkAceite}
              rotulo="Link de autorização do responsável"
            />
          )}
        </div>
      )}

      <div
        aria-hidden="true"
        className="h-[calc(9rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <div className="flex gap-2 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-10 max-md:flex-col max-md:border-t max-md:border-linha max-md:bg-superficie max-md:px-4 max-md:pt-2 max-md:pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex-row md:justify-end md:gap-3">
        <Link
          href="/professor/alunos"
          className={classesDoBotao(
            "secundario",
            "md:w-auto max-md:min-h-12 max-md:border-0 max-md:bg-transparent max-md:text-destaque max-md:underline",
          )}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className={classesDoBotao("primario", "md:w-auto")}
        >
          <span className="text-amarelo">
            <Icone caminho="M22 2L11 13 M22 2l-7 20-4-9-9-4z" />
          </span>
          {enviando
            ? "Salvando…"
            : menor
              ? "Criar conta e gerar link"
              : "Enviar convite"}
        </button>
      </div>
    </form>
  );
}
