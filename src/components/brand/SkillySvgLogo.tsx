interface Props {
  width?: number;
  className?: string;
}

// Inline SVG so the page's loaded Plus Jakarta Sans font applies to the text.
// viewBox is 160×40; pass `width` to scale proportionally.
export function SkillySvgLogo({ width = 130, className }: Props) {
  const height = Math.round(width * (40 / 160));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Skilly"
      role="img"
    >
      <path
        d="M18 6L6 6L6 34L18 34"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="80"
        y="20"
        fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="21"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="central"
      >
        skilly
      </text>
      <path
        d="M142 6L154 6L154 34L142 34"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
