import { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Academy from './components/Academy'
import Governance from './components/Governance'
import Arena from './components/Arena'
import Dining from './components/Dining'
import Vault from './components/Vault'
import Login from './components/Login'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [ghostMode, setGhostMode] = useState(false)
  
  // Determine context based on Subdomain OR Path (for localhost testing)
  const hostname = window.location.hostname
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isAdminContext = hostname.startsWith('admin.') || (isLocal && window.location.pathname === '/admin')

  useEffect(() => {
    // Auth logic
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setRole(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  // --- ROUTING LOGIC ---

  // 1. If on Admin Subdomain/Path
  if (isAdminContext) {
    // Not logged in -> Show Admin Login
    if (!session) {
      return <AdminLogin onLogin={() => {}} /> // Role check handled inside AdminLogin
    }
    // Logged in but not admin -> Show Access Denied or Sign Out
    if (role && role !== 'admin') {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-zinc-500 mb-6 text-center">Student accounts cannot access the Command Center.</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200"
          >
            Sign Out
          </button>
        </div>
      )
    }
    // Logged in as Admin -> Show Dashboard
    return <AdminDashboard onLogout={() => {
      supabase.auth.signOut()
      if (!isLocal) window.location.href = 'https://app.saikumar.space' // Redirect to main site on logout
    }} />
  }

  // 2. If on Student Subdomain (or default)
  if (!session) {
    return <Login onLogin={() => {}} />
  }

  // If Admin logs into Student App -> Redirect to Admin App (optional, but good UX)
  if (role === 'admin' && !isLocal) {
     // Optional: Automatic redirect. For now, let's just let them view the student view if they want.
     // But give them a link to switch.
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard ghostMode={ghostMode} />
      case 'academy':
        return <Academy />
      case 'arena':
        return <Arena />
      case 'dining':
        return <Dining />
      case 'vault':
        return <Vault ghostMode={ghostMode} />
      default:
        return <Dashboard ghostMode={ghostMode} />
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Only show Header on Home to reduce clutter, or make it dynamic. For now, keep it global. */}
      <Header 
        ghostMode={ghostMode} 
        setGhostMode={setGhostMode} 
      />
      <main className="pt-20 px-4">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
