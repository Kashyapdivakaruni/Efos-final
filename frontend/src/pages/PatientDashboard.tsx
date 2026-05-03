import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import RiskGauge from '../components/RiskGauge'
import HealthTrajectory from '../components/HealthTrajectory'
import ChatBot from '../components/ChatBot'
import TodoList from '../components/TodoList'
import { DoctorBooking } from '../components/DoctorBooking'
import { LabReportUpload } from '../components/LabReportUpload'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'chat' | 'history' | 'doctor'>('overview')
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    axios.get(`/api/dashboard/patient/${user.id}`)
      .then(res => {
        setData(res.data)
        setAlerts(res.data.alerts || [])
      })
      .finally(() => setLoading(false))
  }, [user])

  const dismissAlert = async (id: number) => {
    await axios.put(`/api/alerts/${id}/read`)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>❤️</div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading your health data...</div>
        </div>
      </div>
    )
  }

  const risks = data?.risk_scores
  const checkin = data?.latest_checkin
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')

  const tabButtonStyle = (isActive: boolean) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    padding: '11px 14px',
    borderRadius: '10px', 
    border: 'none', 
    cursor: 'pointer', 
    width: '100%', 
    textAlign: 'left',
    background: isActive ? 'rgba(124,92,252,0.15)' : 'transparent',
    color: isActive ? 'var(--accent-purple)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 400, 
    fontSize: '14px',
    borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
    transition: 'all 0.2s ease',
  })

  const sidebar = (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️</div>
        <span style={{ fontWeight: 800, fontSize: '16px' }} className="gradient-text">PrediHealth</span>
      </div>

      <div style={{ marginBottom: '8px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Patient · {data?.patient?.age}y · {data?.patient?.gender}</div>
      </div>

      <nav style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[
          { id: 'overview', icon: '📊', label: 'Overview' },
          { id: 'report', icon: '📄', label: 'AI Health Report' },
          { id: 'chat', icon: '🤖', label: 'Health AI Chat' },
          { id: 'doctor', icon: '🏥', label: 'Doctor Booking' },
          { id: 'history', icon: '📈', label: 'History' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} style={tabButtonStyle(activeTab === item.id) as React.CSSProperties}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px' }}>
        <button onClick={() => navigate('/checkin')} className="btn-primary" style={{ width: '100%', marginBottom: '8px', fontSize: '13px' }}>
          ➕ Daily Check-In
        </button>
        <button onClick={logout} className="btn-secondary" style={{ width: '100%', fontSize: '13px' }}>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="layout">
      {sidebar}
      <main className="main-content">
        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {criticalAlerts.map(a => (
              <div key={a.id} className="alert-flash" style={{
                background: 'rgba(239,68,68,0.12)', 
                border: '1.5px solid rgba(239,68,68,0.4)',
                borderRadius: '12px', 
                padding: '14px 18px', 
                marginBottom: '8px',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                animation: 'pulse 2s infinite',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', animation: 'bounce 1s infinite' }}>🚨</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#fca5a5', letterSpacing: '0.3px' }}>CRITICAL ALERT</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.message}</div>
                  </div>
                </div>
                <button onClick={() => dismissAlert(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>Here's your health overview for today</p>
            </div>

            {/* Vitals Row */}
            {checkin && (
              <div className="grid-4" style={{ marginBottom: '24px' }}>
                {[
                  { label: 'Blood Pressure', value: `${checkin.bp_systolic}/${checkin.bp_diastolic}`, unit: 'mmHg', icon: '🩺', color: checkin.bp_systolic > 140 ? '#ef4444' : '#10b981' },
                  { label: 'Heart Rate', value: checkin.heart_rate, unit: 'bpm', icon: '💓', color: '#4f8ef7' },
                  { label: 'SpO2', value: `${checkin.spo2?.toFixed(0)}`, unit: '%', icon: '🫁', color: checkin.spo2 < 94 ? '#ef4444' : '#10b981' },
                  { label: 'Sleep', value: checkin.sleep_hours?.toFixed(1), unit: 'hrs', icon: '😴', color: checkin.sleep_hours < 6 ? '#f59e0b' : '#10b981' },
                ].map(v => (
                  <div key={v.label} className="glass-card" style={{ 
                    padding: '20px', 
                    position: 'relative', 
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    border: `1px solid ${v.color}20`,
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${v.color}15`;
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${v.color}, transparent)`, opacity: 0.7 }} />
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{v.icon}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: v.color, letterSpacing: '-0.5px' }}>{v.value} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{v.unit}</span></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>{v.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Gauges */}
            {risks && (
              <div className="grid-4" style={{ marginBottom: '24px' }}>
                <RiskGauge label="Cardiac Risk" value={risks.cardiac_risk} icon="❤️" color="#ef4444" />
                <RiskGauge label="Diabetes Risk" value={risks.diabetes_risk} icon="🩸" color="#f59e0b" />
                <RiskGauge label="Hypertension" value={risks.hypertension_risk} icon="🩺" color="#7c5cfc" />
                <RiskGauge label="Metabolic" value={risks.metabolic_risk} icon="⚡" color="#22d3ee" />
              </div>
            )}

            {/* SHAP Bar Chart */}
            {data?.shap_values?.cardiac && (
              <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>🔍 AI Risk Drivers — Cardiac</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Why your cardiac risk is at this level (SHAP analysis)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.shap_values.cardiac.slice(0,5).map(([k, v]: [string, number]) => ({ name: k.replace(/_/g, ' '), value: Math.abs(v), positive: v > 0 }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip formatter={(v: any) => `${v.toFixed(2)}% impact`} contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bottom Grid: Todos + Trajectory */}
            <div className="grid-2">
              <TodoList todos={data?.todos || []} patientId={user!.id} />
              {data?.risk_history?.length > 0 && (
                <HealthTrajectory trajectory={data.trajectory || []} riskHistory={data.risk_history || []} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>📄 Your AI Health Report</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Generated from today's vitals + SHAP analysis → Ollama llama3.2</p>
            {data?.report ? (
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>PrediHealth AI</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Personalized health analysis</div>
                  </div>
                </div>
                {data.report.split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px', marginBottom: '20px' }}>{para}</p>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ color: 'var(--text-secondary)' }}>Complete a check-in to generate your AI health report</div>
                <button onClick={() => navigate('/checkin')} className="btn-primary" style={{ marginTop: '20px' }}>Start Check-In →</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>🤖 Health AI Chat</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Ask anything — your AI knows your full health profile</p>
            <ChatBot patientId={user!.id} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>📈 30-Day Health History</h2>
            {data?.risk_history?.length > 0 ? (
              <HealthTrajectory trajectory={data.trajectory || []} riskHistory={data.risk_history || []} />
            ) : (
              <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>No history yet — complete check-ins to see trends</div>
            )}

            {data?.history?.length > 0 && (
              <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>BP History</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.history.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#8892b0', fontSize: 10 }} tickLine={false} axisLine={false} domain={[60, 200]} />
                    <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="bp_systolic" fill="#ef4444" name="Systolic" radius={[2, 2, 0, 0]} opacity={0.8} />
                    <Bar dataKey="bp_diastolic" fill="#7c5cfc" name="Diastolic" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid-2" style={{ marginTop: '24px' }}>
              <div className="glass-card">
                <LabReportUpload />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>🏥 Find & Book a Doctor</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Connect with a specialist matched to your needs</p>
            
            {/* Specialist Recommendations Based on Risks */}
            {data?.specialist_recommendations && data.specialist_recommendations.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '15px', letterSpacing: '0.3px' }}>📋 Recommended Specialists</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.specialist_recommendations.map((rec: any, idx: number) => {
                    const priorityColor = rec.priority === 'urgent' ? '#ef4444' : rec.priority === 'high' ? '#f59e0b' : '#8b5cf6';
                    const priorityLabel = rec.priority === 'urgent' ? '🔴 URGENT' : rec.priority === 'high' ? '🟠 HIGH' : '🟡 MODERATE';
                    return (
                      <div key={idx} className="glass-card" style={{ 
                        padding: '18px', 
                        border: `1.5px solid ${priorityColor}33`, 
                        background: `${priorityColor}08`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }} onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderColor = `${priorityColor}66`;
                        e.currentTarget.style.background = `${priorityColor}12`;
                      }} onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = `${priorityColor}33`;
                        e.currentTarget.style.background = `${priorityColor}08`;
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: priorityColor, marginBottom: '6px', fontSize: '15px' }}>{rec.specialist}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {rec.reason} • <span style={{ color: priorityColor, fontWeight: 600 }}>Risk: {rec.risk_level}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', background: `${priorityColor}25`, color: priorityColor, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                            {rec.priority === 'urgent' ? '24 hours' : rec.priority === 'high' ? '1 week' : '2 weeks'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Health Trajectory Warning */}
            {data?.health_trajectory && data.health_trajectory.bp_systolic_trend === 'worsening' && (
              <div className="glass-card" style={{ 
                padding: '16px', 
                marginBottom: '24px', 
                background: 'rgba(239,68,68,0.1)', 
                border: '1.5px solid rgba(239,68,68,0.3)',
                borderRadius: '12px',
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                  <span style={{ fontSize: '20px', animation: 'pulse 1.5s infinite' }}>⚠️</span>
                  <div style={{ fontSize: '13px', flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>Health is Worsening</div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.health_trajectory.overall_assessment}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card">
              <DoctorBooking patientId={user!.id} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
