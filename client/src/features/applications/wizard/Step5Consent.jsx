import { useState, useEffect } from 'react'
import { updateApplication } from '../../../api/applications.js'
import { useWizardStore } from '../../../store/wizardStore.js'
import { useAuthStore } from '../../../store/authStore.js'
import { TriangleAlert, CircleCheck, Check, ArrowLeft, ArrowRight } from 'lucide-react'

const PLACEHOLDER_TEXT = `VICTORY CONNECT — CLIENT CONSENT DECLARATION

⚠️ PROTOTYPE / DEMONSTRATION ONLY — This text is placeholder wording for demonstration purposes. It has NOT been reviewed or approved by legal counsel. It MUST be reviewed and replaced by a qualified South African attorney familiar with POPIA, FAIS, and applicable financial services regulations before this system is used in production.

1. DECLARATION OF INFORMATION

I, the undersigned client, declare that all information provided during this application process is true, accurate, and complete to the best of my knowledge and belief.

2. CONSENT TO DATA PROCESSING

I consent to Victory Connect collecting, processing, storing, and using my personal information (including the personal information of nominated beneficiaries and dependants) for the purpose of:
• Evaluating and processing my insurance application
• Administering my policy if accepted
• Communicating with me regarding my policy
• Complying with applicable legal and regulatory obligations

I understand that my personal information will be processed in accordance with the Protection of Personal Information Act (POPIA), Act 4 of 2013.

3. RIGHT OF ACCESS AND CORRECTION

I understand that I have the right to access, correct, or request the deletion of my personal information, subject to applicable legal requirements.

4. THIRD PARTY DISCLOSURE

I understand that my information may be shared with reinsurers, underwriters, service providers, and regulatory bodies where required, subject to appropriate confidentiality agreements.

5. MARKETING COMMUNICATIONS

I consent to receive communications from Victory Connect regarding products and services that may be of interest to me. I understand that I may withdraw this consent at any time.

6. AGENT CONFIRMATION

I confirm that the field agent who assisted with this application has been identified, and that I was given adequate opportunity to read and understand this declaration.`

export default function Step5Consent({ applicationId, application, onNext, onBack }) {
  const { user } = useAuthStore()
  const setSaveStatus = useWizardStore(s => s.setSaveStatus)
  const [consentGiven, setConsentGiven] = useState(Boolean(application?.consent_given))
  const [infoCorrect, setInfoCorrect] = useState(false)
  const [privacyAck, setPrivacyAck] = useState(false)
  const [agentConfirm, setAgentConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const allChecked = infoCorrect && privacyAck && agentConfirm

  const handleConsent = async () => {
    if (!allChecked) { setError('Please check all boxes to confirm consent'); return }
    setSaving(true)
    setSaveStatus('saving')
    try {
      await updateApplication(applicationId, {
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        consent_agent_id: user.id,
      })
      setConsentGiven(true)
      setSaveStatus('saved')
      setError(null)
    } catch {
      setSaveStatus('error')
      setError('Failed to record consent. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Client Consent</h2>
        <p className="page-subtitle">Read the consent declaration to the client and obtain their agreement</p>
      </div>

      <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TriangleAlert size={20} />
        <strong>PROTOTYPE ONLY — Consent wording requires legal review before production use.</strong>
      </div>

      <div className="consent-box">
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.7 }}>
          {PLACEHOLDER_TEXT}
        </pre>
      </div>

      {consentGiven ? (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircleCheck size={20} />
          <div>
            <strong>Consent recorded successfully</strong>
            <p style={{ margin: 0, fontSize: '12px', marginTop: '2px' }}>
              Recorded at {new Date(application?.consent_timestamp || Date.now()).toLocaleString('en-ZA')} by {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TriangleAlert size={16} /><span>{error}</span></div>}

          <div className="stack-sm">
            <label className="checkbox-group">
              <input type="checkbox" checked={infoCorrect} onChange={e => setInfoCorrect(e.target.checked)} />
              <span className="text-sm">I confirm that all information provided in this application is true, accurate, and complete.</span>
            </label>
            <label className="checkbox-group">
              <input type="checkbox" checked={privacyAck} onChange={e => setPrivacyAck(e.target.checked)} />
              <span className="text-sm">I acknowledge and agree to the data processing and privacy notice above.</span>
            </label>
            <label className="checkbox-group">
              <input type="checkbox" checked={agentConfirm} onChange={e => setAgentConfirm(e.target.checked)} />
              <span className="text-sm">I, <strong>{user?.first_name} {user?.last_name}</strong>, confirm that this consent was obtained from the client in my presence.</span>
            </label>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleConsent}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            disabled={saving || !allChecked}
          >
            {saving ? 'Recording consent...' : <><Check size={16} /> Record Client Consent</>}
          </button>
        </>
      )}

      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={onNext}
          disabled={!consentGiven}
        >
          Continue to Review <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
