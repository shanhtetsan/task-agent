import Logo from '../Logo'

export default function AgentFab({ onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'linear-gradient(135deg, var(--accent), #6361d1)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 5px 14px rgba(94,135,245,0.24)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        zIndex: 50,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.06)'
        e.currentTarget.style.boxShadow = '0 8px 19px rgba(94,135,245,0.32)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 5px 14px rgba(94,135,245,0.24)'
      }}
      aria-label="Open Task Copilot"
    >
      <Logo variant="mark" size={32} />
    </button>
  )
}
