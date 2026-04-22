import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useWorldcupStore } from '../store/worldcupStore'

export function CoinFlipModal() {
  const { pendingCoinFlip, resolveCoinFlip } = useWorldcupStore()
  const [flipping, setFlipping] = useState(false)
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null)

  if (!pendingCoinFlip) return null

  async function handleFlip() {
    setFlipping(true)
    await new Promise(r => setTimeout(r, 1200))
    const won = Math.random() >= 0.5
    setOutcome(won ? 'win' : 'lose')
    await new Promise(r => setTimeout(r, 900))
    await resolveCoinFlip(won)
    setFlipping(false)
    setOutcome(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-xs w-full flex flex-col items-center gap-6 shadow-2xl">
        <p className="text-xl font-bold text-center">¡Empate!</p>
        <p className="text-sm text-muted-foreground text-center">
          Tirá la moneda para saber si clasificás.
        </p>

        <span className="text-6xl select-none">
          {outcome === 'win' ? '🎉' : outcome === 'lose' ? '💨' : '🪙'}
        </span>

        {!flipping && !outcome && (
          <Button onClick={handleFlip} className="w-full" size="lg">
            Tirar moneda
          </Button>
        )}

        {flipping && !outcome && (
          <p className="text-muted-foreground text-sm animate-pulse">Girando...</p>
        )}

        {outcome && (
          <p className="font-semibold text-lg">
            {outcome === 'win' ? '¡Ganaste! 🎉' : 'Perdiste 😢'}
          </p>
        )}
      </div>
    </div>
  )
}
