import { useState, useEffect } from 'react'
import { Lock, Map, Zap, CheckCircle, ChevronRight, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Arena() {
  const [skills, setSkills] = useState([])
  const [viewMode, setViewMode] = useState('graph') // 'graph' | 'path'
  const [selectedSkill, setSelectedSkill] = useState(null)

  useEffect(() => {
    const fetchSkills = async () => {
      const { data } = await supabase.from('skills').select('*').order('id', { ascending: true })
      if (data) {
        const enrichedData = data.map((s, i) => ({
          ...s,
          x: 20 + (i % 3) * 30,
          y: 20 + Math.floor(i / 3) * 30,
          // Unlocking logic: First 2 always unlocked, rest depend on previous being 'completed' (mocked as unlocked)
          unlocked: i < 2,
          completed: i < 1, // Mock completion for first item
          connections: i < data.length - 1 ? [data[i + 1].id] : []
        }))
        setSkills(enrichedData)
      }
    }
    fetchSkills()

    const subscription = supabase
      .channel('skills-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => {
        fetchSkills()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getNodeById = (id) => skills.find(s => s.id === id)

  return (
    <section className="space-y-6 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="text-neon-gold fill-neon-gold" size={24} />
            Skill Arena
          </h2>
          <p className="text-slate-400 text-sm">Master your craft, unlock your potential.</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setViewMode('graph')}
            className={`p-2 rounded-md transition-all ${viewMode === 'graph' ? 'bg-neon-blue text-black' : 'text-slate-400 hover:text-white'}`}
            title="Constellation View"
          >
            <Map size={18} />
          </button>
          <button
            onClick={() => setViewMode('path')}
            className={`p-2 rounded-md transition-all ${viewMode === 'path' ? 'bg-neon-blue text-black' : 'text-slate-400 hover:text-white'}`}
            title="Learning Path View"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'graph' ? (
        <div className="glass p-4 relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl shadow-black/50" style={{ height: '450px' }}>
          {/* Ambient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
          
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            {skills.map((skill) =>
              skill.connections.map((targetId) => {
                const target = getNodeById(targetId)
                if (!target) return null
                const bothUnlocked = skill.unlocked
                return (
                  <line
                    key={`${skill.id}-${targetId}`}
                    x1={`${skill.x}%`}
                    y1={`${skill.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={bothUnlocked ? '#00F0FF' : '#334155'}
                    strokeWidth={bothUnlocked ? "2" : "1"}
                    strokeDasharray={bothUnlocked ? '0' : '4,4'}
                    className={`transition-all duration-1000 ${bothUnlocked ? 'opacity-50' : 'opacity-20'}`}
                  />
                )
              })
            )}
          </svg>

          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${skill.unlocked ? 'z-10' : 'z-5'}`}
              style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
            >
              <div className="relative">
                {/* Ping Animation for Next Unlockable */}
                {skill.unlocked && !skill.completed && (
                  <div className="absolute inset-0 bg-neon-blue rounded-full animate-ping opacity-20" />
                )}
                
                <div
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                    skill.completed 
                      ? 'bg-neon-gold/20 border-2 border-neon-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                      : skill.unlocked
                        ? 'bg-black/80 border-2 border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-110'
                        : 'bg-black/50 border-2 border-zinc-800 grayscale'
                  }`}
                >
                  {skill.completed ? (
                    <CheckCircle size={20} className="text-neon-gold" />
                  ) : skill.unlocked ? (
                    <Star size={20} className="text-neon-blue fill-neon-blue/20" />
                  ) : (
                    <Lock size={16} className="text-zinc-600" />
                  )}
                </div>
                
                {/* Label */}
                <div className={`absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-bold tracking-wider backdrop-blur-sm transition-all ${
                  skill.unlocked ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20' : 'bg-black/50 text-zinc-600 border border-zinc-800'
                }`}>
                  {skill.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div 
              key={skill.id}
              onClick={() => skill.unlocked && setSelectedSkill(skill)}
              className={`relative glass p-0 overflow-hidden transition-all active:scale-98 ${
                !skill.unlocked && 'opacity-50 grayscale'
              }`}
            >
              {/* Progress Connector Line */}
              {index < skills.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-zinc-800 -z-10" />
              )}

              <div className="flex items-center p-4 gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold border-2 ${
                  skill.completed 
                    ? 'bg-neon-gold text-black border-neon-gold' 
                    : skill.unlocked 
                      ? 'bg-black text-neon-blue border-neon-blue'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-700'
                }`}>
                  {skill.completed ? <CheckCircle size={18} /> : index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold ${skill.unlocked ? 'text-white' : 'text-zinc-500'}`}>
                      {skill.name}
                    </h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      skill.unlocked ? 'bg-white/10 text-neon-blue' : 'bg-black/20 text-zinc-600'
                    }`}>
                      {skill.xp_reward} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {skill.category} • {skill.completed ? 'Mastered' : skill.unlocked ? 'In Progress' : 'Locked'}
                  </p>
                </div>

                <ChevronRight className={`text-zinc-600 ${skill.unlocked && 'text-white'}`} size={20} />
              </div>
              
              {/* Progress Bar (Visual only for now) */}
              {skill.unlocked && !skill.completed && (
                <div className="h-1 w-full bg-zinc-800">
                  <div className="h-full bg-neon-blue w-1/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Footer */}
      <div className="grid grid-cols-2 gap-3">
        <article className="glass p-4 border-l-4 border-neon-blue">
          <p className="text-2xl font-bold text-white">
            {skills.filter(s => s.completed).length}/{skills.length}
          </p>
          <p className="text-neon-blue text-xs font-bold uppercase tracking-wider mt-1">Modules Cleared</p>
        </article>
        <article className="glass p-4 border-l-4 border-neon-gold">
          <p className="text-2xl font-bold text-white">
            {skills.filter(s => s.completed).reduce((acc, curr) => acc + (curr.xp_reward || 0), 0)}
          </p>
          <p className="text-neon-gold text-xs font-bold uppercase tracking-wider mt-1">Total XP Earned</p>
        </article>
      </div>

      {/* Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSkill(null)}>
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-br from-neon-blue/20 to-purple-600/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black border-4 border-neon-blue flex items-center justify-center shadow-lg shadow-neon-blue/30">
                <Zap size={32} className="text-neon-blue fill-neon-blue" />
              </div>
              <button 
                onClick={() => setSelectedSkill(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{selectedSkill.name}</h3>
                <p className="text-neon-blue text-xs font-bold uppercase tracking-widest">{selectedSkill.category}</p>
              </div>

              <div className="space-y-4">
                <div className="glass p-3 flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Reward</span>
                  <span className="text-neon-gold font-bold font-mono">+{selectedSkill.xp_reward} XP</span>
                </div>
                
                <div className="glass p-3 flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Difficulty</span>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`w-2 h-6 rounded-full ${i <= 2 ? 'bg-neon-green' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                </div>

                <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                  {selectedSkill.completed ? 'Review Module' : 'Start Mission'} 
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
