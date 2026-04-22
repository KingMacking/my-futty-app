import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import { Button } from '@/components/ui/button'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) toast.error(error.message)
      else toast.success('Cuenta creada. Podés iniciar sesión.')
    }

    setLoading(false)
  }

  const inputClass = 'bg-input/30 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors w-full'

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-3 px-4">
      <h1 className="text-5xl">⚽</h1>
      <h2 className="text-2xl font-semibold tracking-tight">Futty</h2>
      <p className="text-muted-foreground text-sm mb-2">
        {isLogin ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={inputClass}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarme'}
        </Button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="text-sm text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
      >
        {isLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
      </button>
    </div>
  )
}
