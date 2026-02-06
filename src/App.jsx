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
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [ghostMode, setGhostMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Login onLogin={() => {}} />
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
