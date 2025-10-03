import { useState } from 'react'

interface AdminLoginProps {
  onLogin: (email: string, password: string) => void
  error?: string
  isLoading?: boolean
}

export default function AdminLogin({ onLogin, error, isLoading }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="min-h-screen bg-alex-bg flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-mono text-alex-accent mb-2">ADMIN PANEL</h1>
          <p className="text-alex-subtitle font-mono text-sm">alex-akashi-v1</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-alex-accent font-mono text-sm mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
              placeholder="Ну, ты ж ведаеш…"
              required
            />
          </div>

          <div>
            <label className="block text-alex-accent font-mono text-sm mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 font-mono text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-alex-accent text-alex-bg font-mono text-sm hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-alex-subtitle font-mono text-sm hover:text-alex-accent transition-colors"
          >
            ← Back to Site
          </a>
        </div>
      </div>
    </div>
  )
}
