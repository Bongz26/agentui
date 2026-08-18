import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getApplication } from '../../api/applications.js'

export default function SubmissionSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [app, setApp] = useState(location.state?.application || null)

  useEffect(() => {
    if (!app && id) {
      getApplication(id).then(({ data }) => setApp(data.application)).catch(() => {})
    }
  }, [id, app])

  if (!app) return null

  return (
    <div className="success-page fade-in">
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div className="success-icon">🎉</div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Application Submitted!
        </h1>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          The application has been received and is now under review.
        </p>

        <div className="card mb-6" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <div className="card-body">
            <p className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Reference Number</p>
            <div className="success-reference">{app.reference_number}</div>

            <div className="divider" />

            <div className="stack-sm text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Client</span>
                <span className="font-medium">{app.client_first_name} {app.client_last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Product</span>
                <span className="font-medium">{app.product_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Submitted</span>
                <span className="font-medium">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleString('en-ZA') : 'Just now'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Status</span>
                <span style={{ color: 'var(--navy-700)', fontWeight: 700 }}>Submitted ✓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stack-sm w-full">
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate(`/applications/${app.id}`)}
          >
            View Application
          </button>
          <button
            className="btn btn-outline btn-full"
            onClick={() => navigate('/applications/new')}
          >
            Start Another Application
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
