import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSupervisorDashboard, getSupervisorAgents } from '../../api/products.js'
import { getApplications, updateApplicationStatus } from '../../api/applications.js'
import { StatusBadge, LoadingSpinner } from '../../components/common/index.jsx'
import { useAuthStore } from '../../store/authStore.js'
import { LayoutDashboard, ClipboardList, Users, LogOut, Send, Search, CircleCheck, TriangleAlert, FileText, FileWarning, CircleX, Eye } from 'lucide-react'

const SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: 'applications', icon: <ClipboardList size={20} />, label: 'All Applications' },
  { id: 'agents', icon: <Users size={20} />, label: 'Agents' },
]

function StatCard({ value, label, icon, color, bg, variant = 'standard' }) {
  const isHero = variant === 'hero'
  return (
    <div className={`stat-card ${isHero ? 'hero' : ''}`}>
      <div className="stat-card-header">
        <div className="stat-label">{label}</div>
        <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      </div>
      <div className="stat-value" style={{ color }}>{value ?? 0}</div>
    </div>
  )
}

function AgentProgressBar({ value, max, bg }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '8px', background: 'var(--slate-100)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: bg, borderRadius: '99px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-600)', minWidth: '28px', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function getAgentStatus(agent) {
  if (!agent.total || agent.total === 0) return { label: 'Inactive', color: 'var(--slate-500)', barColor: 'var(--slate-300)' }
  if (agent.approved > 0) return { label: 'Exceeding', color: 'var(--color-accent)', barColor: 'var(--color-accent)' }
  if (agent.submitted > 0) return { label: 'On Track', color: 'var(--color-primary-blue)', barColor: 'var(--color-primary-blue)' }
  return { label: 'Building Momentum', color: 'var(--navy-900)', barColor: 'linear-gradient(90deg, var(--color-primary-blue) 0%, var(--color-accent) 100%)' }
}

export default function SupervisorDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('dashboard')
  const [dashData, setDashData] = useState(null)
  const [allApps, setAllApps] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterAgent, setFilterAgent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    Promise.all([
      getSupervisorDashboard(),
      getSupervisorAgents(),
    ]).then(([dash, agts]) => {
      setDashData(dash.data)
      setAgents(agts.data.agents || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeView !== 'applications') return
    const params = {}
    if (filterAgent) params.agentId = filterAgent
    if (filterStatus) params.status = filterStatus
    if (filterFrom) params.fromDate = filterFrom
    if (filterTo) params.toDate = filterTo
    params.limit = 200

    getApplications(params).then(({ data }) => setAllApps(data.applications || []))
  }, [activeView, filterAgent, filterStatus, filterFrom, filterTo])

  const handleLogout = async () => { await logout(); navigate('/login') }

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" label="Loading supervisor dashboard..." />
    </div>
  )

  const sc = dashData?.statusCounts || {}
  const totalApplications = Object.values(sc).reduce((a, b) => a + b, 0)
  const agentStats = dashData?.agentStats || []
  const maxTotal = Math.max(...agentStats.map(a => a.total || 0), 1)

  return (
    <div className="supervisor-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="10" r="7" fill="white" opacity="0.9"/>
                <path d="M8 6 L12 17 L16 6" stroke="#f5931d" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div>
              <div className="sidebar-brand-name">Victory Connect</div>
              <div className="sidebar-brand-sub">Supervisor Portal</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{user?.role}</div>
          </div>
          <button className="sidebar-nav-item" onClick={handleLogout} style={{ color: 'var(--red-500)' }}>
            <span style={{ display: 'flex' }}><LogOut size={20} /></span><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="supervisor-main">
        {activeView === 'dashboard' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: '0.25rem' }}>
                Overview
              </h1>
              <p className="text-secondary text-sm">
                {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                <StatCard variant="hero" value={sc.approved} label="Approved" icon={<CircleCheck size={28} />} color="var(--color-accent)" bg="var(--color-accent-light)" />
                <StatCard variant="hero" value={totalApplications} label="Total Applications" icon={<ClipboardList size={28} />} color="var(--navy-900)" bg="var(--navy-50)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-5)' }}>
                <StatCard value={sc.submitted} label="Submitted" icon={<Send size={20} />} color="var(--color-primary-blue)" bg="var(--color-primary-blue-light)" />
                <StatCard value={sc.under_review} label="Under Review" icon={<Search size={20} />} color="var(--amber-600)" bg="var(--amber-100)" />
                <StatCard value={sc.requires_information} label="Requires Attention" icon={<TriangleAlert size={20} />} color="var(--red-600)" bg="var(--red-100)" />
                <StatCard value={sc.draft} label="Drafts" icon={<FileText size={20} />} color="var(--slate-600)" bg="var(--slate-100)" />
                {sc.incomplete > 0 && <StatCard value={sc.incomplete} label="Incomplete" icon={<FileWarning size={20} />} color="var(--slate-500)" bg="var(--slate-100)" />}
                {sc.declined > 0 && <StatCard value={sc.declined} label="Declined" icon={<CircleX size={20} />} color="var(--red-600)" bg="var(--red-50)" />}
              </div>
            </div>

            {/* Agent performance */}
            <div className="card mb-8">
              <div className="card-header">
                <span className="font-semibold">Agent Performance</span>
                <span className="text-sm text-muted">{agentStats.length} agents</span>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th style={{ minWidth: '150px' }}>Performance / Progress</th>
                      <th style={{ textAlign: 'center' }}>Submitted</th>
                      <th style={{ textAlign: 'center' }}>Approved</th>
                      <th style={{ textAlign: 'center' }}>Draft / Incomplete</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentStats.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No agents found</td></tr>
                    ) : agentStats.map(agent => {
                      const st = getAgentStatus(agent)
                      const isInactive = st.label === 'Inactive'
                      return (
                        <tr key={agent.id} style={{ opacity: isInactive ? 0.6 : 1 }}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: isInactive ? 'var(--slate-500)' : 'var(--color-text)' }}>{agent.agent_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {agent.last_activity ? new Date(agent.last_activity).toLocaleDateString('en-ZA') : 'Never'}
                            </div>
                          </td>
                          <td>
                            <AgentProgressBar value={agent.total || 0} max={maxTotal} bg={st.barColor} />
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{agent.submitted || 0}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--green-600)' }}>{agent.approved || 0}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--amber-600)' }}>{(agent.drafts || 0) + (agent.incomplete || 0)}</td>
                          <td>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: st.color }}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily activity */}
            {dashData?.dailyStats?.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="font-semibold">Applications — Last 14 Days</span></div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '80px' }}>
                    {dashData.dailyStats.map(d => {
                      const maxCount = Math.max(...dashData.dailyStats.map(x => x.count || 0), 1)
                      const height = Math.max(Math.round(((d.count || 0) / maxCount) * 70), 4)
                      return (
                        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }} title={`${d.date}: ${d.count}`}>
                          <div style={{ width: '100%', height: `${height}px`, background: 'var(--navy-900)', borderRadius: '3px 3px 0 0', minHeight: '4px' }} />
                          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'center', display: 'block', marginTop: '2px' }}>
                            {d.date?.slice(5)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'applications' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: '0.5rem' }}>All Applications</h1>
            </div>

            {/* Filters */}
            <div className="filter-bar">
              <select className="form-select" style={{ maxWidth: '180px' }} value={filterAgent} onChange={e => setFilterAgent(e.target.value)}>
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
              </select>
              <select className="form-select" style={{ maxWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {['draft','incomplete','submitted','under_review','requires_information','approved','declined'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input type="date" className="form-input" style={{ maxWidth: '150px' }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="From" />
                <span className="text-muted">—</span>
                <input type="date" className="form-input" style={{ maxWidth: '150px' }} value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="To" />
              </div>
              {(filterAgent || filterStatus || filterFrom || filterTo) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setFilterAgent(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); }}>
                  Clear Filters
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Client</th>
                    <th>Agent</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allApps.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No applications found</td></tr>
                  ) : allApps.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{app.reference_number}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {app.client_first_name ? `${app.client_first_name} ${app.client_last_name}` : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{app.client_mobile}</div>
                      </td>
                      <td>{app.agent_name || '—'}</td>
                      <td>{app.product_name || '—'}</td>
                      <td><StatusBadge status={app.status} /></td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(app.updated_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td>
                        <Link to={`/applications/${app.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={16} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{allApps.length} results</p>
          </>
        )}

        {activeView === 'agents' && (
          <>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: '1.5rem' }}>Field Agents</h1>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--navy-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                            {a.first_name?.[0]}{a.last_name?.[0]}
                          </div>
                          <span style={{ fontWeight: 600 }}>{a.first_name} {a.last_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{a.email}</td>
                      <td>{a.branch_name || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: a.is_active ? 'var(--green-600)' : 'var(--red-600)', fontWeight: 600 }}>
                          <span className={`status-dot ${a.is_active ? 'online' : 'offline'}`} />
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
