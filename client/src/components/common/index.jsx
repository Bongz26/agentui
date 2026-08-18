import { FileText, FileWarning, Send, Search, MessageSquareWarning, CircleCheck, CircleX, Check, RefreshCw, WifiOff, AlertCircle } from 'lucide-react'

export function StatusBadge({ status }) {
  const labels = {
    draft: { text: 'Draft', icon: <FileText size={14} /> },
    incomplete: { text: 'Incomplete', icon: <FileWarning size={14} /> },
    submitted: { text: 'Submitted', icon: <Send size={14} /> },
    under_review: { text: 'Under Review', icon: <Search size={14} /> },
    requires_information: { text: 'Info Required', icon: <MessageSquareWarning size={14} /> },
    approved: { text: 'Approved', icon: <CircleCheck size={14} /> },
    declined: { text: 'Declined', icon: <CircleX size={14} /> },
  }
  const config = labels[status] || { text: status, icon: null }
  return (
    <span className={`badge badge-${status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {config.icon}
      {config.text}
    </span>
  )
}

export function SaveIndicator({ status }) {
  const config = {
    saved:   { icon: <Check size={14} />, text: 'Saved' },
    saving:  { icon: <RefreshCw size={14} className="spin" />, text: 'Saving...' },
    offline: { icon: <WifiOff size={14} />, text: 'Offline — will sync when connected' },
    error:   { icon: <AlertCircle size={14} />, text: 'Save failed' },
  }
  const { icon, text } = config[status] || config.saved
  return (
    <span className={`save-indicator ${status}`}>
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  )
}

export function LoadingSpinner({ size = 'sm', label }) {
  return (
    <div className="page-loading">
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {label && <p className="text-secondary text-sm">{label}</p>}
    </div>
  )
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>
}
