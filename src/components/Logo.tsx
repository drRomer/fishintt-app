import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: "#ffffff" }}
    >
      <Image
        src="/logo.png"
        alt="Fishin't logo"
        width={Math.floor(size * 0.75)}
        height={Math.floor(size * 0.75)}
        priority
      />
    </div>
  );
}
