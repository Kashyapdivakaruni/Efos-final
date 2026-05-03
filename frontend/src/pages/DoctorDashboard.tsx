import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function DoctorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null)
  const [patientDetail, setPatientDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    axios.get(`/api/dashboard/doctor/${user.id}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [user])

  const loadPatient = async (pid: number) => {
    setDetailLoading(true)
    setSelectedPatient(pid)
    try {
      const res = await axios.get(`/api/patient/${pid}/detail`)
      setPatientDetail(res.data)
    } finally {
      setDetailLoading(false)
    }
  }

  const dismissAlert = async (id: number) => {
    await axios.put(`/api/alerts/${id}/read`)
    setData((prev: any) => ({ ...prev, critical_alerts: prev.critical_alerts.filter((a: any) => a.id !== id) }))
  }

  const getRiskColor = (v: number) => v >= 60 ? '#ef4444' : v >= 40 ? '#f59e0b' : v >= 20 ? '#4f8ef7' : '#10b981'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🩺</div>Loading dashboard...
      </div>
    </div>
  )

  return (
    <div className="layout">
      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❤️</div>
          <span style={{ fontWeight: 800, fontSize: '16px' }} className="gradient-text">PrediHealth</span>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>🩺 {data?.doctor?.specialty}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: 'Total Patients', value: data?.stats?.total_patients || 0, color: '#4f8ef7' },
            { label: 'Critical Cases', value: data?.stats?.critical_count || 0, color: '#ef4444' },
            { label: 'High Risk', value: data?.stats?.high_risk_count || 0, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px' }}>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Sign Out</button>
        </div>
      </div>

      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Doctor Dashboard 🩺</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>Risk-sorted triage — critical cases at top</p>
        </div>

        {data?.critical_alerts?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🚨 Active Critical Alerts ({data.critical_alerts.length})
            </div>
            {data.critical_alerts.map((a: any) => (
              <div key={a.id} className="alert-flash" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🚨</span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 600 }}>{a.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(a.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadPatient(a.patient_id)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>View →</button>
                  <button onClick={() => dismissAlert(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '380px 1fr' : '1fr', gap: '24px' }}>
          {/* Triage List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Patients ({data?.patients?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data?.patients?.map((p: any) => (
                <div key={p.id} onClick={() => loadPatient(p.id)} className="glass-card" style={{
                  padding: '16px', cursor: 'pointer',
                  borderColor: selectedPatient === p.id ? 'rgba(124,92,252,0.5)' : p.is_critical ? 'rgba(239,68,68,0.35)' : 'var(--border)',
                  background: selectedPatient === p.id ? 'rgba(124,92,252,0.08)' : p.is_critical ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.is_critical && <span className="alert-flash">🔴</span>}
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.age}y·{p.gender}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        BP: <b>{p.latest_bp}</b> · {p.last_checkin}
                      </div>
                    </div>
                    <div style={{ background: `rgba(${p.max_risk >= 60 ? '239,68,68' : p.max_risk >= 40 ? '245,158,11' : '79,142,247'}, 0.15)`, border: `1px solid ${getRiskColor(p.max_risk)}40`, borderRadius: '8px', padding: '4px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: getRiskColor(p.max_risk) }}>{p.max_risk}%</div>
                      <div style={{ fontSize: '9px', color: getRiskColor(p.max_risk), fontWeight: 600 }}>MAX RISK</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ l: '❤️ C', v: p.cardiac_risk, c: '#ef4444' }, { l: '🩸 D', v: p.diabetes_risk, c: '#f59e0b' }].map(r => (
                      <div key={r.l} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
                          <span style={{ color: r.c, fontWeight: 700 }}>{r.v}%</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${r.v}%`, background: r.c, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                    {p.unread_alerts > 0 && <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '10px', padding: '2px 8px', alignSelf: 'center', fontWeight: 700 }}>{p.unread_alerts}⚠</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedPatient && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Detail</div>
                <button onClick={() => { setSelectedPatient(null); setPatientDetail(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              {detailLoading ? (
                <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
              ) : patientDetail && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{patientDetail.patient?.name}</h2>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{patientDetail.patient?.age}y · {patientDetail.patient?.gender}</div>
                      </div>
                      {patientDetail.latest_checkin && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: patientDetail.latest_checkin.bp_systolic > 140 ? '#ef4444' : '#10b981' }}>
                            {patientDetail.latest_checkin.bp_systolic}/{patientDetail.latest_checkin.bp_diastolic}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>mmHg</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {patientDetail.risk_scores && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[['❤️ Cardiac', patientDetail.risk_scores.cardiac_risk, '#ef4444'], ['🩸 Diabetes', patientDetail.risk_scores.diabetes_risk, '#f59e0b'], ['🩺 Hypertension', patientDetail.risk_scores.hypertension_risk, '#7c5cfc'], ['⚡ Metabolic', patientDetail.risk_scores.metabolic_risk, '#22d3ee']].map(([l, v, c]: any) => (
                        <div key={l} className="glass-card" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{l}</span>
                            <span style={{ fontWeight: 800, fontSize: '18px', color: getRiskColor(v) }}>{v.toFixed(0)}%</span>
                          </div>
                          <div style={{ marginTop: '8px', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${v}%`, background: c, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {patientDetail.shap_values?.cardiac && (
                    <div className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '14px', fontSize: '14px' }}>🔍 Top Cardiac Risk Drivers</div>
                      {patientDetail.shap_values.cardiac.slice(0, 4).map(([feat, val]: [string, number]) => (
                        <div key={feat} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{feat.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: val > 0 ? '#ef4444' : '#10b981' }}>{val > 0 ? '+' : ''}{val.toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, Math.abs(val) * 5)}%`, background: val > 0 ? '#ef4444' : '#10b981', borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '14px', fontSize: '14px' }}>💡 AI Suggested Interventions</div>
                    {[
                      patientDetail.risk_scores?.cardiac_risk > 40 && '📋 Order comprehensive metabolic panel',
                      patientDetail.risk_scores?.diabetes_risk > 40 && '🩸 Schedule HbA1c & fasting glucose',
                      patientDetail.latest_checkin?.bp_systolic > 140 && '💊 Review antihypertensive medication',
                      patientDetail.latest_checkin?.sleep_hours < 6 && '😴 Refer to sleep specialist',
                      '📅 Schedule follow-up in 2 weeks',
                    ].filter(Boolean).map((s, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{s as string}</span>
                      </div>
                    ))}
                  </div>

                  {patientDetail.report && (
                    <div className="glass-card" style={{ padding: '20px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>🤖 AI Assessment</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>{patientDetail.report?.substring(0, 400)}...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
