import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Marca de Fishin't. El PNG es el mismo arte del ícono de la app (`icon-192`),
 * que viene a sangre completa con su propio fondo hueso (#F5F5EF), así que
 * ocupa TODO el círculo en vez de ir centrado al 75%: si se dejara más chico se
 * vería el borde del cuadrado dentro del círculo. El recorte solo se come las
 * esquinas vacías — el aro rojo abarca ~75% del lienzo y queda holgado.
 *
 * El color de fondo inline se mantiene (ahora igualado al del propio arte) para
 * que no se vuelva gris en modo oscuro mientras la imagen carga. No reemplazar
 * el PNG por SVG ni quitar ese fondo.
 */
export function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: "#F5F5EF" }}
    >
      <Image
        src="/logo.png"
        alt="Fishin't logo"
        width={size}
        height={size}
        priority
      />
    </div>
  );
}
