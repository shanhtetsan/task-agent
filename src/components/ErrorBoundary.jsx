import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected UI error' }
  }

  componentDidCatch(error) {
    // Keep this local-first app resilient in production.
    console.error('UI crash caught by ErrorBoundary:', error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 20,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22 }}>Something went wrong.</div>
            <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.5 }}>
              The app caught a render error and prevented a full blank screen.
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--faint)' }}>
              {this.state.errorMessage}
            </div>
            <button
              onClick={this.handleReload}
              style={{
                marginTop: 4,
                justifySelf: 'start',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
