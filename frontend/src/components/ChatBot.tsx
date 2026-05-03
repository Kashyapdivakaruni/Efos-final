import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface Message { role: 'user' | 'ai'; text: string }

export default function ChatBot({ patientId }: { patientId: number }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm your personal health AI. I have access to your vitals, risk scores, and health history. Ask me anything about your health — 'Why is my cardiac risk high?', 'What should I eat today?', or 'How can I improve my sleep?'" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await axios.post('/api/chat', { patient_id: patientId, message: msg })
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = ['Why is my cardiac risk high?', 'What should I eat today?', 'How can I improve my sleep?', 'Explain my SHAP analysis']

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', fontSize: '18px',
          background: 'linear-gradient(135deg, #7c5cfc, #4f8ef7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(124,92,252,0.4)'
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Health AI Assistant</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
            Powered by Ollama llama3.2
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'chat-user' : 'chat-ai'}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="chat-ai" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-purple)',
                animation: `pulse-ring 1s ease ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} style={{
              padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)',
              background: 'rgba(124,92,252,0.1)', color: 'var(--text-secondary)',
              fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input className="form-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your health..." style={{ flex: 1 }} />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary"
          style={{ padding: '12px 18px', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          ➤
        </button>
      </div>
    </div>
  )
}
