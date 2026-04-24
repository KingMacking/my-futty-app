import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../store/authStore'
import { useMatchesStore } from '../store/matchesStore'
import { supabase } from '../services/supabase'
import type { Worldcup } from '../types'

const STAGE_LABELS: Record<string, string> = {
  groups:        'Fase de Grupos',
  round_of_16:   'Octavos',
  quarterfinals: 'Cuartos',
  semifinals:    'Semifinal',
  final:         'Final',
}

export function Profile() {
  const { session, profile, saveProfile, signOut } = useAuthStore()
  const matches = useMatchesStore(state => state.matches)

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<Worldcup[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (!session?.user.id) return
    setHistoryLoading(true)
    supabase
      .from('worldcups')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['eliminated', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory((data ?? []) as Worldcup[])
        setHistoryLoading(false)
      })
  }, [session?.user.id])

  async function handleSave() {
    if (!session) return
    if (!fullName.trim() || !username.trim()) return
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) {
      toast.error('Nickname inválido: 3-20 chars, solo letras minúsculas, números o _')
      return
    }
    setSaving(true)
    const ok = await saveProfile(session.user.id, { username, full_name: fullName })
    setSaving(false)
    if (!ok) {
      toast.error('Ese nickname ya está en uso')
    } else {
      toast.success('Perfil actualizado')
      setEditing(false)
    }
  }

  const initial = (profile?.username ?? profile?.email ?? '?')[0].toUpperCase()

  // -- Stats de partidos --
  const totalMatches = matches.length
  const wins   = matches.filter(m => m.result === 'win').length
  const draws  = matches.filter(m => m.result === 'draw').length
  const losses = matches.filter(m => m.result === 'lose').length
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  // Racha actual (matches ordenados desc)
  const currentStreak = (() => {
    if (matches.length === 0) return null
    const first = matches[0].result
    let count = 0
    for (const m of matches) {
      if (m.result === first) count++
      else break
    }
    return { count, result: first }
  })()
  const streakLabel: Record<string, string> = { win: 'victoria', draw: 'empate', lose: 'derrota' }
  const streakLabelPlural: Record<string, string> = { win: 'victorias', draw: 'empates', lose: 'derrotas' }

  // Mejor racha de victorias (cronológico = reverse)
  const bestWinStreak = (() => {
    let best = 0, current = 0
    for (const m of [...matches].reverse()) {
      if (m.result === 'win') { current++; if (current > best) best = current }
      else current = 0
    }
    return best
  })()

  // -- Stats de mundiales --
  const STAGE_ORDER: Record<string, number> = {
    groups: 1, round_of_16: 2, quarterfinals: 3, semifinals: 4, final: 5,
  }
  const STAGE_SHORT: Record<string, string> = {
    groups: 'Grupos', round_of_16: 'Octavos', quarterfinals: 'Cuartos', semifinals: 'Semis', final: 'Final',
  }
  const totalWorldcups = history.length
  const wonWorldcups   = history.filter(w => w.status === 'completed').length
  const classifiedCount = history.filter(w => STAGE_ORDER[w.current_stage] > 1 || w.status === 'completed').length
  const classificationRate = totalWorldcups > 0 ? Math.round((classifiedCount / totalWorldcups) * 100) : 0
  const bestStage = history.length > 0
    ? STAGE_SHORT[history.reduce((best, w) =>
        STAGE_ORDER[w.current_stage] > STAGE_ORDER[best.current_stage] ? w : best
      ).current_stage]
    : '—'

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + nombre */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
          {initial}
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">{profile?.full_name ?? '—'}</p>
          <p className="text-muted-foreground text-sm">@{profile?.username ?? '—'}</p>
          <p className="text-muted-foreground text-xs mt-1">{session?.user.email}</p>
        </div>
      </div>

      {/* Stats de partidos */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partidos</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Victorias</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-yellow-400">{draws}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Empates</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-red-400">{losses}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Derrotas</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">{totalMatches}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Win rate</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">{bestWinStreak}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Mejor racha</p>
          </div>
        </div>
        {currentStreak && currentStreak.count >= 2 && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2">
            <span className="text-lg">
              {currentStreak.result === 'win' ? '🔥' : currentStreak.result === 'draw' ? '➡️' : '❄️'}
            </span>
            <p className="text-sm">
              <span className="font-semibold">{currentStreak.count}</span>
              <span className="text-muted-foreground ml-1">
                {currentStreak.count === 1
                  ? streakLabel[currentStreak.result]
                  : streakLabelPlural[currentStreak.result]} seguidas
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Stats de mundiales */}
      {!historyLoading && totalWorldcups > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mundiales</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{totalWorldcups}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jugados</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{wonWorldcups}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ganados 🏆</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{classificationRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clasificación</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{bestStage}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mejor etapa</p>
            </div>
          </div>
        </div>
      )}

      {/* Editar perfil */}
      {!editing ? (
        <Button variant="outline" className="w-full" onClick={() => {
          setFullName(profile?.full_name ?? '')
          setUsername(profile?.username ?? '')
          setEditing(true)
        }}>
          Editar perfil
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">Editar perfil</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nombre real</label>
            <input
              className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nickname</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving || !fullName.trim() || username.length < 3}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Historial de mundiales */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de mundiales</p>
        {historyLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2.5 w-16 bg-muted/60 rounded" />
                </div>
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Todavía no terminaste ningún mundial</p>
        ) : (
          history.map(wc => {
            const isChampion = wc.status === 'completed'
            return (
              <div key={wc.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {isChampion ? 'Campeón 🏆' : `Eliminado en ${STAGE_LABELS[wc.current_stage]}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(wc.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    {wc.ended_at && ` – ${new Date(wc.ended_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  isChampion
                    ? 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40'
                    : 'text-red-400 bg-red-950/50 border-red-800/40'
                }`}>
                  {isChampion ? 'Ganado' : 'Eliminado'}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Historial de partidos */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partidos recientes</p>
          {matches.slice(0, 20).map(m => {
            const res = { win: { icon: 'V', className: 'text-green-400 bg-green-950/50 border-green-800/40' }, draw: { icon: 'E', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' }, lose: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40' } }[m.result]
            const date = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{date}</p>
                  {m.counts_for_worldcup && <p className="text-xs text-muted-foreground">mundial</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${res.className}`}>
                  {res.icon}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Cerrar sesión */}
      <Button variant="destructive" className="w-full" onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  )
}
