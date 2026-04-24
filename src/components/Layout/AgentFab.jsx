import { Sparkles } from 'lucide-react'

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
        boxShadow: '0 8px 24px rgba(139,135,255,0.4)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        zIndex: 50,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.06)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,135,255,0.55)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,135,255,0.4)'
      }}
      aria-label="Open AI tutor"
    >
      <Sparkles size={22} color="white" strokeWidth={1.8} />
    </button>
  )
}
