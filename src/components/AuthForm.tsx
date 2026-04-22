import { useState } from 'react'
import { supabase } from '../services/supabase'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Revisá tu email para confirmar la cuenta.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <h1>⚽ Futty</h1>
      <h2>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarme'}
        </button>
      </form>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
      <button className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
      </button>
    </div>
  )
}
