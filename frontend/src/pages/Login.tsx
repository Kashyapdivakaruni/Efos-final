import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'patient' | 'doctor'>('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoAccounts, setDemoAccounts] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password, role)
      navigate(role === 'patient' ? '/patient' : '/doctor')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (acc: any, r: 'patient' | 'doctor') => {
    setLoading(true)
    setError('')
    try {
      await login(acc.email, r === 'patient' ? 'password123' : 'doctor123', r)
      navigate(r === 'patient' ? '/patient' : '/doctor')
    } catch (err: any) {
      setError('Quick login failed')
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = async () => {
    try {
      const res = await axios.get('/api/auth/demo-accounts')
      setDemoAccounts(res.data)
    } catch (e) {
      setError('Could not load demo accounts — is the backend running?')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '28px', boxShadow: '0 0 40px rgba(124,92,252,0.4)'
          }}>❤️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="gradient-text">PrediHealth</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            AI-powered health analytics & risk prediction
          </p>
        </div>

        {/* Role Toggle */}
        <div className="glass-card" style={{ padding: '6px', display: 'flex', marginBottom: '24px', gap: '4px' }}>
          {(['patient', 'doctor'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.3s ease',
              background: role === r ? 'linear-gradient(135deg, #7c5cfc, #4f8ef7)' : 'transparent',
              color: role === r ? 'white' : 'var(--text-secondary)',
              boxShadow: role === r ? '0 4px 15px rgba(124,92,252,0.3)' : 'none',
            }}>
              {r === 'patient' ? '👤 Patient' : '🩺 Doctor'}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
            Sign in as {role === 'patient' ? 'Patient' : 'Doctor'}
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
              color: '#fca5a5', fontSize: '14px'
            }}>{error}</div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Email
              </label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Password
              </label>
              <input className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            New to PrediHealth? <a href="/signup" style={{ color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
          </p>
          <button onClick={loadDemo} style={{
            width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-purple)',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500, padding: '12px', borderRadius: '8px', transition: 'all 0.3s ease'
          }}>
            🎯 Load demo accounts
          </button>
        </div>

        {demoAccounts && (
          <div className="glass-card fade-in" style={{ padding: '20px', marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo Patients</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {demoAccounts.patients.map((p: any) => (
                <button key={p.email} onClick={() => quickLogin(p, 'patient')}
                  className="btn-secondary" style={{ textAlign: 'left', padding: '10px 14px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>{p.email}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo Doctors</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demoAccounts.doctors.map((d: any) => (
                <button key={d.email} onClick={() => quickLogin(d, 'doctor')}
                  className="btn-secondary" style={{ textAlign: 'left', padding: '10px 14px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
