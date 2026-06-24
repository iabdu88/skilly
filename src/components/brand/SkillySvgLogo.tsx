interface Props {
  width?: number;
  className?: string;
}

// viewBox 180×125: play-button icon (0–76 y) + "skilly" wordmark (76–125 y)
export function SkillySvgLogo({ width = 130, className }: Props) {
  const height = Math.round(width * (125 / 180));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Skilly"
      role="img"
    >
      <defs>
        <linearGradient id="sg-a" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#00E5CC" />
        </linearGradient>
      </defs>

      {/* Play-button triangle with blue→teal gradient */}
      <path
        d="M20 13 L20 66 Q20 76 31 76 L152 46 Q164 39 152 32 L31 2 Q20 2 20 13 Z"
        fill="url(#sg-a)"
      />

      {/* Person silhouette — currentColor adapts to light/dark mode */}
      {/* Head */}
      <circle cx="60" cy="22" r="7" fill="currentColor" />
      {/* Shoulders / suit body */}
      <path
        d="M46 33 C46 29 52 28 60 28 C68 28 74 29 74 33 L76 58 L44 58 Z"
        fill="currentColor"
      />
      {/* Tie in gradient so it's visible against currentColor body */}
      <path d="M57 28 L63 28 L62 48 L60 51 L58 48 Z" fill="url(#sg-a)" />
      {/* Collar V */}
      <path
        d="M54 30 L60 38 L66 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* "skilly" wordmark — currentColor: dark in light mode, near-white in dark mode */}
      <text
        x="90"
        y="116"
        fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="36"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        skilly
      </text>
    </svg>
  );
}
