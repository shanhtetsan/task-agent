export default function Logo({ size = 28, variant = 'full' }) {
  const gradId = 'task-agent-logo-grad'

  const Mark = ({ markSize }) => (
    <svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`logo-grad-${gradId}`} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#5e87f5" />
          <stop offset="100%" stopColor="#4a6fc9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#logo-grad-${gradId})`} />
      <path
        d="M16 22 L16 10 M11 15 L16 10 L21 15"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )

  if (variant === 'mark') return <Mark markSize={size} />

  if (variant === 'large') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mark markSize={size} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Mark markSize={size} />
      <span
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}
      >
        Task Agent
      </span>
    </div>
  )
}
