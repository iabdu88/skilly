import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export function SkillySvgLogo({ width = 150, className }: Props) {
  // logo.png natural size is 255×86 → aspect ratio 86/255
  const height = Math.round(width * (86 / 255));
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
