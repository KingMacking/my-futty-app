import { useNavigate } from 'react-router-dom'
import type { Group } from '../types'

interface Props {
  groups: Group[]
}

export function GroupList({ groups }: Props) {
  const navigate = useNavigate()

  if (groups.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No pertenecés a ningún grupo todavía.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(group => (
        <button
          key={group.id}
          onClick={() => navigate(`/groups/${group.id}`)}
          className="rounded-xl border border-border bg-card p-4 flex items-center justify-between text-left hover:border-blue-500/50 transition-colors w-full cursor-pointer"
        >
          <div>
            <p className="font-semibold">{group.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.member_count ?? 1} miembro{(group.member_count ?? 1) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded-lg text-muted-foreground">
              {group.code}
            </span>
            <span className="text-muted-foreground text-sm">›</span>
          </div>
        </button>
      ))}
    </div>
  )
}

