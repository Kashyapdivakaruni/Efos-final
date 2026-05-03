import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Set API base URL - supports both development and production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
axios.defaults.baseURL = API_BASE_URL

interface User {
  id: number
  name: string
  role: 'patient' | 'doctor'
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('predihealth_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`
      localStorage.setItem('predihealth_user', JSON.stringify(user))
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('predihealth_user')
    }
  }, [user])

  const login = async (email: string, password: string, role: string) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password, role })
    const u: User = {
      id: res.data.user_id,
      name: res.data.name,
      role: res.data.role,
      token: res.data.access_token,
    }
    setUser(u)
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
