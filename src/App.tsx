import { useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthForm } from './components/AuthForm'
import { Dashboard } from './pages/Dashboard'
import { Matches } from './pages/Matches'
import { Groups } from './pages/Groups'
import { GroupDetail } from './pages/GroupDetail'
import { ProfileSetup } from './pages/ProfileSetup'
import { Profile } from './pages/Profile'
import { useAuthStore } from './store/authStore'
import { useWorldcupStore } from './store/worldcupStore'

function App() {
  const { session, profile, loading, profileLoading, init } = useAuthStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => init(), [])

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-dvh text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!session) return <AuthForm />
  if (!profile?.username) return <ProfileSetup />

  return <AppContent />
}

function AppContent() {
  const { session } = useAuthStore()
  const fetch = useWorldcupStore(state => state.fetch)

  const userId = session?.user.id

  useEffect(() => {
    if (userId) fetch(userId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <span className="font-bold text-lg">⚽ Futty</span>
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto px-4 py-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="flex border-t border-border bg-background shrink-0">
        {[
          { to: '/', end: true, icon: '🌍', label: 'Mundial' },
          { to: '/matches', end: false, icon: '⚽', label: 'Partidos' },
          { to: '/groups', end: false, icon: '👥', label: 'Grupos' },
          { to: '/profile', end: false, icon: '👤', label: 'Perfil' },
        ].map(({ to, end, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App

