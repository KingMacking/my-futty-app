import { WorldcupPath } from '../components/WorldcupPath'
import { CoinFlipModal } from '../components/CoinFlipModal'
import { useWorldcupStore } from '../store/worldcupStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const { worldcup, loading, createNew } = useWorldcupStore()
  const { session } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Cargando mundial...
      </div>
    )
  }

  if (!worldcup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <span className="text-4xl">⚽</span>
        <p className="font-semibold">No hay mundial activo</p>
        <p className="text-sm text-muted-foreground">
          Registrá un partido con "Cuenta para mi mundial" para arrancar.
        </p>
      </div>
    )
  }

  const isFinished = worldcup && (worldcup.status === 'eliminated' || worldcup.status === 'completed')

  return (
    <>
      <WorldcupPath worldcup={worldcup} />
      {isFinished && (
        <div className="flex justify-center pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => session && createNew(session.user.id)}
          >
            ⚽ Nuevo Mundial
          </Button>
        </div>
      )}
      <CoinFlipModal />
    </>
  )
}

