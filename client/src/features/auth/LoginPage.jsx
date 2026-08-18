import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    try {
      const user = await login(email, password)
      if (user.role === 'supervisor' || user.role === 'admin') {
        navigate('/supervisor', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch {}
  }

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div className="login-brand">
          <div className="login-brand-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="8" fill="#f5931d" opacity="0.85"/>
              <path d="M7 5 L12 19 L17 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="login-brand-name">Victory Connect</h1>
          <p className="login-brand-sub">Agent Portal · Secure Digital Onboarding</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4" style={{ marginBottom: '1.25rem' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="agent@fieldlink.demo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', minHeight: 'auto', padding: '6px', borderRadius: '6px' }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? (
              <><span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
              <span>Signing in...</span></>
            ) : 'Sign In Securely'}
          </button>
        </form>

        <div className="divider" style={{ margin: '1.5rem 0' }} />

        <div style={{ textAlign: 'center' }}>
          <p className="text-xs text-muted" style={{ marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Credentials</p>
          <div className="stack-sm" style={{ textAlign: 'left', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
            {[
              { label: 'Field Agent', email: 'karabo@victory.demo', pw: '20260818' },
              { label: 'Supervisor', email: 'reuben@victory.demo', pw: '20260817' },
            ].map(d => (
              <button
                key={d.email}
                type="button"
                className="btn-ghost"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '6px 8px', minHeight: 'auto', borderRadius: '6px', width: '100%' }}
                onClick={() => { setEmail(d.email); setPassword(d.pw) }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted text-center" style={{ marginTop: '1.5rem' }}>
          🔒 All data is synthetic and for demonstration only
        </p>
      </div>
    </div>
  )
}
