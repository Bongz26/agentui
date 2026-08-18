import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore.js'
import { useWizardStore } from '../../../store/wizardStore.js'
import { createApplication, getApplication } from '../../../api/applications.js'
import { LoadingSpinner, SaveIndicator } from '../../../components/common/index.jsx'
import { TriangleAlert, ArrowLeft, Check } from 'lucide-react'
import Step1ClientDetails from './Step1ClientDetails.jsx'
import Step2Product from './Step2Product.jsx'
import Step3Dependants from './Step3Dependants.jsx'
import Step4Documents from './Step4Documents.jsx'
import Step5Consent from './Step5Consent.jsx'
import Step6Review from './Step6Review.jsx'

const STEPS = [
  { num: 1, label: 'Client Details' },
  { num: 2, label: 'Product' },
  { num: 3, label: 'Dependants' },
  { num: 4, label: 'Documents' },
  { num: 5, label: 'Consent' },
  { num: 6, label: 'Review' },
]

export default function WizardPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { currentStep, setStep, setApplicationId, applicationId, saveStatus, reset } = useWizardStore()

  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        if (id && id !== 'new') {
          // Resume existing application
          const { data } = await getApplication(id)
          setApplication(data.application)
          setApplicationId(data.application.id)
          // Jump to appropriate step based on completion
          const step = inferStep(data.application)
          setStep(step)
        } else {
          // Create new application
          const { data } = await createApplication({ attributionSource: 'field_agent' })
          setApplication(data.application)
          setApplicationId(data.application.id)
          setStep(1)
          // Update URL without reload
          navigate(`/applications/${data.application.id}/edit`, { replace: true })
        }
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to initialise application')
      } finally {
        setLoading(false)
      }
    }
    reset()
    init()
  }, [id])

  function inferStep(app) {
    if (!app.client_first_name || !app.client_mobile) return 1
    if (!app.product_id) return 2
    if (!app.consent_given) return 5
    return 6
  }

  const refreshApp = async () => {
    if (!applicationId) return
    try {
      const { data } = await getApplication(applicationId)
      setApplication(data.application)
    } catch {}
  }

  const goNext = () => {
    if (currentStep < 6) { setStep(currentStep + 1); refreshApp() }
  }
  const goBack = () => {
    if (currentStep > 1) setStep(currentStep - 1)
  }

  if (loading) return <LoadingSpinner size="lg" label="Initialising application..." />
  if (error) return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TriangleAlert size={16} /><span>{error}</span>
      </div>
      <button className="btn btn-outline mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => navigate('/applications')}>
        <ArrowLeft size={16} /> Back to Applications
      </button>
    </div>
  )

  const stepProps = { application, applicationId, onNext: goNext, onBack: goBack, onRefresh: refreshApp }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Wizard Progress Bar */}
      <div className="wizard-progress">
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div className={`wizard-step ${currentStep === s.num ? 'active' : ''} ${currentStep > s.num ? 'complete' : ''}`}>
              <div className="wizard-step-num">
                {currentStep > s.num ? <Check size={14} strokeWidth={3} /> : s.num}
              </div>
              <span className="wizard-step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wizard-divider ${currentStep > s.num ? 'complete' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Reference + Save indicator */}
      {application && (
        <div style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--color-border)', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {application.reference_number}
          </span>
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      {/* Step content */}
      <div className="page-wrapper" style={{ paddingTop: '1rem' }}>
        <div className="page-container">
          {currentStep === 1 && <Step1ClientDetails {...stepProps} />}
          {currentStep === 2 && <Step2Product {...stepProps} />}
          {currentStep === 3 && <Step3Dependants {...stepProps} />}
          {currentStep === 4 && <Step4Documents {...stepProps} />}
          {currentStep === 5 && <Step5Consent {...stepProps} />}
          {currentStep === 6 && <Step6Review {...stepProps} />}
        </div>
      </div>
    </div>
  )
}
