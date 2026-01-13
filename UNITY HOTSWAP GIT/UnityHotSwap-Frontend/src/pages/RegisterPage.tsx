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

function formatRegisterError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return 'Konto z tym adresem email już istnieje. Przejdź do logowania.'
    if (e.status === 400) {
      // backend zwykle zwraca { error, details: [{code, description}] }
      const body = e.body
      const base = body?.error ? String(body.error) : 'Rejestracja odrzucona.'
      const details = Array.isArray(body?.details)
        ? body.details.map((d: any) => d?.description).filter(Boolean)
        : []
      if (details.length > 0) return `${base} ${details.join(' ')}`
      return base
    }
    return `Błąd rejestracji (HTTP ${e.status}).`
  }

  return 'Nie udało się zarejestrować. Spróbuj ponownie.'
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const next = useNextPath()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }
    if (password !== password2) {
      setError('Hasła nie są identyczne.')
      return
    }

    setLoading(true)
    try {
      await register(email, password)
      navigate(next)
    } catch (err) {
      setError(formatRegisterError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>Rejestracja</h2>

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
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="hint">Minimum 8 znaków. Wymagane: co najmniej jedna cyfra i mała litera.</span>
          </label>

          <label className="field">
            <span className="label">Powtórz hasło</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
            />
          </label>

          {error && <div className="alert">{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <Link className="btn" to={`/login?next=${encodeURIComponent(next)}`}>
              Mam konto
            </Link>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Rejestracja…' : 'Zarejestruj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
