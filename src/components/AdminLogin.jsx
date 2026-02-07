import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Lock, ArrowRight, AlertTriangle } from 'lucide-react'

/**
 * Admin Login Component
 * 
 * Provides a secure login interface restricted to users with the 'admin' role.
 * Validates credentials via Supabase Auth and checks role permissions in the 'profiles' table.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {function} props.onLogin - Callback fired upon successful admin authentication. Receives the role string.
 */
export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Handles the form submission for admin login.
   * Performs dual-check: Auth sign-in + Role verification.
   * @param {Event} e - Form submission event.
   */
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      // 2. Check role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Access Denied: You do not have administrator privileges.')
      }

      // 3. Success
      onLogin('admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Dark Matrix/Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-4 animate-pulse">
            <Shield className="text-red-500 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Restricted Area</h1>
          <p className="text-red-400 text-xs font-mono mt-2 tracking-wider">AUTHORIZATION REQUIRED</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleAdminLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Admin ID</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
                placeholder="admin@system.local"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
                  placeholder="••••••••••••"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>AUTHENTICATE <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            ← Return to Student Portal
          </a>
        </div>
      </div>
    </div>
  )
}
