import { useState, useEffect } from 'react'
import { Check, Clock, MapPin, Zap, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [classes, setClasses] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Mock data for demo if DB is empty
    setClasses([
      { id: 1, name: 'Data Structures', room: 'LH-201', time: '09:00', status: 'verified' },
      { id: 2, name: 'Machine Learning', room: 'CS-Lab 3', time: '11:00', status: 'ongoing' },
      { id: 3, name: 'Cybersecurity', room: 'LH-104', time: '14:00', status: 'upcoming' },
    ])
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // App.jsx will handle the redirect because of onAuthStateChange
  }

  return (
    <div className="space-y-8 animate-slide-up pb-24">
      {/* Greeting Header */}
      <header className="flex justify-between items-end px-2">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Good Morning,</p>
          <h1 className="text-3xl font-bold text-white glow-text-blue">
            {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
        </div>
        <button 
          onClick={handleLogout}
          className="w-12 h-12 rounded-full border-2 border-neon-blue p-0.5 glow-box-blue relative group"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-neon-blue to-purple-600 group-hover:opacity-80 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <LogOut size={16} className="text-white" />
          </div>
        </button>
      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex flex-col items-center justify-center h-24">
          <span className="text-2xl font-bold text-neon-green glow-text-green">87%</span>
          <span className="text-xs text-slate-400 mt-1">Attendance</span>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center h-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-neon-purple/5" />
          <span className="text-2xl font-bold text-neon-purple">Lv. 4</span>
          <span className="text-xs text-slate-400 mt-1">Cyber Specialist</span>
        </div>
        <div className="glass-panel p-4 flex flex-col items-center justify-center h-24">
          <span className="text-2xl font-bold text-neon-gold glow-text-gold">₹450</span>
          <span className="text-xs text-slate-400 mt-1">Wallet</span>
        </div>
      </div>

      {/* Dynamic Island / Active Card */}
      <section>
        <div className="flex justify-between items-baseline mb-4 px-2">
          <h2 className="text-lg font-semibold text-white">Happening Now</h2>
          <span className="text-xs text-neon-blue animate-pulse">Live</span>
        </div>
        
        <div className="glass p-5 border-l-4 border-l-neon-blue relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={80} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Machine Learning</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <MapPin size={14} />
                  <span>CS-Lab 3</span>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold uppercase tracking-wider">
                Lab Session
              </div>
            </div>

            <button className="w-full py-3 bg-neon-blue text-black font-bold rounded-xl hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 glow-box-blue">
              <Zap size={18} />
              Tap to Check-In
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              Bluetooth Beacon Detected • 3m away
            </p>
          </div>
        </div>
      </section>

      {/* Up Next / Timeline */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 px-2">Up Next</h2>
        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id} className="glass-panel p-4 flex items-center justify-between group active:scale-98 transition-transform">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 text-slate-300 group-hover:bg-white/10 transition-colors">
                  <span className="text-sm font-bold">{cls.time}</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">{cls.name}</h4>
                  <p className="text-xs text-slate-500">{cls.room}</p>
                </div>
              </div>
              {cls.status === 'verified' ? (
                <Check className="text-neon-green" size={20} />
              ) : (
                <Clock className="text-slate-600" size={20} />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
