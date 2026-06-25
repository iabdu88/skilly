import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export function SkillySvgLogo({ width = 60, className }: Props) {
  return (
    <Image
      src="/logo.png"
      alt="Skilly"
      width={width}
      height={width}  // logo.png is square (68×68)
      className={className}
      priority
    />
  );
}
