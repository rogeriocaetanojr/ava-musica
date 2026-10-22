import { NOME_DO_AVA } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">{NOME_DO_AVA}</h1>
      <p className="max-w-md text-lg">
        Cursos de música organizados em módulos e aulas, para estudar e
        acompanhar seu progresso num só lugar.
      </p>
    </main>
  );
}
