import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CanteenLogin from './components/CanteenLogin'
import CanteenLayout from './CanteenLayout'
import Dashboard from './pages/Dashboard'
import LiveOrders from './pages/LiveOrders'
import Menu from './pages/Menu'
import Inventory from './pages/Inventory'
import History from './pages/History'
import Settings from './pages/Settings'

export default function CanteenApp() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let authSubscription

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user?.id) fetchRole(session.user.id)
      else setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session?.user?.id) fetchRole(session.user.id)
        else {
          setRole(null)
          setLoading(false)
        }
      })
      authSubscription = subscription
    }

    initAuth()

    return () => {
      if (authSubscription) authSubscription.unsubscribe()
    }
  }, [])

  const fetchRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) {
      setRole(data.role)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    )
  }

  // Not logged in -> Show Canteen Login
  if (!session) {
    return <CanteenLogin />
  }

  // Logged in but not canteen staff -> Access Denied
  if (role && !['canteen_runner', 'canteen_admin', 'admin'].includes(role)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-zinc-400 mb-6 text-center">Only authorized canteen staff can access this portal.</p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Handle null role (loading or error state) - should be caught by loading check, but safe guard
  if (role === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    )
  }

  // Authenticated Canteen Staff -> Show Layout
  return (
    <CanteenLayout 
      role={role} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onLogout={() => supabase.auth.signOut()}
    >
      {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
      {activeTab === 'live_orders' && <LiveOrders role={role} />}
      {activeTab === 'menu' && <Menu role={role} />}
      {activeTab === 'inventory' && <Inventory role={role} />}
      {activeTab === 'history' && <History />}
      {activeTab === 'settings' && <Settings role={role} />}
    </CanteenLayout>
  )
}
