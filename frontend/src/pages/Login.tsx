import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useApi } from '../api/client'

const Login: React.FC = () => {
  const [username, setUsername] = useState('alice')
  const [password, setPassword] = useState('password1')
  const { token, setToken, setUser } = useContext(AuthContext)
  const nav = useNavigate()
  const { fetcher } = useApi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) nav('/')
  }, [token])

  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUsernameError(null)
    setPasswordError(null)

    // simple client-side validation
    if (!username.trim()) {
      setUsernameError('Por favor ingresa tu correo o usuario')
    }
    if (!password) {
      setPasswordError('Por favor ingresa tu contraseña')
    }
    if (!username.trim() || !password) {
      return setLoading(false)
    }
    setLoading(true)
    try {
      const data = await fetcher(`/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`)
      setToken(data.access_token)
      // fetch user info with the returned token and store in context
      try {
        const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
        const res = await fetch(apiUrl + '/users/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
        if (res.ok) {
          const u = await res.json()
          setUser(u)
        }
      } catch (err) {
        // ignore user fetch errors here
      }
      nav('/')
    } catch (err: any) {
      setError('Login failed: ' + (err.message || 'unexpected error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="w-full md:w-1/2 bg-slate-900 text-slate-100 flex items-center justify-center p-8">
        <div className="w-full h-full px-12 py-10 flex items-center animate-fade-in-left">
          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold">Sign In</h1>
              <p className="text-sm text-slate-400 mt-2">Enter your email and password to continue</p>
            </div>

            {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}

            <form onSubmit={submit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email Address</label>
                <input
                  className={`w-full rounded-lg px-4 py-3 bg-slate-800 border ${usernameError ? 'border-rose-400' : 'border-slate-700'} placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40`}
                  placeholder="you@example.com"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  aria-invalid={!!usernameError}
                />
                {usernameError && <p className="text-xs text-rose-400 mt-1">{usernameError}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  className={`w-full rounded-lg px-4 py-3 bg-slate-800 border ${passwordError ? 'border-rose-400' : 'border-slate-700'} placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40`}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                />
                {passwordError && <p className="text-xs text-rose-400 mt-1">{passwordError}</p>}
              </div>

              <div>
                <button
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              <div className="text-center text-xs text-slate-500">
                <a href="#" className="underline">Forgot password?</a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right: Decorative hero - hidden on small screens */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 h-full flex items-center justify-center p-12">
          <div className="max-w-sm text-center text-white animate-fade-in-up anim-delay-150">
            <h2 className="text-4xl font-bold mb-3">Red Social Periferia</h2>
            <p className="text-sm text-slate-200">A comunidad para compartir ideas y conectar con gente local.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
