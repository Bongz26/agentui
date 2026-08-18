import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { useWizardStore } from '../../store/wizardStore.js'
import { SaveIndicator } from '../common/index.jsx'

const VictoryLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="10" r="7" fill="#f5931d" opacity="0.85"/>
    <path d="M7 6 L12 18 L17 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const ListIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/>
    <circle cx="3" cy="18" r="1" fill="currentColor"/>
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const UserIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export default function AppLayout({ children }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const saveStatus = useWizardStore(s => s.saveStatus)
  const isOnline = useWizardStore(s => s.isOnline)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Top header */}
      <header className="top-header">
        <div className="top-header-brand">
          <div className="brand-logo">
            <VictoryLogo />
          </div>
          <div>
            <div className="brand-name">Victory Connect</div>
            <div className="brand-tagline">Agent Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="save-indicator offline" style={{ fontSize: '11px' }}>
              <span>⚡</span><span>Offline</span>
            </span>
          )}
          <SaveIndicator status={saveStatus} />
        </div>
      </header>

      {/* Page content */}
      <main className="page-wrapper fade-in">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (<><HomeIcon active={isActive}/><span>Home</span></>)}
        </NavLink>

        <NavLink to="/applications" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (<><ListIcon active={isActive}/><span>Applications</span></>)}
        </NavLink>

        {/* FAB — New Application */}
        <div className="mobile-nav-fab">
          <button
            className="fab-btn"
            onClick={() => navigate('/applications/new')}
            aria-label="New Application"
            title="Start New Application"
          >
            <PlusIcon />
          </button>
        </div>

        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (<><UserIcon active={isActive}/><span>Profile</span></>)}
        </NavLink>

        {/* Supervisor link for privileged users */}
        {(user?.role === 'supervisor' || user?.role === 'admin') && (
          <NavLink to="/supervisor" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            {() => (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path strokeLinecap="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
                </svg>
                <span>Reports</span>
              </>
            )}
          </NavLink>
        )}
      </nav>
    </div>
  )
}
