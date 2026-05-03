import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function CheckIn() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    bp_systolic: 120, bp_diastolic: 80, weight: 70.0,
    mood: 7, sleep_hours: 7.0, spo2: 97.0, heart_rate: 75, glucose: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const update = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const [mode, setMode] = useState<'manual' | 'upload'>('manual')
  const [file, setFile] = useState<File | null>(null)

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, glucose: form.glucose ? parseFloat(form.glucose as any) : null }
      const res = await axios.post(`/api/checkin/${user!.id}`, payload)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`/api/upload/lab-report?patient_id=${user!.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Fetch latest checkin result to show the same success screen
      const dbRes = await axios.post(`/api/checkin/${user!.id}`, {
        bp_systolic: res.data.metrics_extracted.bp_systolic || 120,
        bp_diastolic: res.data.metrics_extracted.bp_diastolic || 80,
        weight: res.data.metrics_extracted.weight || 70,
        mood: 7,
        sleep_hours: res.data.metrics_extracted.sleep_hours || 7,
        spo2: res.data.metrics_extracted.spo2 || 98,
        heart_rate: res.data.metrics_extracted.heart_rate || 75,
        glucose: res.data.metrics_extracted.glucose || null
      })
      setResult(dbRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', min: 70, max: 220, step: 1, icon: '🩺' },
    { key: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', min: 40, max: 140, step: 1, icon: '💉' },
    { key: 'weight', label: 'Weight', unit: 'kg', min: 30, max: 200, step: 0.5, icon: '⚖️' },
    { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', min: 40, max: 160, step: 1, icon: '💓' },
    { key: 'spo2', label: 'SpO2', unit: '%', min: 80, max: 100, step: 0.5, icon: '🫁' },
    { key: 'sleep_hours', label: 'Sleep Hours', unit: 'hrs', min: 0, max: 14, step: 0.5, icon: '😴' },
  ]

  const riskColor = (v: number) => v >= 60 ? '#ef4444' : v >= 40 ? '#f59e0b' : v >= 20 ? '#4f8ef7' : '#10b981'

  if (result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Check-In Complete!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Your AI has analysed your vitals</p>
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            {Object.entries(result.risks).map(([k, v]: any) => (
              <div key={k} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: riskColor(v) }}>{v.toFixed(0)}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                  {k.replace('_risk', '').replace('_', ' ')} Risk
                </div>
              </div>
            ))}
          </div>

          {result.alerts_generated > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#fca5a5' }}>
              🚨 {result.alerts_generated} alert{result.alerts_generated > 1 ? 's' : ''} generated — your doctor has been notified
            </div>
          )}

          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '15px' }}>🤖 Your AI Health Report</div>
            {result.report?.split('\n\n').map((p: string, i: number) => (
              <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '12px' }}>{p}</p>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/patient')}>
              View Dashboard →
            </button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setResult(null); setFile(null) }}>
              New Check-In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '540px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/patient')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Daily Check-In</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Log your vitals for AI analysis</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button 
                onClick={() => setMode('manual')}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: mode === 'manual' ? 'var(--card-bg)' : 'transparent', color: mode === 'manual' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                ✍️ Manual Entry
            </button>
            <button 
                onClick={() => setMode('upload')}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: mode === 'upload' ? 'var(--card-bg)' : 'transparent', color: mode === 'upload' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                📄 Upload Report
            </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#fca5a5', fontSize: '14px' }}>{error}</div>
        )}

        {mode === 'manual' ? (
            <form onSubmit={submitManual}>
            <div className="grid-2" style={{ marginBottom: '16px' }}>
                {fields.map(f => (
                <div key={f.key} className="glass-card" style={{ padding: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                    {f.icon} {f.label}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="range" min={f.min} max={f.max} step={f.step}
                        value={form[f.key as keyof typeof form] as number}
                        onChange={e => update(f.key, parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--accent-purple)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, minWidth: '52px', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {form[f.key as keyof typeof form]} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{f.unit}</span>
                    </span>
                    </div>
                </div>
                ))}
            </div>

            {/* Mood */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 500 }}>😊 Mood Today</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button type="button" key={n} onClick={() => update('mood', n)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    background: form.mood === n ? 'linear-gradient(135deg, #7c5cfc, #4f8ef7)' : 'rgba(255,255,255,0.05)',
                    color: form.mood === n ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                    }}>{n}</button>
                ))}
                </div>
            </div>

            {/* Optional glucose */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                🩸 Blood Glucose (optional)
                </label>
                <input className="form-input" type="number" placeholder="e.g. 95 mg/dL"
                value={form.glucose} onChange={e => update('glucose', e.target.value)} />
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                {loading ? '🔬 Analysing with AI...' : '🚀 Submit Check-In'}
            </button>
            </form>
        ) : (
            <form onSubmit={submitUpload}>
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <h3 style={{ marginBottom: '8px' }}>Upload Medical Report</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Upload your PDF lab report. Our AI will automatically extract your vitals and run a risk analysis.</p>
                    <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                        style={{ display: 'block', margin: '0 auto', color: 'var(--text-secondary)' }}
                    />
                </div>
                <button className="btn-primary" type="submit" disabled={loading || !file} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                    {loading ? '🤖 AI is Reading Document...' : 'Extract & Analyze'}
                </button>
            </form>
        )}
      </div>
    </div>
  )
}
