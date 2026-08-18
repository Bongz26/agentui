import { useAuthStore } from '../../store/authStore.js'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleLabel = {
    field_agent: 'Field Agent',
    supervisor: 'Supervisor',
    admin: 'Administrator',
  }[user?.role] || user?.role

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div className="page-wrapper fade-in">
      <div className="page-container">
        <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Profile</h1>

        {/* Avatar card */}
        <div className="card mb-6">
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--navy-900)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, margin: '0 auto 1rem'
            }}>
              {initials}
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.25rem' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-secondary text-sm">{user?.email}</p>
            <span className="badge badge-submitted" style={{ marginTop: '0.5rem' }}>{roleLabel}</span>
          </div>
        </div>

        {/* Details */}
        <div className="review-section mb-6">
          <div className="review-section-header"><span className="review-section-title">Account Details</span></div>
          <div className="review-section-body">
            {[
              ['Full Name', `${user?.first_name} ${user?.last_name}`],
              ['Email', user?.email],
              ['Role', roleLabel],
              ['Branch', user?.branch_name || '—'],
              ['Region', user?.branch_region || '—'],
            ].map(([l, v]) => (
              <div className="review-field" key={l}>
                <span className="review-field-label">{l}</span>
                <span className="review-field-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security info */}
        <div className="alert alert-info mb-6">
          <span>🔒</span>
          <div>
            <strong>Security Notice</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
              This is a prototype system using synthetic data only. Your session is secured using JWT tokens. MFA support is planned for production.
            </p>
          </div>
        </div>

        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          Sign Out
        </button>

        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
