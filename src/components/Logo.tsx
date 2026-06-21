import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  monochrome?: "navy" | "white";
}

export function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Fishin't logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
