import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'

export default function DoctorPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list')

  useEffect(() => {
    // For demo: show the seeded patients
    // In production, would fetch from /api/doctors/{doctor_id}/patients
    axios.get('/api/dashboard/patient/1')
      .then(res => {
        setPatients([res.data])
      })
      .catch(() => {
        // Demo data
        setPatients([
          {
            id: 1,
            patient: { name: 'Arjun Sharma', age: 52, gender: 'M' },
            risk_scores: { cardiac_risk: 78, diabetes_risk: 65, hypertension_risk: 82, metabolic_risk: 71 },
            alerts: [{ severity: 'critical', message: 'Cardiac risk elevated' }],
            latest_checkin: { bp_systolic: 168, bp_diastolic: 105, heart_rate: 92 }
          }
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f1629, #1a2849)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏥</div>
          <div>Loading doctor dashboard...</div>
        </div>
      </div>
    )
  }

  const riskLevel = (value: number) => {
    if (value >= 75) return { label: 'CRITICAL', color: '#ef4444', icon: '🔴' }
    if (value >= 60) return { label: 'HIGH', color: '#f59e0b', icon: '🟠' }
    if (value >= 50) return { label: 'MODERATE', color: '#8b5cf6', icon: '🟡' }
    return { label: 'LOW', color: '#10b981', icon: '🟢' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1629, #1a2849)', color: 'white', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>🏥 Doctor Portal</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: '14px' }}>Patient Risk Management Dashboard</p>
          </div>
          <div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>👨‍⚕️ Dr. Smith</div>
            <button onClick={logout} style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer'
            }}>
              Logout
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Patients', value: patients.length, icon: '👥', color: '#4f8ef7' },
            { label: 'Critical Alerts', value: patients.filter(p => p.alerts?.some((a: any) => a.severity === 'critical')).length, icon: '🚨', color: '#ef4444' },
            { label: 'Avg Cardiac Risk', value: Math.round(patients.reduce((sum: number, p: any) => sum + (p.risk_scores?.cardiac_risk || 0), 0) / patients.length) + '%', icon: '❤️', color: '#f59e0b' },
            { label: 'Avg BP', value: Math.round(patients.reduce((sum: number, p: any) => sum + (p.latest_checkin?.bp_systolic || 0), 0) / patients.length) + ' mmHg', icon: '🩺', color: '#7c5cfc' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '20px', 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${stat.color}20`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              cursor: 'default',
            }} onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = `${stat.color}40`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}15`;
            }} onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = `${stat.color}20`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontWeight: 600 }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Patients List / Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'list' ? '1fr' : '400px 1fr', gap: '16px' }}>
          {/* Patient List */}
          <div style={{
            padding: '20px', 
            borderRadius: '12px', 
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>👥 Patient List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patients.map(p => {
                const hasHighRisk = Object.values(p.risk_scores || {}).some((v: any) => v >= 60);
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setActiveTab('detail'); }}
                    style={{
                      padding: '14px', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      background: selectedPatient?.id === p.id ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${selectedPatient?.id === p.id ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'all 0.2s ease',
                    }} onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }} onMouseLeave={(e) => {
                      if (selectedPatient?.id !== p.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.patient?.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                          {p.patient?.age}y • {p.patient?.gender}
                        </div>
                      </div>
                      {hasHighRisk && <div style={{ fontSize: '16px', animation: 'pulse 1.5s infinite' }}>🚨</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient Detail */}
          {selectedPatient && activeTab === 'detail' && (
            <div style={{
              padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{selectedPatient.patient?.name}</h3>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    {selectedPatient.patient?.age} years old • {selectedPatient.patient?.gender}
                  </div>
                </div>
                <button onClick={() => setActiveTab('list')} style={{
                  padding: '8px 12px', borderRadius: '6px', border: 'none',
                  background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer'
                }}>
                  ← Back
                </button>
              </div>

              {/* Latest Vitals */}
              {selectedPatient.latest_checkin && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>LATEST VITALS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>BP</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: selectedPatient.latest_checkin.bp_systolic > 140 ? '#ef4444' : '#10b981' }}>
                        {selectedPatient.latest_checkin.bp_systolic}/{selectedPatient.latest_checkin.bp_diastolic}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Heart Rate</div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedPatient.latest_checkin.heart_rate} bpm</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Scoreboard */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px', color: 'rgba(255,255,255,0.7)' }}>RISK ASSESSMENT</div>
                {selectedPatient.risk_scores && Object.entries(selectedPatient.risk_scores).map(([key, value]: [string, any]) => {
                  const risk = riskLevel(value);
                  return (
                    <div key={key} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                        <span>{key.replace(/_risk/, '').replace(/_/g, ' ').toUpperCase()}</span>
                        <span style={{ color: risk.color, fontWeight: 700 }}>{risk.icon} {Math.round(value)}%</span>
                      </div>
                      <div style={{
                        height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%', width: `${Math.min(value, 100)}%`,
                          background: risk.color, transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alerts */}
              {selectedPatient.alerts?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px', color: 'rgba(255,255,255,0.7)' }}>ALERTS</div>
                  {selectedPatient.alerts.map((alert: any, i: number) => (
                    <div key={i} style={{
                      padding: '10px', borderRadius: '6px', marginBottom: '8px',
                      background: alert.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                    }}>
                      <div style={{ fontSize: '12px', color: alert.severity === 'critical' ? '#fca5a5' : '#fcd34d' }}>
                        {alert.severity === 'critical' ? '🔴' : '🟡'} {alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
