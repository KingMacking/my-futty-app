import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../store/authStore'

export function ProfileSetup() {
  const { session, saveProfile } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!session) return
    if (!fullName.trim() || !username.trim()) {
      toast.error('Completá todos los campos')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) {
      toast.error('El nickname debe tener 3-20 caracteres: letras minúsculas, números o _')
      return
    }

    setLoading(true)
    const ok = await saveProfile(session.user.id, { username, full_name: fullName })
    if (!ok) {
      toast.error('Ese nickname ya está en uso, elegí otro')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <p className="text-4xl mb-3">⚽</p>
          <h1 className="text-2xl font-bold">Completá tu perfil</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Solo la primera vez. Estos datos te identifican en los grupos.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nombre real</label>
            <input
              className="bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: Juan Pérez"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nickname</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="juanito10"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">3-20 caracteres: letras minúsculas, números o _</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!fullName.trim() || username.length < 3 || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Guardando...' : 'Entrar a Futty'}
          </Button>
        </div>
      </div>
    </div>
  )
}
