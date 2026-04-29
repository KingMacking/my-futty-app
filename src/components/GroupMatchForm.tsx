import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import { Button } from '@/components/ui/button'
import type { Profile } from '../types'

interface MemberItem {
  user_id: string
  profile: Profile | null
}

interface Guest {
  id: string
  name: string
  team: 'a' | 'b' | null
}

interface Props {
  groupId: string
  currentUserId: string
  members: MemberItem[]
  onClose: () => void
  onCreated: () => void
}

export function GroupMatchForm({ groupId, currentUserId, members, onClose, onCreated }: Props) {
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [assignments, setAssignments] = useState<Record<string, 'a' | 'b' | null>>({})
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestInput, setGuestInput] = useState('')
  const [goals, setGoals] = useState<Record<string, string>>({})
  const [assists, setAssists] = useState<Record<string, string>>({})
  const [showStats, setShowStats] = useState(false)
  const [replayUrl, setReplayUrl] = useState('')
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [submitting, setSubmitting] = useState(false)

  function toggleMemberTeam(userId: string, team: 'a' | 'b') {
    setAssignments(prev => ({ ...prev, [userId]: prev[userId] === team ? null : team }))
  }

  function toggleGuestTeam(guestId: string, team: 'a' | 'b') {
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, team: g.team === team ? null : team } : g))
  }

  function addGuest() {
    const name = guestInput.trim()
    if (!name) return
    if (name.length > 40) { toast.error('El nombre es muy largo'); return }
    setGuests(prev => [...prev, { id: `guest_${Date.now()}`, name, team: null }])
    setGuestInput('')
  }

  function removeGuest(guestId: string) {
    setGuests(prev => prev.filter(g => g.id !== guestId))
  }

  async function handleSubmit() {
    const sa = parseInt(scoreA, 10)
    const sb = parseInt(scoreB, 10)
    if (isNaN(sa) || isNaN(sb) || sa < 0 || sb < 0) {
      toast.error('Ingresa un resultado valido')
      return
    }

    const assignedMembers = members.filter(m => assignments[m.user_id])
    const assignedGuests = guests.filter(g => g.team)

    const teamACount =
      assignedMembers.filter(m => assignments[m.user_id] === 'a').length +
      assignedGuests.filter(g => g.team === 'a').length
    const teamBCount =
      assignedMembers.filter(m => assignments[m.user_id] === 'b').length +
      assignedGuests.filter(g => g.team === 'b').length

    if (teamACount === 0 || teamBCount === 0) {
      toast.error('Asigna al menos un jugador a cada equipo')
      return
    }

    const trimmedUrl = replayUrl.trim()
    if (trimmedUrl && !/^https?:\/\/.+/.test(trimmedUrl)) {
      toast.error('El link debe comenzar con http:// o https://')
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase
      .from('group_matches')
      .insert({
        group_id: groupId,
        team_a_score: sa,
        team_b_score: sb,
        replay_url: trimmedUrl || null,
        played_at: new Date(playedAt).toISOString(),
        created_by: currentUserId,
      })
      .select()
      .single()

    if (error || !data) {
      toast.error('Error guardando el partido')
      setSubmitting(false)
      return
    }

    const players = [
      ...assignedMembers.map(m => ({
        group_match_id: data.id,
        user_id: m.user_id,
        guest_name: null,
        team: assignments[m.user_id] as 'a' | 'b',
        goals: Math.max(0, parseInt(goals[m.user_id] ?? '0', 10) || 0),
        assists: Math.max(0, parseInt(assists[m.user_id] ?? '0', 10) || 0),
      })),
      ...assignedGuests.map(g => ({
        group_match_id: data.id,
        user_id: null,
        guest_name: g.name,
        team: g.team as 'a' | 'b',
        goals: Math.max(0, parseInt(goals[g.id] ?? '0', 10) || 0),
        assists: Math.max(0, parseInt(assists[g.id] ?? '0', 10) || 0),
      })),
    ]

    const { error: playersError } = await supabase.from('group_match_players').insert(players)

    if (playersError) {
      toast.error('Error guardando los jugadores')
      setSubmitting(false)
      return
    }

    toast.success('Partido guardado')
    setSubmitting(false)
    onCreated()
  }

  const statsItems: Array<{ key: string; label: string; team: 'a' | 'b' }> = [
    ...members
      .filter(m => assignments[m.user_id])
      .map(m => ({
        key: m.user_id,
        label: `@${m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`}`,
        team: assignments[m.user_id] as 'a' | 'b',
      })),
    ...guests
      .filter(g => g.team)
      .map(g => ({ key: g.id, label: g.name, team: g.team as 'a' | 'b' })),
  ]

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Nuevo partido de grupo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">x</button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Resultado</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground text-center">Equipo A</label>
              <input type="number" min="0" max="99" placeholder="0" value={scoreA} onChange={e => setScoreA(e.target.value)}
                className="bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-center text-2xl font-bold outline-none focus:border-blue-500 transition-colors" />
            </div>
            <span className="text-muted-foreground text-xl font-bold mt-5">-</span>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-muted-foreground text-center">Equipo B</label>
              <input type="number" min="0" max="99" placeholder="0" value={scoreB} onChange={e => setScoreB(e.target.value)}
                className="bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-center text-2xl font-bold outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Miembros del grupo</p>
          <div className="flex flex-col gap-2">
            {members.map(m => {
              const username = m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`
              const assigned = assignments[m.user_id]
              return (
                <div key={m.user_id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {username[0].toUpperCase()}
                  </div>
                  <span className="text-sm flex-1 truncate">@{username}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {(['a', 'b'] as const).map(t => (
                      <button key={t} onClick={() => toggleMemberTeam(m.user_id, t)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                          assigned === t
                            ? t === 'a' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'border-border text-muted-foreground hover:border-blue-500/30'
                        }`}>{t.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Jugadores externos</p>
          <div className="flex flex-col gap-2">
            {guests.map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-muted/50 border border-dashed border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {g.name[0].toUpperCase()}
                </div>
                <span className="text-sm flex-1 truncate text-muted-foreground">{g.name}</span>
                <div className="flex gap-1.5 shrink-0">
                  {(['a', 'b'] as const).map(t => (
                    <button key={t} onClick={() => toggleGuestTeam(g.id, t)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                        g.team === t
                          ? t === 'a' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'border-border text-muted-foreground hover:border-blue-500/30'
                      }`}>{t.toUpperCase()}</button>
                  ))}
                  <button onClick={() => removeGuest(g.id)}
                    className="text-xs px-1.5 py-1 rounded-lg border border-border text-muted-foreground hover:border-red-500/50 hover:text-red-400 transition-colors">x</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input type="text" placeholder="Nombre del invitado..." value={guestInput}
                onChange={e => setGuestInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGuest()} maxLength={40}
                className="flex-1 bg-muted/50 border border-dashed border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-muted-foreground/50" />
              <button onClick={addGuest} disabled={!guestInput.trim()}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40">
                + Agregar
              </button>
            </div>
          </div>
        </div>

        {statsItems.length > 0 && (
          <div>
            <button onClick={() => setShowStats(!showStats)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              {showStats ? 'Ocultar goles/asistencias' : 'Agregar goles/asistencias'}
            </button>
            {showStats && (
              <div className="flex flex-col gap-2.5 mt-3">
                <div className="grid grid-cols-[1fr_auto_56px_56px] gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Jugador</span>
                  <span />
                  <span className="text-xs text-muted-foreground text-center">Goles</span>
                  <span className="text-xs text-muted-foreground text-center">Asist</span>
                </div>
                {statsItems.map(item => (
                  <div key={item.key} className="grid grid-cols-[1fr_auto_56px_56px] gap-2 items-center">
                    <span className="text-xs text-muted-foreground truncate">{item.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${item.team === 'a' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {item.team.toUpperCase()}
                    </span>
                    <input type="number" min="0" max="99" placeholder="0" value={goals[item.key] ?? ''}
                      onChange={e => setGoals(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-center" />
                    <input type="number" min="0" max="99" placeholder="0" value={assists[item.key] ?? ''}
                      onChange={e => setAssists(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-center" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Fecha y hora del partido</label>
          <input
            type="datetime-local"
            max={new Date().toISOString().slice(0, 16)}
            value={playedAt}
            onChange={e => setPlayedAt(e.target.value)}
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Link de repeticion (opcional)</label>
          <input type="url" placeholder="https://..." value={replayUrl} onChange={e => setReplayUrl(e.target.value)}
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors" />
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? 'Guardando...' : 'Guardar partido'}
        </Button>
      </div>
    </div>
  )
}
