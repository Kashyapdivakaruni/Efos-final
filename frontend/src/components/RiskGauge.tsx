interface RiskGaugeProps {
  label: string
  value: number
  icon: string
  color: string
}

function getRiskLevel(value: number): { label: string; color: string } {
  if (value < 20) return { label: 'Optimal', color: '#10b981' } // green
  if (value < 40) return { label: 'Good', color: '#3b82f6' }    // blue
  if (value < 60) return { label: 'Elevated', color: '#f59e0b' } // yellow/orange
  if (value < 80) return { label: 'Action Needed', color: '#f97316' } // orange
  return { label: 'Consult Doctor', color: '#ef4444' } // red, but less aggressive wording
}

export default function RiskGauge({ label, value, icon, color }: RiskGaugeProps) {
  const { label: riskLabel, color: riskColor } = getRiskLevel(value)
  const angle = (value / 100) * 180 - 90
  const r = 52
  const cx = 60, cy = 60
  const arcStart = { x: cx - r, y: cy }
  const arcEnd = { x: cx + r, y: cy }
  const needleX = cx + r * 0.75 * Math.cos((angle * Math.PI) / 180)
  const needleY = cy + r * 0.75 * Math.sin((angle * Math.PI) / 180)

  return (
    <div className="glass-card" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent, ${riskColor}, transparent)`,
        opacity: 0.8
      }} />

      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>

      <svg viewBox="0 0 120 70" style={{ width: '120px', height: '70px', margin: '0 auto 8px', display: 'block' }}>
        {/* Background arc */}
        <path d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
        {/* Low zone */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * 0.59} ${cy - r * 0.81}`}
          fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        {/* Medium zone */}
        <path d={`M ${cx - r * 0.59} ${cy - r * 0.81} A ${r} ${r} 0 0 1 ${cx + r * 0.59} ${cy - r * 0.81}`}
          fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        {/* High zone */}
        <path d={`M ${cx + r * 0.59} ${cy - r * 0.81} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke={riskColor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={riskColor} opacity="0.9" />
      </svg>

      <div style={{ fontSize: '28px', fontWeight: 800, color: riskColor, lineHeight: 1 }}>
        {value.toFixed(0)}%
      </div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: riskColor, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {riskLabel}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}
