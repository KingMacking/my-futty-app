import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GroupList } from '../components/GroupList'
import { useGroupsStore } from '../store/groupsStore'
import { useAuthStore } from '../store/authStore'

export function Groups() {
  const { session } = useAuthStore()
  const { groups, loading, submitting, fetch, create, join } = useGroupsStore()
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (session?.user.id) fetch(session.user.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  async function handleCreate() {
    if (!name.trim() || !session) return
    const ok = await create(session.user.id, name)
    if (ok) { setName(''); setMode('idle') }
  }

  async function handleJoin() {
    if (!code.trim() || !session) return
    const ok = await join(session.user.id, code)
    if (ok) { setCode(''); setMode('idle') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">👥 Grupos</h2>
        {mode === 'idle' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode('join')}>Unirse</Button>
            <Button size="sm" onClick={() => setMode('create')}>Crear</Button>
          </div>
        )}
      </div>

      {mode === 'create' && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">Nuevo grupo</p>
          <input
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
            placeholder="Nombre del grupo"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCreate} disabled={!name.trim() || submitting}>
              {submitting ? 'Creando...' : 'Crear'}
            </Button>
            <Button variant="outline" onClick={() => { setMode('idle'); setName('') }}>Cancelar</Button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">Unirse con código</p>
          <input
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-blue-500 transition-colors"
            placeholder="Código (ej: AB3X9F)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={6}
            autoFocus
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleJoin} disabled={code.length < 6 || submitting}>
              {submitting ? 'Uniéndose...' : 'Unirse'}
            </Button>
            <Button variant="outline" onClick={() => { setMode('idle'); setCode('') }}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-32 bg-muted rounded" />
                <div className="h-2.5 w-20 bg-muted/60 rounded" />
              </div>
              <div className="h-3 w-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <GroupList groups={groups} />
      )}
    </div>
  )
}

