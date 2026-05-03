import { useState, useEffect } from 'react'
import axios from 'axios'

interface Doctor {
  id: number
  name: string
  specialty: string
  rating: number
  hospital: string
}

export function DoctorBooking({ patientId }: { patientId: number }) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors/')
      setDoctors(res.data)
    } catch (e) {
      setMessage('Could not load doctors')
    }
  }

  const handleBook = async () => {
    if (!selectedDoctor || !appointmentDate) {
      setMessage('Please select a doctor and date')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/doctors/book', {
        patient_id: patientId,
        doctor_id: selectedDoctor,
        slot: appointmentDate,
      })
      setMessage('✅ Appointment booked successfully!')
      setSelectedDoctor(null)
      setAppointmentDate('')
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Book a Doctor</h3>

      {message && (
        <div style={{
          background: message.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.includes('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          color: message.includes('✅') ? '#86efac' : '#fca5a5', fontSize: '13px'
        }}>{message}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
        <select value={selectedDoctor || ''} onChange={e => setSelectedDoctor(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px'
          }}>
          <option value="">Select Doctor</option>
          {doctors.map(doc => (
            <option key={doc.id} value={doc.id}>
              {doc.name} • {doc.specialty} • ⭐ {doc.rating}
            </option>
          ))}
        </select>

        <input type="datetime-local" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
          style={{
            padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px'
          }} />

        <button onClick={handleBook} disabled={loading}
          style={{
            padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)', color: 'white', fontWeight: 600, fontSize: '14px'
          }}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </div>
    </div>
  )
}
