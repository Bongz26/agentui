import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, getDependants, submitApplication } from '../../../api/applications.js'
import { StatusBadge } from '../../../components/common/index.jsx'
import { useWizardStore } from '../../../store/wizardStore.js'
import { UserRound, Package, Users, FileText, Check, X, CircleCheck, CircleX, PenSquare, ArrowLeft, Send, TriangleAlert } from 'lucide-react'

function ReviewSection({ title, icon, onEdit, children }) {
  return (
    <div className="review-section">
      <div className="review-section-header">
        <span className="review-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="text-muted">{icon}</span> {title}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ color: 'var(--navy-900)', fontWeight: 700, minHeight: 'auto', padding: '4px 12px' }}>
          Edit
        </button>
      </div>
      <div className="review-section-body">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="review-field">
      <span className="review-field-label">{label}</span>
      <span className="review-field-value">{value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</span>
    </div>
  )
}

export default function Step6Review({ applicationId, application, onBack }) {
  const navigate = useNavigate()
  const setStep = useWizardStore(s => s.setStep)
  const [documents, setDocuments] = useState([])
  const [dependants, setDependants] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      getDocuments(applicationId),
      getDependants(applicationId),
    ]).then(([docs, deps]) => {
      setDocuments(docs.data.documents || [])
      setDependants(deps.data.dependants || [])
    })
  }, [applicationId])

  const requiredDocs = application?.product_required_documents || []
  const allDocsPresent = requiredDocs.every(dt => documents.some(d => d.document_type === dt))

  const canSubmit = Boolean(
    application?.client_first_name &&
    application?.client_last_name &&
    application?.client_mobile &&
    application?.product_id &&
    application?.consent_given &&
    allDocsPresent
  )

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await submitApplication(applicationId)
      navigate(`/applications/${applicationId}/success`, {
        state: { application: data.application }
      })
    } catch (e) {
      setError(e.response?.data?.error || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const addr = application?.client_address
  const addressStr = addr && (addr.street || addr.city)
    ? [addr.street, addr.suburb, addr.city, addr.province, addr.postal_code].filter(Boolean).join(', ')
    : null

  return (
    <div className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Review & Submit</h2>
        <p className="page-subtitle">Review all information before final submission</p>
      </div>

      {error && <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TriangleAlert size={16} /><span>{error}</span></div>}

      {!canSubmit && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <TriangleAlert size={20} style={{ marginTop: '2px' }} />
          <div>
            <strong>Application is not ready to submit.</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1rem', fontSize: '13px' }}>
              {!application?.client_first_name && <li>Client details incomplete</li>}
              {!application?.product_id && <li>No product selected</li>}
              {!application?.consent_given && <li>Client consent not recorded</li>}
              {!allDocsPresent && <li>Required documents missing</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Client */}
      <ReviewSection title="Client Details" icon={<UserRound size={18} />} onEdit={() => setStep(1)}>
        <Field label="Full Name" value={`${application?.client_first_name || ''} ${application?.client_last_name || ''}`.trim() || null} />
        <Field label="ID Number" value={application?.client_id_number} />
        <Field label="Mobile" value={application?.client_mobile} />
        <Field label="Email" value={application?.client_email} />
        <Field label="Language" value={application?.preferred_language} />
        <Field label="Address" value={addressStr} />
      </ReviewSection>

      {/* Product */}
      <ReviewSection title="Product" icon={<Package size={18} />} onEdit={() => setStep(2)}>
        {application?.product_name ? (
          <>
            <Field label="Product" value={application.product_name} />
            <Field label="Monthly Premium" value={`R${application.monthly_premium?.toFixed(2)}/month`} />
          </>
        ) : (
          <p className="text-secondary text-sm">No product selected</p>
        )}
      </ReviewSection>

      {/* Dependants */}
      <ReviewSection title="Members / Dependants" icon={<Users size={18} />} onEdit={() => setStep(3)}>
        {dependants.length === 0 ? (
          <p className="text-secondary text-sm">No members added (main member only)</p>
        ) : (
          <div className="stack-sm">
            {dependants.map(d => (
              <div key={d.id} className="flex items-center gap-3" style={{ padding: '6px 0', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{d.first_name} {d.last_name}</span>
                <span className="badge badge-draft" style={{ fontSize: '10px' }}>{d.relationship}</span>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      {/* Documents */}
      <ReviewSection title="Documents" icon={<FileText size={18} />} onEdit={() => setStep(4)}>
        {requiredDocs.map(dt => {
          const doc = documents.find(d => d.document_type === dt)
          const label = dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          return (
            <div key={dt} className="review-field">
              <span className="review-field-label">{label}</span>
              <span style={{ color: doc ? 'var(--green-600)' : 'var(--red-600)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {doc ? <><Check size={14} /> Uploaded</> : <><X size={14} /> Missing</>}
              </span>
            </div>
          )
        })}
        {documents.filter(d => !requiredDocs.includes(d.document_type)).map(doc => (
          <div key={doc.id} className="review-field">
            <span className="review-field-label">{doc.document_type.replace(/_/g, ' ')}</span>
            <span style={{ color: 'var(--green-600)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Uploaded</span>
          </div>
        ))}
      </ReviewSection>

      {/* Consent */}
      <ReviewSection title="Consent" icon={<PenSquare size={18} />} onEdit={() => setStep(5)}>
        <Field
          label="Client Consent"
          value={application?.consent_given
            ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CircleCheck size={14} className="text-success" /> Given — {application.consent_timestamp ? new Date(application.consent_timestamp).toLocaleString('en-ZA') : ''}</div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CircleX size={14} className="text-danger" /> Not yet recorded</div>}
        />
      </ReviewSection>

      {/* Action buttons */}
      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button
          className="btn btn-accent"
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <><span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
            <span>Submitting...</span></>
          ) : <><Send size={16} /> Submit Application</>}
        </button>
      </div>
    </div>
  )
}
