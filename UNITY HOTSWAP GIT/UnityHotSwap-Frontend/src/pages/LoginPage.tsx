import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { ApiError } from '../api'

function useNextPath() {
  const location = useLocation()
  return useMemo(() => {
    const params = new URLSearchParams(location.search)
    const next = params.get('next')
    if (next && next.startsWith('/')) return next
    return '/'
  }, [location.search])
}

function formatLoginError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Nieprawidłowy email lub hasło.'
    return `Błąd logowania (HTTP ${e.status}).`
  }
  return 'Nie udało się zalogować. Spróbuj ponownie.'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const next = useNextPath()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(next)
    } catch (err) {
      setError(formatLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>Logowanie</h2>

        <form className="form" onSubmit={submit}>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="label">Hasło</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="alert">{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <Link className="btn" to={`/register?next=${encodeURIComponent(next)}`}>
              Rejestracja
            </Link>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Logowanie…' : 'Zaloguj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
