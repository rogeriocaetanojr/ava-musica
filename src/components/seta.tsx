// Seta dos botões de navegação; a fina é a do convite de aluno, com traço e
// ponta um pouco diferentes.
export function Seta({
  direcao = "esquerda",
  fino = false,
}: {
  direcao?: "esquerda" | "direita";
  fino?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={fino ? "1.8" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-5 shrink-0 ${direcao === "direita" ? "-scale-x-100" : ""}`}
    >
      <path d={fino ? "M19 12H5 M12 19l-7-7 7-7" : "M19 12H5M11 6l-6 6 6 6"} />
    </svg>
  );
}
