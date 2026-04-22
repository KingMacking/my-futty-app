import { WorldcupPath } from '../components/WorldcupPath'
import { CoinFlipModal } from '../components/CoinFlipModal'
import { useWorldcupStore } from '../store/worldcupStore'

export function Dashboard() {
  const { worldcup, loading } = useWorldcupStore()

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

  return (
    <>
      <WorldcupPath worldcup={worldcup} />
      <CoinFlipModal />
    </>
  )
}

