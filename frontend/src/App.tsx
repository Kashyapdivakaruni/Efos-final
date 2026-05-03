import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PatientDashboard from './pages/PatientDashboard'
import DoctorPortal from './pages/DoctorPortal'
import CheckIn from './pages/CheckIn'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <div className="bg-dots" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/patient" element={
            <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/checkin" element={
            <ProtectedRoute role="patient"><CheckIn /></ProtectedRoute>
          } />
          <Route path="/doctor" element={
            <ProtectedRoute role="doctor"><DoctorPortal /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
