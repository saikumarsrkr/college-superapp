import { useState, useEffect } from 'react'
import { Home, BookOpen, Trophy, Utensils, Shield } from 'lucide-react'

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'academy', icon: BookOpen, label: 'Academy' },
    { id: 'arena', icon: Trophy, label: 'Arena' },
    { id: 'dining', icon: Utensils, label: 'Fuel' },
    { id: 'vault', icon: Shield, label: 'Vault' },
  ]

  const [keyboardOpen, setKeyboardOpen] = useState(false)

  // Hide nav when keyboard opens (common mobile issue)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) setKeyboardOpen(true)
      else setKeyboardOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (keyboardOpen) return null

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="glass h-20 px-2 flex items-center justify-around relative overflow-hidden">
        {/* Dynamic Active Indicator Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 flex flex-col items-center justify-center w-14 h-full transition-all duration-300 group`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-neon-blue/10 text-neon-blue -translate-y-1' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`}
                />
              </div>
              
              <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${
                isActive ? 'text-white opacity-100' : 'opacity-0 h-0 overflow-hidden'
              }`}>
                {tab.label}
              </span>
              
              {/* Active Dot */}
              {isActive && (
                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_8px_#00F0FF]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
