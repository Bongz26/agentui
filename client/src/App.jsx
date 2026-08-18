import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore.js'
import { useOnlineStatus } from './hooks/useOnlineStatus.js'
import AppLayout from './components/layout/AppLayout.jsx'

// Pages
import LoginPage from './features/auth/LoginPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import ApplicationsListPage from './features/applications/ApplicationsListPage.jsx'
import ApplicationDetailPage from './features/applications/ApplicationDetailPage.jsx'
import WizardPage from './features/applications/wizard/WizardPage.jsx'
import SubmissionSuccessPage from './features/applications/SubmissionSuccessPage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import SupervisorDashboard from './features/supervisor/SupervisorDashboard.jsx'
import { LoadingSpinner } from './components/common/index.jsx'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AgentRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  const { refreshUser, isAuthenticated } = useAuthStore()
  useOnlineStatus()

  useEffect(() => {
    if (isAuthenticated) refreshUser()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Agent routes */}
        <Route path="/dashboard" element={<AgentRoute><DashboardPage /></AgentRoute>} />
        <Route path="/applications" element={<AgentRoute><ApplicationsListPage /></AgentRoute>} />
        <Route path="/applications/new" element={<AgentRoute><WizardPage /></AgentRoute>} />
        <Route path="/applications/:id/edit" element={<AgentRoute><WizardPage /></AgentRoute>} />
        <Route path="/applications/:id/success" element={<AgentRoute><SubmissionSuccessPage /></AgentRoute>} />
        <Route path="/applications/:id" element={<AgentRoute><ApplicationDetailPage /></AgentRoute>} />
        <Route path="/profile" element={<AgentRoute><ProfilePage /></AgentRoute>} />

        {/* Supervisor / Admin */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
