import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Profile } from '../types'

interface MemberItem {
  user_id: string
  profile: Profile | null
}

interface Props {
  members: MemberItem[]
  onClose: () => void
}

interface Player {
  id: string
  name: string
  isGuest: boolean
}

type DrawResult = { teamA: Player[]; teamB: Player[] } | null

export function TeamDrawModal({ members, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map(m => m.user_id)))
  const [guestInput, setGuestInput] = useState('')
  const [guests, setGuests] = useState<Player[]>([])
  const [result, setResult] = useState<DrawResult>(null)

  function toggleMember(userId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
    setResult(null)
  }

  function addGuest() {
    const name = guestInput.trim()
    if (!name) return
    if (name.length > 40) return
    setGuests(prev => [...prev, { id: `guest_${Date.now()}`, name, isGuest: true }])
    setGuestInput('')
    setResult(null)
  }

  function removeGuest(id: string) {
    setGuests(prev => prev.filter(g => g.id !== id))
    setResult(null)
  }

  function draw() {
    const pool: Player[] = [
      ...members
        .filter(m => selected.has(m.user_id))
        .map(m => ({
          id: m.user_id,
          name: m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`,
          isGuest: false,
        })),
      ...guests,
    ]

    // Fisher-Yates shuffle
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const half = Math.ceil(shuffled.length / 2)
    setResult({ teamA: shuffled.slice(0, half), teamB: shuffled.slice(half) })
  }

  const totalPlayers = selected.size + guests.length

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
          <h3 className="font-semibold text-base">Sorteo de equipos</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {!result ? (
          <>
            {/* Members */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                Miembros del grupo
              </p>
              <div className="flex flex-col gap-1.5">
                {members.map(m => {
                  const username = m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`
                  const on = selected.has(m.user_id)
                  return (
                    <button
                      key={m.user_id}
                      onClick={() => toggleMember(m.user_id)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left ${
                        on
                          ? 'border-green-600/50 bg-green-950/20'
                          : 'border-border bg-muted/20 opacity-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        on ? 'border-green-500 bg-green-500' : 'border-border'
                      }`}>
                        {on && <span className="text-[10px] text-black font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-sm">@{username}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Guests */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                Jugadores externos
              </p>
              <div className="flex flex-col gap-1.5">
                {guests.map(g => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 rounded-xl border border-green-600/50 bg-green-950/20 px-3 py-2.5"
                  >
                    <div className="w-5 h-5 rounded-md border-2 border-green-500 bg-green-500 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-black font-bold leading-none">✓</span>
                    </div>
                    <span className="text-sm flex-1">{g.name}</span>
                    <button
                      onClick={() => removeGuest(g.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del invitado..."
                    value={guestInput}
                    onChange={e => setGuestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGuest()}
                    maxLength={40}
                    className="flex-1 bg-muted/50 border border-dashed border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={addGuest}
                    disabled={!guestInput.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={draw}
              disabled={totalPlayers < 2}
              className="w-full"
            >
              🎲 Sortear equipos ({totalPlayers} jugadores)
            </Button>
          </>
        ) : (
          <>
            {/* Result */}
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-blue-700/40 bg-blue-950/20 p-4 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Equipo A</span>
                {result.teamA.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className={`text-sm ${p.isGuest ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {p.isGuest ? p.name : `@${p.name}`}
                      {p.isGuest && <span className="text-muted-foreground/60 text-xs ml-1">(inv.)</span>}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Equipo B</span>
                {result.teamB.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">–</p>
                ) : result.teamB.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className={`text-sm ${p.isGuest ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {p.isGuest ? p.name : `@${p.name}`}
                      {p.isGuest && <span className="text-muted-foreground/60 text-xs ml-1">(inv.)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                ← Modificar
              </Button>
              <Button onClick={draw} className="flex-1">
                🎲 Re-sortear
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
