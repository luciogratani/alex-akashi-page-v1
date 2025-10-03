import { useState, useEffect } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    // Simple authentication check using localStorage
    const adminEmail = localStorage.getItem('admin_email')
    const adminPassword = localStorage.getItem('admin_password')
    const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD

    if (adminEmail === expectedEmail && adminPassword === expectedPassword) {
      setIsAuthenticated(true)
    }
    
    setIsLoading(false)
  }

  const handleLogin = (email: string, password: string) => {
    const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD

    if (email === expectedEmail && password === expectedPassword) {
      // Store credentials in localStorage
      localStorage.setItem('admin_email', email)
      localStorage.setItem('admin_password', password)
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid credentials')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_email')
    localStorage.removeItem('admin_password')
    setIsAuthenticated(false)
    setError('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-alex-bg flex items-center justify-center">
        <div className="text-alex-accent font-mono">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={error} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}
