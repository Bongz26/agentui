import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getApplication, getStatusHistory, updateApplicationStatus } from '../../api/applications.js'
import { StatusBadge, LoadingSpinner } from '../../components/common/index.jsx'
import { useAuthStore } from '../../store/authStore.js'
import { ArrowLeft, TriangleAlert, UserRound, Package, Users, FileText, ClipboardList, Image as ImageIcon } from 'lucide-react'

const STATUS_OPTIONS = ['submitted','under_review','requires_information','approved','declined']

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin'

  const [app, setApp] = useState(null)
  const [history, setHistory] = useState([])
  const [documents, setDocuments] = useState([])
  const [dependants, setDependants] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [statusError, setStatusError] = useState(null)

  useEffect(() => {
    Promise.all([
      getApplication(id),
      getStatusHistory(id),
    ]).then(([appRes, histRes]) => {
      const data = appRes.data
      setApp(data.application)
      setDocuments(data.documents || [])
      setDependants(data.dependants || [])
      setHistory(histRes.data.history || [])
    }).finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setUpdating(true)
    setStatusError(null)
    try {
      const { data } = await updateApplicationStatus(id, newStatus, note)
      setApp(data.application)
      const histRes = await getStatusHistory(id)
      setHistory(histRes.data.history || [])
      setNewStatus('')
      setNote('')
    } catch (e) {
      setStatusError(e.response?.data?.error || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" label="Loading application..." />
  if (!app) return <div className="page-container" style={{ paddingTop: '2rem' }}><p>Application not found</p></div>

  const addr = app.client_address
  const addressStr = addr && (addr.street || addr.city)
    ? [addr.street, addr.suburb, addr.city, addr.province].filter(Boolean).join(', ')
    : '—'

  const canEdit = (app.status === 'draft' || app.status === 'incomplete' || app.status === 'requires_information') && user?.id === app.agent_id

  return (
    <div className="page-wrapper fade-in">
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ fontSize: 'var(--font-size-xl)', marginBottom: 0 }}>
              {app.client_first_name ? `${app.client_first_name} ${app.client_last_name}` : 'Application'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>{app.reference_number}</span>
              <StatusBadge status={app.status} />
            </div>
          </div>
          {canEdit && (
            <Link to={`/applications/${app.id}/edit`} className="btn btn-accent btn-sm" style={{ textDecoration: 'none' }}>
              Continue
            </Link>
          )}
        </div>

        {/* Status update (supervisor only) */}
        {isSupervisor && (
          <div className="card mb-4">
            <div className="card-header">
              <span className="font-semibold text-sm">Update Status</span>
            </div>
            <div className="card-body stack-sm">
              {statusError && <div className="alert alert-danger text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TriangleAlert size={16} /><span>{statusError}</span></div>}
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">Select new status...</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
              <input className="form-input" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={handleStatusUpdate} disabled={!newStatus || updating}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}

        {/* Client */}
        <div className="review-section mb-4">
          <div className="review-section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserRound size={18} className="text-muted" />
            <span className="review-section-title">Client Details</span>
          </div>
          <div className="review-section-body">
            {[
              ['Full Name', `${app.client_first_name} ${app.client_last_name}`],
              ['ID Number', app.client_id_number],
              ['Mobile', app.client_mobile],
              ['Email', app.client_email],
              ['Language', app.preferred_language],
              ['Address', addressStr],
            ].map(([l, v]) => (
              <div className="review-field" key={l}>
                <span className="review-field-label">{l}</span>
                <span className="review-field-value">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product */}
        {app.product_name && (
          <div className="review-section mb-4">
            <div className="review-section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={18} className="text-muted" />
              <span className="review-section-title">Product</span>
            </div>
            <div className="review-section-body">
              <div className="review-field"><span className="review-field-label">Product</span><span className="review-field-value">{app.product_name}</span></div>
              <div className="review-field"><span className="review-field-label">Premium</span><span className="review-field-value">R{app.monthly_premium}/month</span></div>
            </div>
          </div>
        )}

        {/* Dependants */}
        {dependants.length > 0 && (
          <div className="review-section mb-4">
            <div className="review-section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} className="text-muted" />
              <span className="review-section-title">Members ({dependants.length})</span>
            </div>
            <div className="review-section-body stack-sm">
              {dependants.map(d => (
                <div key={d.id} className="flex items-center gap-3" style={{ paddingBottom: '6px', borderBottom: '1px solid var(--slate-100)' }}>
                  <span className="font-medium text-sm">{d.first_name} {d.last_name}</span>
                  <span className="badge badge-draft" style={{ fontSize: '10px' }}>{d.relationship}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="review-section mb-4">
          <div className="review-section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} className="text-muted" />
            <span className="review-section-title">Documents ({documents.length})</span>
          </div>
          <div className="review-section-body">
            {documents.length === 0 ? (
              <p className="text-secondary text-sm">No documents uploaded</p>
            ) : (
              <div className="stack-sm">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3" style={{ padding: '6px 0', borderBottom: '1px solid var(--slate-100)' }}>
                    <div className="text-muted">{doc.mime_type?.includes('pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm font-medium truncate">{doc.original_filename}</div>
                      <div className="text-xs text-muted">{doc.document_type.replace(/_/g, ' ')} · {(doc.size_bytes/1024).toFixed(0)}KB</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status history */}
        {history.length > 0 && (
          <div className="card mb-4">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={18} className="text-muted" />
              <span className="font-semibold text-sm">Status History</span>
            </div>
            <div className="card-body stack-sm">
              {history.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '13px', paddingBottom: '0.5rem', borderBottom: '1px solid var(--slate-100)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-500)', marginTop: '5px', flexShrink: 0 }} />
                  <div>
                    <div><strong>{h.to_status.replace(/_/g, ' ')}</strong>{h.note && ` — ${h.note}`}</div>
                    <div className="text-xs text-muted">{h.changed_by_name} · {new Date(h.changed_at).toLocaleString('en-ZA')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: '1rem' }} />
      </div>
    </div>
  )
}
