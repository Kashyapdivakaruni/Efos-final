import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function getValueStatus(key: string, value: any): { status: 'normal' | 'high' | 'low', reference: string } {
  const val = parseFloat(value);
  const ranges: any = {
    'bp_systolic': { normal: [90, 140], high: 140 },
    'bp_diastolic': { normal: [60, 90], high: 90 },
    'glucose': { normal: [70, 110], high: 126 },
    'cholesterol': { normal: [0, 200], high: 240 },
    'triglycerides': { normal: [0, 150], high: 200 },
    'hdl': { normal: [40, 100], low: 40 },
    'ldl': { normal: [0, 100], high: 130 },
  };
  
  const range = ranges[key];
  if (!range) return { status: 'normal', reference: 'N/A' };
  
  if (range.low && val < range.low) return { status: 'low', reference: `Should be >>${range.low}` };
  if (range.high && val > range.high) return { status: 'high', reference: `Should be ≤${range.high}` };
  return { status: 'normal', reference: `Normal range: ${range.normal?.[0]}-${range.normal?.[1]}` };
}

export function LabReportUpload() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type)
      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleUpload = async () => {
    console.log('=== Upload Start ===')
    console.log('User:', user)
    console.log('File:', file)
    
    if (!file) {
      setError('❌ Please select a file first')
      return
    }
    
    if (!user) {
      setError('❌ Not logged in')
      return
    }
    
    if (!user.id) {
      setError('❌ User ID not available')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('Creating FormData...')
      const formData = new FormData()
      formData.append('file', file)
      
      const patientId = user.id
      console.log(`Uploading to patient ${patientId}`)
      
      // Build URL
      const baseUrl = 'http://localhost:8000' 
      const endpoint = `/api/ingest/report`
      const params = `?patient_id=${patientId}`
      const fullUrl = baseUrl + endpoint + params
      
      console.log('Full URL:', fullUrl)
      console.log('axios baseURL:', axios.defaults.baseURL)
      
      // Make request
      const response = await axios.post(fullUrl, formData, {
        timeout: 120000,  // 2 minutes
        validateStatus: () => true  // Don't throw on any status code
      })
      
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)
      
      if (response.status === 200 && response.data.predictions) {
        console.log('✅ Upload successful!')
        setResult(response.data)
        setFile(null)
        setTimeout(() => window.location.reload(), 2000)
      } else if (response.status >= 400) {
        setError(`❌ ${response.data?.detail || `Server error: ${response.status}`}`)
      } else {
        setError('❌ Unexpected response from server')
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err)
      console.error('Error name:', err.name)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
      
      if (err.code === 'ECONNABORTED') {
        setError('❌ Request timeout - backend took too long to respond')
      } else if (err.message.includes('Network Error')) {
        setError('❌ Network error - backend may not be running')
      } else {
        setError(`❌ ${err.message || 'Unknown error occurred'}`)
      }
    } finally {
      setLoading(false)
      console.log('=== Upload End ===')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📄 Upload Lab Report</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Upload medical reports (PDF/JPG). AI will extract values and update your predictions.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          color: '#fca5a5', fontSize: '13px'
        }}>{error}</div>
      )}

      <div style={{
        border: '2px dashed rgba(124,92,252,0.3)', borderRadius: '12px',
        padding: '32px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer',
        background: 'rgba(124,92,252,0.05)', transition: 'all 0.3s ease'
      }} onClick={() => document.getElementById('fileInput')?.click()}>
        <input id="fileInput" type="file" onChange={handleFileChange} style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png" />
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>
          {file ? file.name : 'Click to upload or drag & drop'}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>PDF, JPG, or PNG (Blood panels, Lipid profiles, etc.)</p>
      </div>

      <button onClick={handleUpload} disabled={loading || !file}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
          background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', color: 'white',
          fontWeight: 600, fontSize: '14px', cursor: loading || !file ? 'not-allowed' : 'pointer',
          opacity: loading || !file ? 0.6 : 1
        }}>
        {loading ? '🔄 Processing OCR...' : '✅ Analyze Report'}
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span>
              <span><strong>OCR Success:</strong> Report analyzed using {result.method}</span>
            </div>
          </div>

          {result.predictions && (
            <div style={{ padding: '16px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#fcd34d' }}>📊 Updated Risk Predictions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Cardiac:</span> <strong style={{ color: '#ef4444' }}>{result.predictions.cardiac_risk.toFixed(1)}%</strong></div>
                <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Diabetes:</span> <strong style={{ color: '#f59e0b' }}>{result.predictions.diabetes_risk.toFixed(1)}%</strong></div>
                <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Hypertension:</span> <strong style={{ color: '#7c5cfc' }}>{result.predictions.hypertension_risk.toFixed(1)}%</strong></div>
                <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Metabolic:</span> <strong style={{ color: '#22d3ee' }}>{result.predictions.metabolic_risk.toFixed(1)}%</strong></div>
              </div>
            </div>
          )}

          {result.parsed && (
            <div style={{ padding: '16px', background: 'rgba(124,92,252,0.05)', borderRadius: '8px', border: '1px solid rgba(124,92,252,0.2)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>📊 Medical Values</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                {result.parsed && Object.entries(result.parsed).map(([key, value]) => {
                  const { status, reference } = getValueStatus(key, value);
                  const statusColor = status === 'normal' ? '#10b981' : status === 'high' ? '#ef4444' : '#f59e0b';
                  const statusIcon = status === 'normal' ? '✅' : status === 'high' ? '🔴' : '⚠️';
                  return (
                    <div key={key} style={{ padding: '10px', background: `${statusColor}08`, borderRadius: '6px', border: `1px solid ${statusColor}20` }}>
                      <div style={{ fontWeight: 600, color: statusColor, marginBottom: '2px' }}>{statusIcon} {key.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{reference}</div>
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <strong>Report:</strong> {result.text_excerpt.substring(0, 150)}...
              </p>
            </div>
          )}

          <div style={{ marginTop: '12px', fontSize: '12px', padding: '10px', background: 'rgba(79,142,247,0.05)', borderRadius: '6px', border: '1px solid rgba(79,142,247,0.2)', color: 'var(--text-secondary)' }}>
            💡 Your dashboard predictions have been updated with new lab data. Refreshing in 1.5 seconds...
          </div>
        </div>
      )}
    </div>
  )
}


