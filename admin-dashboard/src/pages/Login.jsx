import { useState } from 'react'
import { api } from '../utils/api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await api.login(username, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.token) {
      onLogin(result.token)
    } else {
      setError('Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="admin-shell min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-primary-200 text-primary-700 dark:text-primary-300 mb-4">
            <span className="font-editorial text-3xl italic">S</span>
          </div>
          <h1 className="font-editorial text-4xl font-normal tracking-tight text-gray-900 dark:text-white">Sulyap</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Admin</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="rounded-sm border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Local development only: admin / admin123
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="font-editorial text-sm italic text-gray-600 dark:text-gray-400">
            A little space to talk
          </p>
        </div>
      </div>
    </div>
  )
}
