import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { getApplications } from '../../api/applications.js'
import { StatusBadge, LoadingSpinner } from '../../components/common/index.jsx'
import { FileText, FileWarning, Send, TriangleAlert, ClipboardList, Package, Clock, Plus } from 'lucide-react'

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_META = {
  draft:               { label: 'Drafts',              icon: <FileText size={24} />, color: 'var(--slate-600)',  bg: 'var(--slate-100)' },
  incomplete:          { label: 'Incomplete',           icon: <FileWarning size={24} />,  color: 'var(--amber-600)', bg: 'var(--amber-100)' },
  submitted:           { label: 'Submitted',            icon: <Send size={24} />, color: 'var(--navy-700)',  bg: 'var(--navy-100)' },
  requires_information:{ label: 'Requires Attention',   icon: <TriangleAlert size={24} />, color: 'var(--red-600)',   bg: 'var(--red-100)' },
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getApplications({ limit: 5 })
        setRecent(data.applications || [])

        // Calculate stats from all applications
        const all = await getApplications({ limit: 200 })
        const apps = all.data.applications || []
        const counts = {}
        apps.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
        setStats(counts)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner size="lg" label="Loading dashboard..." />

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="page-wrapper fade-in">
      <div className="page-container">
        {/* Greeting card */}
        <div className="dashboard-greeting mb-6">
          <div className="greeting-date">{today}</div>
          <div className="greeting-name">{GREETING()}, {user?.first_name}!</div>
          <div className="greeting-sub">Ready to onboard new clients?</div>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => navigate('/applications/new')}
            style={{ marginTop: '1rem' }}
          >
            <Plus size={16} style={{ marginRight: '6px' }}/> New Application
          </button>
        </div>

        {/* Stats grid */}
        <p className="section-title">Your Applications</p>
        <div className="stats-grid mb-6">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <Link to={`/applications?status=${key}`} key={key} className="stat-card" style={{ textDecoration: 'none' }}>
              <div className="stat-icon" style={{ background: meta.bg }}>
                <div style={{ color: meta.color, display: 'flex' }}>{meta.icon}</div>
              </div>
              <div className="stat-value">{stats[key] || 0}</div>
              <div className="stat-label">{meta.label}</div>
            </Link>
          ))}
        </div>

        {/* Recent applications */}
        <p className="section-title">Recent Applications</p>
        {recent.length === 0 ? (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--slate-400)' }}><ClipboardList size={40} strokeWidth={1.5}/></div>
              <p className="font-semibold" style={{ marginBottom: '0.25rem' }}>No applications yet</p>
              <p className="text-secondary text-sm">Tap the + button to start your first application</p>
            </div>
          </div>
        ) : (
          <div className="stack-sm">
            {recent.map(app => (
              <Link to={`/applications/${app.id}`} key={app.id} className="app-card">
                <div className="app-card-header">
                  <div>
                    <div className="app-card-name">
                      {app.client_first_name
                        ? `${app.client_first_name} ${app.client_last_name}`
                        : <span className="text-muted">Unnamed Client</span>
                      }
                    </div>
                    <div className="app-card-ref">{app.reference_number}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className="app-card-meta">
                  {app.product_name && (
                    <span className="app-card-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={14} /> {app.product_name}
                    </span>
                  )}
                  <span className="app-card-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {new Date(app.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            ))}
            <Link to="/applications" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
              View All Applications →
            </Link>
          </div>
        )}

        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
