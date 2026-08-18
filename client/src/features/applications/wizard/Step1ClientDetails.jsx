import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAutoSave } from '../../../hooks/useAutoSave.js'
import { TriangleAlert, ArrowLeft, ArrowRight } from 'lucide-react'

const LANGUAGES = ['English', 'Zulu', 'Xhosa', 'Sotho', 'Afrikaans', 'Tswana', 'Venda', 'Tsonga', 'Swati', 'Ndebele', 'Other']

function validateSAId(idNumber) {
  if (!idNumber || idNumber.length !== 13) return true // Only validate if looks like SA ID
  if (!/^\d{13}$/.test(idNumber)) return 'ID number must be 13 digits'
  // Luhn check for SA ID
  let sum = 0
  for (let i = 0; i < 12; i++) {
    let d = parseInt(idNumber[i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  const check = (10 - (sum % 10)) % 10
  if (check !== parseInt(idNumber[12])) return 'Invalid South African ID number'
  return true
}

export default function Step1ClientDetails({ applicationId, application, onNext, onBack }) {
  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      client_first_name: application?.client_first_name || '',
      client_last_name:  application?.client_last_name  || '',
      client_id_number:  application?.client_id_number  || '',
      client_dob:        application?.client_dob        || '',
      client_mobile:     application?.client_mobile     || '',
      client_email:      application?.client_email      || '',
      preferred_language: application?.preferred_language || 'English',
      // Address fields
      address_street:   application?.client_address?.street   || '',
      address_suburb:   application?.client_address?.suburb   || '',
      address_city:     application?.client_address?.city     || '',
      address_province: application?.client_address?.province || '',
      address_postal:   application?.client_address?.postal_code || '',
    }
  })

  const watchedValues = watch()
  const { save } = useAutoSave(applicationId, watchedValues ? buildPayload(watchedValues) : null)

  function buildPayload(values) {
    return {
      client_first_name: values.client_first_name,
      client_last_name:  values.client_last_name,
      client_id_number:  values.client_id_number || null,
      client_dob:        values.client_dob || null,
      client_mobile:     values.client_mobile,
      client_email:      values.client_email || null,
      preferred_language: values.preferred_language,
      client_address: JSON.stringify({
        street: values.address_street,
        suburb: values.address_suburb,
        city:   values.address_city,
        province: values.address_province,
        postal_code: values.address_postal,
      }),
    }
  }

  const onSubmit = async (values) => {
    await save(buildPayload(values))
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Client Details</h2>
        <p className="page-subtitle">Enter the client's personal information accurately</p>
      </div>

      {/* Name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="s1-fname">First Name <span className="required">*</span></label>
          <input id="s1-fname" className={`form-input ${errors.client_first_name ? 'error' : ''}`}
            placeholder="e.g. Sipho"
            {...register('client_first_name', { required: 'First name is required' })} />
          {errors.client_first_name && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.client_first_name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="s1-lname">Surname <span className="required">*</span></label>
          <input id="s1-lname" className={`form-input ${errors.client_last_name ? 'error' : ''}`}
            placeholder="e.g. Nkosi"
            {...register('client_last_name', { required: 'Surname is required' })} />
          {errors.client_last_name && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.client_last_name.message}</p>}
        </div>
      </div>

      {/* ID Number */}
      <div className="form-group">
        <label className="form-label" htmlFor="s1-id">SA ID / Passport Number</label>
        <input id="s1-id" className={`form-input ${errors.client_id_number ? 'error' : ''}`}
          placeholder="13-digit SA ID or passport number"
          maxLength={20}
          {...register('client_id_number', {
            validate: v => !v || validateSAId(v)
          })} />
        {errors.client_id_number && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.client_id_number.message}</p>}
        <p className="form-hint">Luhn validation applied for SA ID numbers</p>
      </div>

      {/* DOB */}
      <div className="form-group">
        <label className="form-label" htmlFor="s1-dob">Date of Birth</label>
        <input id="s1-dob" type="date" className="form-input"
          max={new Date().toISOString().split('T')[0]}
          {...register('client_dob')} />
      </div>

      {/* Mobile */}
      <div className="form-group">
        <label className="form-label" htmlFor="s1-mobile">Mobile Number <span className="required">*</span></label>
        <input id="s1-mobile" type="tel" className={`form-input ${errors.client_mobile ? 'error' : ''}`}
          placeholder="e.g. 0712345678"
          {...register('client_mobile', {
            required: 'Mobile number is required',
            pattern: { value: /^0[6-8][0-9]{8}$/, message: 'Enter a valid SA mobile number (e.g. 0712345678)' }
          })} />
        {errors.client_mobile && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.client_mobile.message}</p>}
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="s1-email">Email Address <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <input id="s1-email" type="email" className={`form-input ${errors.client_email ? 'error' : ''}`}
          placeholder="client@example.com"
          {...register('client_email', {
            validate: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address'
          })} />
        {errors.client_email && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.client_email.message}</p>}
      </div>

      {/* Language */}
      <div className="form-group">
        <label className="form-label" htmlFor="s1-lang">Preferred Language <span className="required">*</span></label>
        <select id="s1-lang" className="form-select" {...register('preferred_language')}>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Address */}
      <div>
        <p className="form-label" style={{ marginBottom: '0.75rem' }}>Residential Address</p>
        <div className="stack-sm">
          <div className="form-group">
            <label className="form-label" htmlFor="s1-street">Street Address</label>
            <input id="s1-street" className="form-input" placeholder="e.g. 12 Main Street"
              {...register('address_street')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="s1-suburb">Suburb</label>
              <input id="s1-suburb" className="form-input" placeholder="Suburb"
                {...register('address_suburb')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="s1-city">City / Town</label>
              <input id="s1-city" className="form-input" placeholder="City"
                {...register('address_city')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="s1-prov">Province</label>
              <select id="s1-prov" className="form-select" {...register('address_province')}>
                <option value="">Select province</option>
                {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="s1-postal">Postal Code</label>
              <input id="s1-postal" className="form-input" placeholder="0001" maxLength={4}
                {...register('address_postal')} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </form>
  )
}
