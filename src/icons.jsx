// Ícones SVG próprios — stroke fino, cantos angulares, prontos para glow via CSS.
// Todos herdam currentColor; a microinteração (glow/escala/rotação) vive em .icon-btn/.nav-item.

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function BatEmblem({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 40"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M32 2c1.6 3.4 2 5.6 1.7 7.6 1.1-.5 2.3-.7 3.8-.6-.4 1.5-.4 2.7 0 4C41 10.8 46 9.4 52 10c-3 2.3-4.8 4.7-5.6 7.4C51.8 16.6 57 17.6 62 21c-8.4.8-13.7 4.3-17.4 9.6-1.8-2.2-4-3.5-6.8-3.9-1.3 3.6-3.2 7.4-5.8 11.3-2.6-3.9-4.5-7.7-5.8-11.3-2.8.4-5 1.7-6.8 3.9C15.7 25.3 10.4 21.8 2 21c5-3.4 10.2-4.4 15.6-3.6C16.8 14.7 15 12.3 12 10c6-.6 11 .8 14.5 3-.4-1.3-.4-2.5 0-4 1.5-.1 2.7.1 3.8.6C30 7.6 30.4 5.4 32 2Z" />
    </svg>
  )
}

export const IconGrid = () => (
  <svg {...base}>
    <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" />
  </svg>
)

export const IconFunnel = () => (
  <svg {...base}>
    <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4Z" />
  </svg>
)

export const IconRadar = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 12l6.5-6.5" />
    <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconTarget = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconBolt = () => (
  <svg {...base}>
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
  </svg>
)

export const IconPlus = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconCheck = () => (
  <svg {...base}>
    <path d="M4 12.5 10 18 20 6" />
  </svg>
)

export const IconRefresh = () => (
  <svg {...base}>
    <path d="M20 11a8 8 0 1 0-2.3 6.3" />
    <path d="M20 5v6h-6" />
  </svg>
)

export const IconTrash = () => (
  <svg {...base}>
    <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" />
  </svg>
)

export const IconPhone = () => (
  <svg {...base}>
    <path d="M5 3h4l1.5 5-2.2 1.8a13 13 0 0 0 5.9 5.9L16 13.5 21 15v4a2 2 0 0 1-2.2 2C10 20.3 3.7 14 3 5.2A2 2 0 0 1 5 3Z" />
  </svg>
)

export const IconAt = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />
  </svg>
)

export const IconGlobe = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.7 4 5.7 4 9s-1.3 6.3-4 9c-2.7-2.7-4-5.7-4-9s1.3-6.3 4-9Z" />
  </svg>
)

export const IconPin = () => (
  <svg {...base}>
    <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const IconEye = () => (
  <svg {...base}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconChat = () => (
  <svg {...base}>
    <path d="M4 5h16v11H9l-5 4V5Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
)

export const IconBriefcase = () => (
  <svg {...base}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13h18" />
  </svg>
)

export const IconShip = () => (
  <svg {...base}>
    <path d="M3 15l2 5h14l2-5-9-3-9 3Z" />
    <path d="M6 15V9h12v6M10 9V5h4v4M12 12v3" />
  </svg>
)

export const IconCopy = () => (
  <svg {...base}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
)

export const IconVault = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="15" rx="1.5" />
    <circle cx="12" cy="11.5" r="3.5" />
    <path d="M12 9.2v2.3l1.6 1.6M6 19v2M18 19v2" />
  </svg>
)

export const IconArchive = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
  </svg>
)

export const IconDownload = () => (
  <svg {...base}>
    <path d="M12 3v11M7.5 9.5 12 14l4.5-4.5M4 17v3h16v-3" />
  </svg>
)

export const IconUpload = () => (
  <svg {...base}>
    <path d="M12 14V3M7.5 7.5 12 3l4.5 4.5M4 17v3h16v-3" />
  </svg>
)

export const IconBook = () => (
  <svg {...base}>
    <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Z" />
    <path d="M4 19a2 2 0 0 1 2-2h14M9 7h7M9 10.5h5" />
  </svg>
)

export const IconTrophy = () => (
  <svg {...base}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M10 18h4" />
  </svg>
)
