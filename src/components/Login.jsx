import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowRight, Lock, Mail, UserPlus, LogIn } from 'lucide-react'

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the login link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onLogin()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden animate-slide-up">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-purple/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple mb-4 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">CAMPUS <span className="text-neon-blue">OS</span></h1>
          <p className="text-slate-400">The operating system for your college life.</p>
        </div>

        <div className="glass p-8 backdrop-blur-xl">
          <div className="flex gap-4 mb-8 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isSignUp ? 'bg-neon-blue/10 text-neon-blue shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isSignUp ? 'bg-neon-blue/10 text-neon-blue shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white text-sm focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all placeholder:text-slate-600"
                  placeholder="student@college.edu"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white text-sm focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-neon-blue to-cyan-400 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : isSignUp ? (
                <>Create Account <ArrowRight size={18} /></>
              ) : (
                <>Enter Campus <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          Secured by <span className="text-slate-400 font-medium">College Vault™</span>
        </p>
      </div>
    </div>
  )
}
