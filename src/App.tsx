import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './services/supabase'
import { AuthForm } from './components/AuthForm'
import { useWorldcup } from './hooks/useWorldcup'
import { Dashboard } from './pages/Dashboard'
import { Matches } from './pages/Matches'
import { Groups } from './pages/Groups'
import type { Session } from '@supabase/supabase-js'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading">Cargando...</div>

  if (!session) return <AuthForm />

  return <AppContent session={session} />
}

function AppContent({ session }: { session: Session }) {
  const { worldcup, loading } = useWorldcup(session.user.id)

  return (
    <div className="app-layout">
      <header className="app-header">
        <span>⚽ Futty</span>
        <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard worldcup={worldcup} loading={loading} />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end>
          <span>🌍</span>
          <span>Mundial</span>
        </NavLink>
        <NavLink to="/matches">
          <span>⚽</span>
          <span>Partidos</span>
        </NavLink>
        <NavLink to="/groups">
          <span>👥</span>
          <span>Grupos</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default App

