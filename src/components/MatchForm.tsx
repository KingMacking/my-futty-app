import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useMatchesStore } from '../store/matchesStore'
import { useAuthStore } from '../store/authStore'
import type { MatchResult } from '../types'

const OPTIONS: { result: MatchResult; label: string; emoji: string; active: string }[] = [
  { result: 'win',  label: 'Gané',   emoji: '🌟', active: 'bg-green-500/20 border-green-500 text-green-400' },
  { result: 'draw', label: 'Empaté', emoji: '🤝', active: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { result: 'lose', label: 'Perdí',  emoji: '💥', active: 'bg-red-500/20 border-red-500 text-red-400' },
]

export function MatchForm() {
  const { session } = useAuthStore()
  const { addMatch, submitting } = useMatchesStore()
  const [result, setResult] = useState<MatchResult | null>(null)
  const [countsForWorldcup, setCountsForWorldcup] = useState(true)

  async function handleSubmit() {
    if (!result || !session) return
    const ok = await addMatch(session.user.id, result, countsForWorldcup)
    if (ok) setResult(null)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
      <h3 className="font-semibold text-base">Registrar partido</h3>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ result: r, label, emoji, active }) => (
          <button
            key={r}
            onClick={() => setResult(r)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 border-transparent bg-muted/30 transition-all cursor-pointer',
              result === r ? active : 'hover:bg-muted/60'
            )}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Cuenta para mi mundial</p>
          <p className="text-xs text-muted-foreground">Suma al progreso de tu mundial activo</p>
        </div>
        <Switch
          checked={countsForWorldcup}
          onCheckedChange={setCountsForWorldcup}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!result || submitting}
        className="w-full"
      >
        {submitting ? 'Guardando...' : 'Guardar partido'}
      </Button>
    </div>
  )
}
