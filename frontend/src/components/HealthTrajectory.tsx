import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrajectoryProps {
  trajectory: Array<{ day: number; current: { cardiac: number; diabetes: number }; improved: { cardiac: number; diabetes: number } }>
  riskHistory: Array<{ date: string; cardiac: number; diabetes: number; hypertension: number; metabolic: number }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card" style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.15)' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: p.color }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function HealthTrajectory({ trajectory, riskHistory }: TrajectoryProps) {
  const [view, setView] = useState<'trajectory' | 'history'>('history')

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Health Trajectory</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            {view === 'trajectory' ? '90-day risk projection' : '30-day risk history'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['history', 'trajectory'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.3s',
              background: view === v ? 'linear-gradient(135deg, #7c5cfc, #4f8ef7)' : 'rgba(255,255,255,0.05)',
              color: view === v ? 'white' : 'var(--text-secondary)',
            }}>
              {v === 'history' ? '📊 History' : '🔮 90-Day'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {view === 'history' ? (
          <LineChart data={riskHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#8892b0', paddingTop: '12px' }} />
            <Line type="monotone" dataKey="cardiac" stroke="#ef4444" strokeWidth={2} dot={false} name="Cardiac" />
            <Line type="monotone" dataKey="diabetes" stroke="#f59e0b" strokeWidth={2} dot={false} name="Diabetes" />
            <Line type="monotone" dataKey="hypertension" stroke="#7c5cfc" strokeWidth={2} dot={false} name="Hypertension" />
            <Line type="monotone" dataKey="metabolic" stroke="#22d3ee" strokeWidth={2} dot={false} name="Metabolic" />
          </LineChart>
        ) : (
          <LineChart data={trajectory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `Day ${v}`} />
            <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#8892b0', paddingTop: '12px' }} />
            <Line type="monotone" dataKey="current.cardiac" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Current Cardiac" />
            <Line type="monotone" dataKey="improved.cardiac" stroke="#10b981" strokeWidth={2} dot={false} name="If I improve" />
          </LineChart>
        )}
      </ResponsiveContainer>

      {view === 'trajectory' && (
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'rgba(16,185,129,0.08)', borderRadius: '10px',
          border: '1px solid rgba(16,185,129,0.2)', fontSize: '13px', color: '#6ee7b7'
        }}>
          💡 <strong>What-if:</strong> Following your daily action plan could reduce cardiac risk by up to 30% over 90 days
        </div>
      )}
    </div>
  )
}
