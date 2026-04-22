import { useEffect } from 'react'
import { MatchForm } from '../components/MatchForm'
import { MatchList } from '../components/MatchList'
import { useMatchesStore } from '../store/matchesStore'
import { useAuthStore } from '../store/authStore'

export function Matches() {
  const { session } = useAuthStore()
  const { matches, loading, fetch } = useMatchesStore()

  useEffect(() => {
    if (session) fetch(session.user.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">⚽ Partidos</h2>
      <MatchForm />
      <MatchList matches={matches} loading={loading} />
    </div>
  )
}

