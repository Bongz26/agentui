import { useState, useEffect, useRef } from 'react'
import { getDocuments, uploadDocument, deleteDocument, getDocumentUrl } from '../../../api/applications.js'
import { LoadingSpinner } from '../../../components/common/index.jsx'
import { IdCard, Home, Paperclip, Check, FileText, Image as ImageIcon, Eye, TriangleAlert, Camera, Upload, ArrowLeft, ArrowRight, ClipboardList, CircleCheck } from 'lucide-react'

const DOC_TYPES = {
  id_document:        { label: 'Identity Document (ID / Passport)', icon: <IdCard size={24} />, required: true },
  proof_of_address:   { label: 'Proof of Address',                  icon: <Home size={24} />, required: true },
  supporting_document:{ label: 'Supporting Document',               icon: <Paperclip size={24} />, required: false },
}

function DocCard({ docType, meta, existing, applicationId, onUploaded, onRemoved }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    if (!file) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const { data } = await uploadDocument(applicationId, docType, file, p => setProgress(p))
      onUploaded(data.document)
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleCamera = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = e => handleFile(e.target.files[0])
    input.click()
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.onchange = e => handleFile(e.target.files[0])
    input.click()
  }

  const handleRemove = async () => {
    if (!window.confirm(`Remove this ${meta.label}?`)) return
    try {
      await deleteDocument(applicationId, existing.id)
      onRemoved(existing.id)
    } catch {}
  }

  const isUploaded = Boolean(existing)

  return (
    <div className={`doc-card ${isUploaded ? 'uploaded' : ''} ${meta.required && !isUploaded ? 'required' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{ color: 'var(--navy-900)' }}>{meta.icon}</div>
          <div>
            <div className="font-semibold text-sm">{meta.label}</div>
            <div className="text-xs text-muted">{meta.required ? 'Required' : 'Optional'}</div>
          </div>
        </div>
          <span style={{ background: 'var(--teal-500)', color: 'white', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} strokeWidth={3} /> Uploaded
          </span>
      </div>

      {/* Preview */}
      {isUploaded && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: 'var(--navy-600)' }}>
            {existing.mime_type?.includes('pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-sm font-medium truncate">{existing.original_filename}</div>
            <div className="text-xs text-muted">{(existing.size_bytes / 1024).toFixed(0)} KB</div>
          </div>
          <a
            href={getDocumentUrl(existing.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm btn-icon"
            title="View document"
          ><Eye size={18} /></a>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ height: '6px', background: 'var(--slate-200)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--teal-500)', borderRadius: '99px', transition: 'width 0.2s' }} />
          </div>
          <p className="text-xs text-muted text-center" style={{ marginTop: '4px' }}>Uploading {progress}%...</p>
        </div>
      )}

      {error && <p className="form-error mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TriangleAlert size={16} /> {error}</p>}

      <div className="doc-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={handleCamera}
          disabled={uploading}
        >
          <Camera size={16} /> Take Photo
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={handleUpload}
          disabled={uploading}
        >
          <Upload size={16} /> Upload File
        </button>
        {isUploaded && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleRemove}
            style={{ color: 'var(--red-500)', marginLeft: 'auto' }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

export default function Step4Documents({ applicationId, application, onNext, onBack }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  // Determine required documents based on product
  const requiredDocs = application?.product_required_documents || ['id_document', 'proof_of_address']

  useEffect(() => {
    getDocuments(applicationId).then(({ data }) => {
      setDocuments(data.documents || [])
    }).finally(() => setLoading(false))
  }, [applicationId])

  const getExisting = (docType) => documents.find(d => d.document_type === docType)

  const handleUploaded = (doc) => {
    setDocuments(prev => {
      const filtered = prev.filter(d => d.document_type !== doc.document_type)
      return [...filtered, doc]
    })
  }

  const handleRemoved = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  const allRequiredUploaded = requiredDocs.every(dt => Boolean(getExisting(dt)))

  if (loading) return <LoadingSpinner label="Loading documents..." />

  return (
    <div className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Document Capture</h2>
        <p className="page-subtitle">Capture or upload supporting documents directly from your phone</p>
      </div>

      {!allRequiredUploaded && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={20} />
          <span>Please upload all required documents before submitting the application.</span>
        </div>
      )}

      {allRequiredUploaded && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircleCheck size={20} />
          <span>All required documents uploaded successfully!</span>
        </div>
      )}

      <div className="stack">
        {/* Show required docs first, then optional */}
        {Object.entries(DOC_TYPES)
          .sort(([, a], [, b]) => (b.required ? 1 : 0) - (a.required ? 1 : 0))
          .map(([docType, meta]) => (
            <DocCard
              key={docType}
              docType={docType}
              meta={{ ...meta, required: requiredDocs.includes(docType) }}
              existing={getExisting(docType)}
              applicationId={applicationId}
              onUploaded={handleUploaded}
              onRemoved={handleRemoved}
            />
          ))
        }
      </div>

      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={onNext}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
