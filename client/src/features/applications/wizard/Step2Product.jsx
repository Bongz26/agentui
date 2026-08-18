import { useEffect, useState } from 'react'
import { getProducts } from '../../../api/products.js'
import { updateApplication } from '../../../api/applications.js'
import { useWizardStore } from '../../../store/wizardStore.js'
import { LoadingSpinner } from '../../../components/common/index.jsx'
import { TriangleAlert, FileText, ArrowLeft, ArrowRight, Check } from 'lucide-react'

export default function Step2Product({ applicationId, application, onNext, onBack }) {
  const setSaveStatus = useWizardStore(s => s.setSaveStatus)
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(application?.product_id || null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProducts().then(({ data }) => {
      setProducts(data.products || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSelect = async (productId) => {
    setSelected(productId)
    setSaveStatus('saving')
    setSaving(true)
    try {
      await updateApplication(applicationId, { product_id: productId })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (!selected) { setError('Please select a product to continue'); return }
    onNext()
  }

  if (loading) return <LoadingSpinner label="Loading products..." />

  return (
    <div className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Select a Product</h2>
        <p className="page-subtitle">Choose the cover that best suits the client's needs</p>
      </div>

      {error && <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TriangleAlert size={16} /><span>{error}</span></div>}

      <div className="stack">
        {products.map(product => (
          <div
            key={product.id}
            className={`product-card ${selected === product.id ? 'selected' : ''}`}
            onClick={() => handleSelect(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleSelect(product.id)}
          >
            <div className="product-card-check"><Check size={16} strokeWidth={3} /></div>

            <div className="flex items-center justify-between mb-2">
              <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{product.name}</h3>
              <div>
                <span className="product-premium">R{product.monthly_premium}</span>
                <span className="product-premium-period">/month</span>
              </div>
            </div>

            <p className="text-secondary text-sm" style={{ marginBottom: '0.75rem' }}>{product.description}</p>

            <ul className="product-benefits">
              {product.benefits.map((b, i) => (
                <li key={i} className="product-benefit-item">{b}</li>
              ))}
            </ul>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {product.required_documents.map(doc => (
                <span key={doc} style={{
                  fontSize: '11px', background: 'var(--slate-100)', color: 'var(--slate-600)',
                  padding: '2px 8px', borderRadius: '99px', fontWeight: 600
                }}>
                  <FileText size={12} style={{ marginRight: '4px' }} /> {doc.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={handleNext}
          disabled={saving}
        >
          {saving ? 'Saving...' : <>Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
