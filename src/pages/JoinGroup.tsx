import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '../services/supabase'
import { useGroupsStore } from '../store/groupsStore'
import { useAuthStore } from '../store/authStore'
import type { Group } from '../types'

export function JoinGroup() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const { groups, join } = useGroupsStore()

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const alreadyMember = groups.some(g => g.code === code?.toUpperCase())

  useEffect(() => {
    if (!code) return
    supabase
      .from('groups')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        setGroup(data as Group ?? null)
        setLoading(false)
      })
  }, [code])

  async function handleJoin() {
    if (!session || !code) return
    setJoining(true)
    const ok = await join(session.user.id, code)
    if (ok && group) {
      localStorage.removeItem('pendingJoinCode')
      const joined = groups.find(g => g.code === code.toUpperCase())
      navigate(joined ? `/groups/${joined.id}` : '/groups')
    } else {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <span className="text-4xl">❌</span>
        <p className="font-semibold">Código inválido</p>
        <p className="text-sm text-muted-foreground">No existe ningún grupo con ese código.</p>
        <Button variant="outline" onClick={() => navigate('/groups')}>Ir a grupos</Button>
      </div>
    )
  }

  if (alreadyMember) {
    const existing = groups.find(g => g.code === code?.toUpperCase())
    const target = existing ? `/groups/${existing.id}` : '/groups'
    localStorage.removeItem('pendingJoinCode')
    toast('Ya sos miembro de este grupo')
    navigate(target, { replace: true })
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
      <span className="text-5xl">👥</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Te invitaron a</p>
        <p className="text-2xl font-bold">{group.name}</p>
        <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">{group.code}</p>
      </div>
      <Button className="w-full max-w-xs" onClick={handleJoin} disabled={joining}>
        {joining ? 'Uniéndose...' : 'Unirse al grupo'}
      </Button>
      <button onClick={() => { localStorage.removeItem('pendingJoinCode'); navigate('/groups') }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        Cancelar
      </button>
    </div>
  )
}
