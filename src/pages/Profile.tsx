import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../store/authStore'
import { useMatchesStore } from '../store/matchesStore'

export function Profile() {
  const { session, profile, saveProfile, signOut } = useAuthStore()
  const matches = useMatchesStore(state => state.matches)

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!session) return
    if (!fullName.trim() || !username.trim()) return
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) {
      toast.error('Nickname inválido: 3-20 chars, solo letras minúsculas, números o _')
      return
    }
    setSaving(true)
    const ok = await saveProfile(session.user.id, { username, full_name: fullName })
    setSaving(false)
    if (!ok) {
      toast.error('Ese nickname ya está en uso')
    } else {
      toast.success('Perfil actualizado')
      setEditing(false)
    }
  }

  const initial = (profile?.username ?? profile?.email ?? '?')[0].toUpperCase()
  const totalMatches = matches.length

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + nombre */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
          {initial}
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">{profile?.full_name ?? '—'}</p>
          <p className="text-muted-foreground text-sm">@{profile?.username ?? '—'}</p>
          <p className="text-muted-foreground text-xs mt-1">{session?.user.email}</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totalMatches}</p>
          <p className="text-xs text-muted-foreground mt-1">Partidos jugados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            {matches.filter(m => m.counts_for_worldcup && m.result === 'win').length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Victorias en mundial</p>
        </div>
      </div>

      {/* Editar perfil */}
      {!editing ? (
        <Button variant="outline" className="w-full" onClick={() => {
          setFullName(profile?.full_name ?? '')
          setUsername(profile?.username ?? '')
          setEditing(true)
        }}>
          Editar perfil
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">Editar perfil</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nombre real</label>
            <input
              className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nickname</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving || !fullName.trim() || username.length < 3}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Cerrar sesión */}
      <Button variant="destructive" className="w-full" onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  )
}
