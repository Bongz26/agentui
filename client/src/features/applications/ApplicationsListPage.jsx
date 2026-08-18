import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getApplications } from '../../api/applications.js'
import { StatusBadge, LoadingSpinner } from '../../components/common/index.jsx'
import { Inbox, Package, Clock, TriangleAlert, Plus } from 'lucide-react'

const STATUSES = ['draft','incomplete','submitted','under_review','requires_information','approved','declined']

export default function ApplicationsListPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFilter = searchParams.get('status') || ''

  useEffect(() => {
    setLoading(true)
    getApplications({ status: statusFilter || undefined, limit: 100 })
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  const setStatus = (s) => {
    if (s) setSearchParams({ status: s })
    else setSearchParams({})
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>My Applications</h1>
            <p className="text-sm text-muted">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/applications/new" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> New
          </Link>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', marginBottom: '1.25rem' }}>
          <button
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatus('')}
            style={{ flexShrink: 0 }}
          >All</button>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatus(s)}
              style={{ flexShrink: 0 }}
            >
              {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading applications..." />
        ) : applications.length === 0 ? (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '3rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--slate-400)' }}><Inbox size={40} strokeWidth={1.5}/></div>
              <p className="font-semibold">No applications found</p>
              <p className="text-secondary text-sm mb-4">
                {statusFilter ? `No ${statusFilter.replace(/_/g, ' ')} applications` : 'Start your first application'}
              </p>
              <Link to="/applications/new" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={16} /> New Application
              </Link>
            </div>
          </div>
        ) : (
          <div className="stack-sm">
            {applications.map(app => (
              <Link
                to={app.status === 'draft' || app.status === 'incomplete'
                  ? `/applications/${app.id}/edit`
                  : `/applications/${app.id}`
                }
                key={app.id}
                className="app-card"
                style={{ textDecoration: 'none' }}
              >
                <div className="app-card-header">
                  <div style={{ minWidth: 0 }}>
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
                    <Clock size={14} /> {new Date(app.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {app.status === 'requires_information' && (
                    <span className="app-card-meta-item" style={{ color: 'var(--red-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TriangleAlert size={14} /> Action required
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
