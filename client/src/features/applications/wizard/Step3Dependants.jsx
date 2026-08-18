import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getDependants, addDependant, updateDependant, removeDependant } from '../../../api/applications.js'
import { LoadingSpinner } from '../../../components/common/index.jsx'
import { TriangleAlert, Users, Pencil, X, Plus, ArrowLeft, ArrowRight } from 'lucide-react'

const RELATIONSHIPS = ['Spouse','Child','Parent','Parent-in-law','Sibling','Extended Family','Other']

function DependantForm({ initial = {}, onSave, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: initial.first_name || '',
      lastName:  initial.last_name  || '',
      relationship: initial.relationship || '',
      idNumber:  initial.id_number  || '',
      dob:       initial.dob        || '',
      mobile:    initial.mobile     || '',
    }
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="stack-sm" style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
      <h4 style={{ margin: 0 }}>{initial.id ? 'Edit Member' : 'Add Member'}</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="form-label">First Name <span className="required">*</span></label>
          <input className={`form-input ${errors.firstName ? 'error' : ''}`}
            placeholder="First name"
            {...register('firstName', { required: 'Required' })} />
          {errors.firstName && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.firstName.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Surname <span className="required">*</span></label>
          <input className={`form-input ${errors.lastName ? 'error' : ''}`}
            placeholder="Surname"
            {...register('lastName', { required: 'Required' })} />
          {errors.lastName && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.lastName.message}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Relationship <span className="required">*</span></label>
        <select className={`form-select ${errors.relationship ? 'error' : ''}`}
          {...register('relationship', { required: 'Select a relationship' })}>
          <option value="">Select relationship</option>
          {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.relationship && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TriangleAlert size={14} /> {errors.relationship.message}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="form-label">ID / Passport</label>
          <input className="form-input" placeholder="Optional" {...register('idNumber')} />
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-input" max={new Date().toISOString().split('T')[0]} {...register('dob')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Mobile (if applicable)</label>
        <input type="tel" className="form-input" placeholder="Optional" {...register('mobile')} />
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-accent btn-sm" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {initial.id ? 'Update Member' : <><Plus size={16} /> Add Member</>}
        </button>
      </div>
    </form>
  )
}

export default function Step3Dependants({ applicationId, application, onNext, onBack }) {
  const [dependants, setDependants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    getDependants(applicationId).then(({ data }) => {
      setDependants(data.dependants || [])
    }).finally(() => setLoading(false))
  }, [applicationId])

  const handleAdd = async (values) => {
    const { data } = await addDependant(applicationId, values)
    setDependants(prev => [...prev, data.dependant])
    setShowForm(false)
  }

  const handleUpdate = async (depId, values) => {
    const { data } = await updateDependant(applicationId, depId, values)
    setDependants(prev => prev.map(d => d.id === depId ? data.dependant : d))
    setEditingId(null)
  }

  const handleRemove = async (depId) => {
    if (!window.confirm('Remove this member from the policy?')) return
    await removeDependant(applicationId, depId)
    setDependants(prev => prev.filter(d => d.id !== depId))
  }

  if (loading) return <LoadingSpinner label="Loading members..." />

  const noMembersNeeded = !application?.product_id || application?.product_name === 'Individual Cover'

  return (
    <div className="stack-lg fade-in">
      <div>
        <h2 className="page-title">Members / Dependants</h2>
        <p className="page-subtitle">
          {noMembersNeeded
            ? 'This product covers the main member only. You can still add dependants if needed.'
            : 'Add all members to be covered under this policy'}
        </p>
      </div>

      {dependants.length > 0 && (
        <div className="stack-sm">
          {dependants.map(dep => (
            editingId === dep.id ? (
              <DependantForm
                key={dep.id}
                initial={dep}
                onSave={v => handleUpdate(dep.id, v)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={dep.id} className="dependant-card">
                <div className="dependant-avatar">
                  {dep.first_name[0]}{dep.last_name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-semibold truncate">{dep.first_name} {dep.last_name}</div>
                  <div className="text-sm text-secondary">{dep.relationship}</div>
                  {dep.dob && <div className="text-xs text-muted">DOB: {dep.dob}</div>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingId(dep.id)} title="Edit"><Pencil size={16} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleRemove(dep.id)} title="Remove" style={{ color: 'var(--red-500)' }}><X size={16} /></button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {dependants.length === 0 && !showForm && (
        <div className="card">
          <div className="card-body text-center" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--slate-400)' }}><Users size={40} strokeWidth={1.5} /></div>
            <p className="font-semibold">No members added yet</p>
            <p className="text-secondary text-sm">Tap below to add family members or dependants</p>
          </div>
        </div>
      )}

      {showForm && (
        <DependantForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && !editingId && (
        <button className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Member
        </button>
      )}

      <div className="flex gap-3" style={{ paddingBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={onNext}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
