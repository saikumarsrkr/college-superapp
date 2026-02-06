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
  
  // URL-based routing for Admin Login
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/admin')

  useEffect(() => {
    // Listen for URL changes
    const handleLocationChange = () => {
      setIsAdminRoute(window.location.pathname === '/admin')
    }
    window.addEventListener('popstate', handleLocationChange)
    
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
      window.removeEventListener('popstate', handleLocationChange)
      subscription.unsubscribe()
    }
  }, [])

  const fetchRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  const handleLogin = (userRole) => {
    setRole(userRole)
  }

  // Admin Route Handler
  if (isAdminRoute && !session) {
    return <AdminLogin onLogin={handleLogin} />
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  if (role === 'admin') {
    return <AdminDashboard onLogout={() => {
      supabase.auth.signOut()
      window.location.href = '/'
    }} />
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
