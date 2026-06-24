import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export function SkillySvgLogo({ width = 150, className }: Props) {
  const height = Math.round(width * (60 / 150));
  return (
    <Image
      src="/logo.png"
      alt="Skilly"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
