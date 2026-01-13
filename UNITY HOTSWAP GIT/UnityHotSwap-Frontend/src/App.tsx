import React from 'react'
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import LessonTheory from './pages/LessonTheory'
import Practice from './components/Practice'
import { ProgressProvider, ProgressBar } from './progress'
import { AuthProvider, useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Shell />
      </ProgressProvider>
    </AuthProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const loc = useLocation()
  const next = encodeURIComponent(loc.pathname + loc.search)

  if (!isAuthenticated) return <Navigate to={`/login?next=${next}`} replace />
  return <>{children}</>
}

function Shell() {
  const loc = useLocation()
  const { isAuthenticated, email, logout } = useAuth()

  const next = encodeURIComponent(loc.pathname + loc.search)

  return (
    <>
      <div className="top">
        <strong className="brand">Unity Edu - C# live</strong>

        <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Start/Praktyka tylko dla zalogowanych */}
          {isAuthenticated && (
            <>
              <Link className={loc.pathname === '/' ? 'active' : ''} to="/">
                Start
              </Link>
              <Link className={loc.pathname.startsWith('/practice') ? 'active' : ''} to="/practice">
                Praktyka
              </Link>
              <span className="nav-sep" />
              <span className="nav-user" title={email ?? ''}>
                {email ?? 'Zalogowano'}
              </span>
              <button className="btn" onClick={logout} style={{ padding: '6px 10px' }}>
                Wyloguj
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link className={loc.pathname.startsWith('/login') ? 'active' : ''} to={`/login?next=${next}`}>
                Zaloguj
              </Link>
              <Link className={loc.pathname.startsWith('/register') ? 'active' : ''} to={`/register?next=${next}`}>
                Rejestracja
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Pasek postępu tylko dla zalogowanych */}
      {isAuthenticated && (
        <div className="progress-bar-row">
          <ProgressBar />
        </div>
      )}

      <Routes>
        {/* Root: bez auth -> przerzuć na login */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/lesson/:id"
          element={
            <RequireAuth>
              <LessonTheory />
            </RequireAuth>
          }
        />

        <Route
          path="/practice"
          element={
            <RequireAuth>
              <Practice />
            </RequireAuth>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
