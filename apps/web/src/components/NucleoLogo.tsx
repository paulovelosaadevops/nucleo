export function NucleoLogo() {
  return (
    <div className="nucleoLogo" aria-label="Logo NÚCLEO">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nucleoStroke" x1="14" y1="12" x2="50" y2="52">
            <stop stopColor="#E0F7FF" />
            <stop offset="0.48" stopColor="#4DBBFF" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="nucleoFill" x1="8" y1="4" x2="56" y2="60">
            <stop stopColor="rgba(255,255,255,0.14)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.03)" />
          </linearGradient>
        </defs>

        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="20"
          fill="url(#nucleoFill)"
          stroke="rgba(255,255,255,0.12)"
        />

        <path
          d="M19 44V20C19 17.8 21.8 16.9 23.1 18.7L41.1 43.3C42.4 45.1 45 44.2 45 42V18"
          stroke="url(#nucleoStroke)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M19 44V20C19 17.8 21.8 16.9 23.1 18.7L41.1 43.3C42.4 45.1 45 44.2 45 42V18"
          stroke="rgba(224,247,255,0.45)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="45" cy="18" r="2.4" fill="#E0F7FF" />
        <circle cx="19" cy="44" r="2.4" fill="#4DBBFF" />
      </svg>
    </div>
  );
}
