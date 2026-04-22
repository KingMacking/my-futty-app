import { WorldcupPath } from '../components/WorldcupPath'
import type { Worldcup } from '../types'

interface Props {
  worldcup: Worldcup | null
  loading: boolean
}

export function Dashboard({ worldcup, loading }: Props) {
  if (loading) return <div className="loading">Cargando mundial...</div>
  if (!worldcup) return <p className="error-text">Error cargando el mundial</p>

  return (
    <div className="page">
      <WorldcupPath worldcup={worldcup} />
    </div>
  )
}
