interface Props {
  width?: number;
  className?: string;
}

// viewBox 180×125: play-button icon (0–76 y) + "skilly" wordmark (76–125 y)
// Two silhouettes: male with necktie (left, larger, drawn on top) + female with
// shoulder-length hair (right, slightly smaller, drawn behind).
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

      {/* ── Female figure (behind male) ── */}
      {/* Head + shoulder-length hair as one silhouette path */}
      <path
        d="M61 26 C61 18 74 18 74 26 C79 31 80 40 77 48 C74 53 71 55 68 55
           C65 55 62 53 59 48 C56 40 58 31 61 26 Z"
        fill="currentColor"
      />
      {/* Body */}
      <path
        d="M58 40 C58 37 62 35 68 35 C74 35 78 37 78 40 L80 65 L56 65 Z"
        fill="currentColor"
      />

      {/* ── Male figure (in front) ── */}
      {/* Head */}
      <circle cx="53" cy="21" r="8" fill="currentColor" />
      {/* Suit body */}
      <path
        d="M37 30 C37 27 44 25 53 25 C62 25 69 27 69 30 L71 65 L35 65 Z"
        fill="currentColor"
      />
      {/* Collar V — shows gradient shirt under suit */}
      <path
        d="M47 27 L53 35 L59 27"
        fill="none"
        stroke="url(#sg-a)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Necktie — gradient fill, wide enough to read at sidebar width */}
      <path
        d="M46 35 L60 35 L58 54 L53 58 L48 54 Z"
        fill="url(#sg-a)"
      />

      {/* "skilly" wordmark — currentColor: dark navy in light mode, near-white in dark mode */}
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
