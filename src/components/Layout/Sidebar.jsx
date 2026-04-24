import { NavLink } from 'react-router-dom'
import { Sun, CheckSquare } from 'lucide-react'

export default function Sidebar() {
  const navItemBase = `
    flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-150 relative cursor-pointer border-l-2
  `
  const activeClass = `border-l-[var(--accent)] bg-[var(--surface)] text-[var(--text)]`
  const inactiveClass = `border-l-transparent text-[var(--dim)] hover:text-[var(--text)] hover:bg-[var(--surface)]`

  function handleReset() {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#0b0d11',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 2,
            background: 'var(--accent)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 500,
            fontSize: 18,
            color: 'var(--text)',
            letterSpacing: '-0.3px',
          }}
        >
          Planner
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 pt-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            navItemBase + (isActive ? activeClass : inactiveClass)
          }
        >
          <Sun size={15} strokeWidth={1.8} />
          <span style={{ fontWeight: 450, fontSize: 13.5 }}>Today</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            navItemBase + (isActive ? activeClass : inactiveClass)
          }
        >
          <CheckSquare size={15} strokeWidth={1.8} />
          <span style={{ fontWeight: 450, fontSize: 13.5 }}>Tasks</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-5"
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10.5,
            color: 'var(--faint)',
            letterSpacing: '0.3px',
          }}
        >
          CUNY · v0.1
        </span>
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: 'var(--faint)',
            textDecoration: 'underline',
            textAlign: 'left',
            padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--dim)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--faint)')}
        >
          Reset demo data
        </button>
      </div>
    </aside>
  )
}
