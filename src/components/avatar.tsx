// Avatar redondo: a foto de perfil, quando houver, ou a silhueta de uma
// pessoa. O tamanho e as cores vêm em className (ex.: "size-12 bg-bordo
// text-sobre-bordo"). É decorativo: o nome sempre aparece ao lado ou no
// rótulo do botão.
export function Avatar({
  foto,
  className = "",
}: {
  foto?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {foto ? (
        // Link assinado do Storage, que muda a cada página: o next/image não ajuda aqui.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="size-full object-cover" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="size-[60%]"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4.2" />
          <path d="M3.5 21c0-4.4 3.8-7.5 8.5-7.5s8.5 3.1 8.5 7.5z" />
        </svg>
      )}
    </span>
  );
}
