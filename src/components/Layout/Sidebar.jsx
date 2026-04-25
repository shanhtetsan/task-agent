import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, Sun, CheckSquare, RotateCcw } from 'lucide-react'
import Logo from '../Logo'

export default function Sidebar({ collapsed = false, onToggle }) {
  const navItemBase = `
    flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mx-3 px-3 py-2.5 text-sm transition-colors duration-150 relative cursor-pointer rounded-lg
  `
  const activeClass = `bg-[var(--surface)] text-[var(--text)] border border-[var(--line)]`
  const inactiveClass = `text-[var(--dim)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.02)] border border-transparent`

  function handleReset() {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <aside
      style={{
        width: collapsed ? 72 : 236,
        minWidth: collapsed ? 72 : 236,
        background: '#161616',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-4 py-4`}>
        <button
          onClick={onToggle}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
        {collapsed ? <Logo variant="mark" size={20} /> : <Logo variant="full" size={24} />}
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 pt-1 gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            navItemBase + (isActive ? activeClass : inactiveClass)
          }
        >
          <Sun size={15} strokeWidth={1.8} />
          {!collapsed && <span style={{ fontWeight: 450, fontSize: 13.5 }}>Today</span>}
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            navItemBase + (isActive ? activeClass : inactiveClass)
          }
        >
          <CheckSquare size={15} strokeWidth={1.8} />
          {!collapsed && <span style={{ fontWeight: 450, fontSize: 13.5 }}>Tasks</span>}
        </NavLink>
      </nav>

      {/* Footer */}
      <div
        className={collapsed ? 'px-3 py-4' : 'px-5 py-5'}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {!collapsed && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10.5,
              color: 'var(--faint)',
              letterSpacing: '0.3px',
            }}
          >
          Task Agent · v0.1
          </span>
        )}
        <button
          onClick={handleReset}
          style={{
            background: collapsed ? 'var(--surface-2)' : 'transparent',
            border: collapsed ? '1px solid var(--line)' : 'none',
            width: collapsed ? 36 : 'auto',
            height: collapsed ? 30 : 'auto',
            borderRadius: collapsed ? 8 : 0,
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: 'var(--faint)',
            textDecoration: collapsed ? 'none' : 'underline',
            textAlign: collapsed ? 'center' : 'left',
            padding: 0,
            transition: 'color 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={collapsed ? 'Reset demo data' : undefined}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--dim)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--faint)')}
        >
          {collapsed ? <RotateCcw size={12} /> : 'Reset demo data'}
        </button>
      </div>
    </aside>
  )
}
