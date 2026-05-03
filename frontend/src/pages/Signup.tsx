import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'patient' | 'doctor'>('patient')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'M',
    height_cm: '170',
    smoker: false,
    family_history_diabetes: false,
    family_history_cardiac: false,
    glucose_baseline: '95',
    cholesterol_baseline: '190',
    hdl_baseline: '55',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required')
      return
    }

    setLoading(true)
    try {
      const payload = role === 'patient' ? {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age) || 30,
        gender: formData.gender,
        height_cm: parseFloat(formData.height_cm) || 170,
        smoker: formData.smoker,
        family_history_diabetes: formData.family_history_diabetes,
        family_history_cardiac: formData.family_history_cardiac,
        glucose_baseline: parseFloat(formData.glucose_baseline) || 95,
        cholesterol_baseline: parseFloat(formData.cholesterol_baseline) || 190,
        hdl_baseline: parseFloat(formData.hdl_baseline) || 55,
      } : { name: formData.name, email: formData.email, password: formData.password }

      await axios.post(role === 'patient' ? '/api/auth/register' : '/api/auth/register-doctor', payload)
      await login(formData.email, formData.password, role === 'patient' ? 'patient' : 'doctor')
      navigate(role === 'patient' ? '/patient' : '/doctor')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '24px', boxShadow: '0 0 40px rgba(124,92,252,0.4)'
          }}>❤️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}><span className="gradient-text">PrediHealth</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>Create your account</p>
        </div>

        {/* Role Toggle */}
        <div className="glass-card" style={{ padding: '6px', display: 'flex', marginBottom: '20px', gap: '4px' }}>
          {(['patient', 'doctor'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px', transition: 'all 0.3s ease',
              background: role === r ? 'linear-gradient(135deg, #7c5cfc, #4f8ef7)' : 'transparent',
              color: role === r ? 'white' : 'var(--text-secondary)',
            }}>
              {r === 'patient' ? '👤 Patient' : '🩺 Doctor'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="glass-card" style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: '#fca5a5', fontSize: '13px'
            }}>{error}</div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }}
              required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }}
              required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }}
              required />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }}
              required />

            {role === 'patient' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange}
                    style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }} />
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' }}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" name="smoker" checked={formData.smoker} onChange={handleChange}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Smoker
                </label>
              </>
            )}

            <button type="submit" disabled={loading}
              style={{
                padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', color: 'white', fontWeight: 600, fontSize: '14px',
                opacity: loading ? 0.6 : 1, transition: 'all 0.3s ease'
              }}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account? <a href="/login" style={{ color: '#7c5cfc', textDecoration: 'none' }}>Sign In</a>
          </p>
        </div>
      </div>
    </div>
  )
}
