import { useState } from 'react'
import axios from 'axios'

interface Todo { id: number; task: string; is_completed: boolean; source: string }

export default function TodoList({ todos: initialTodos, patientId }: { todos: Todo[]; patientId: number }) {
  const [todos, setTodos] = useState(initialTodos)

  const toggle = async (id: number, current: boolean) => {
    await axios.put(`/api/todos/${id}?is_completed=${!current}`)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !current } : t))
  }

  const completed = todos.filter(t => t.is_completed).length

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Today's Action Plan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            AI-generated personalised tasks
          </p>
        </div>
        <div style={{
          background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)',
          borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)'
        }}>
          {completed}/{todos.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: '20px' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #7c5cfc, #10b981)',
          width: `${todos.length ? (completed / todos.length) * 100 : 0}%`,
          transition: 'width 0.5s ease'
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {todos.map(todo => (
          <div key={todo.id} onClick={() => toggle(todo.id, todo.is_completed)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
              background: todo.is_completed ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${todo.is_completed ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
              transition: 'all 0.3s ease',
            }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: '2px',
              border: `2px solid ${todo.is_completed ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
              background: todo.is_completed ? '#10b981' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'white', transition: 'all 0.3s ease',
            }}>
              {todo.is_completed ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '14px', color: todo.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: todo.is_completed ? 'line-through' : 'none',
                transition: 'all 0.3s ease',
              }}>{todo.task}</span>
              <div style={{ marginTop: '2px' }}>
                <span style={{
                  fontSize: '11px', color: todo.source === 'doctor' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                  fontWeight: 600
                }}>
                  {todo.source === 'doctor' ? '🩺 Doctor' : '🤖 AI'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {todos.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '14px' }}>
          Complete a check-in to get your personalised action plan
        </div>
      )}
    </div>
  )
}
