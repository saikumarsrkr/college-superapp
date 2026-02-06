import { Lock } from 'lucide-react'

export default function Arena() {
  const skills = [
    { id: 1, name: 'Python', x: 50, y: 20, unlocked: true, connections: [2, 3] },
    { id: 2, name: 'Data Science', x: 25, y: 45, unlocked: true, connections: [4] },
    { id: 3, name: 'Web Dev', x: 75, y: 45, unlocked: true, connections: [5] },
    { id: 4, name: 'ML Basics', x: 15, y: 70, unlocked: false, connections: [6] },
    { id: 5, name: 'React', x: 85, y: 70, unlocked: false, connections: [6] },
    { id: 6, name: 'Full Stack AI', x: 50, y: 90, unlocked: false, connections: [] },
  ]

  const getNodeById = (id) => skills.find(s => s.id === id)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Arena</h2>
        <p className="text-slate-400 text-sm">Your skill constellation</p>
      </div>

      {/* Skill Tree Visualization */}
      <div className="glass p-4 relative" style={{ height: '400px' }}>
        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {skills.map((skill) =>
            skill.connections.map((targetId) => {
              const target = getNodeById(targetId)
              if (!target) return null
              const bothUnlocked = skill.unlocked && target.unlocked
              return (
                <line
                  key={`${skill.id}-${targetId}`}
                  x1={`${skill.x}%`}
                  y1={`${skill.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={bothUnlocked ? '#00F0FF' : '#334155'}
                  strokeWidth="2"
                  strokeDasharray={bothUnlocked ? '0' : '5,5'}
                  className={bothUnlocked ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : ''}
                />
              )
            })
          )}
        </svg>

        {/* Skill Nodes */}
        {skills.map((skill) => (
          <button
            key={skill.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
              skill.unlocked ? 'z-10' : 'z-5'
            }`}
            style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
          >
            <div
              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all ${
                skill.unlocked
                  ? 'bg-neon-blue/20 border-2 border-neon-blue glow-blue'
                  : 'bg-slate-800/50 border-2 border-slate-600'
              }`}
            >
              {skill.unlocked ? (
                <span className="text-[10px] text-center text-white font-medium px-1 leading-tight">
                  {skill.name}
                </span>
              ) : (
                <>
                  <Lock size={14} className="text-slate-500" />
                  <span className="text-[8px] text-slate-500 mt-1">{skill.name}</span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-3">
        <article className="glass p-4">
          <p className="text-3xl font-bold text-neon-blue">3/6</p>
          <p className="text-slate-400 text-sm mt-1">Skills Unlocked</p>
        </article>
        <article className="glass p-4">
          <p className="text-3xl font-bold text-neon-gold">750</p>
          <p className="text-slate-400 text-sm mt-1">XP to Next</p>
        </article>
      </div>

      {/* Recommended Next */}
      <article className="glass p-4 border border-neon-blue/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Recommended Next</p>
            <h3 className="text-white font-semibold mt-1">ML Basics</h3>
            <p className="text-slate-500 text-xs mt-1">Requires: Data Science</p>
          </div>
          <button className="bg-neon-blue text-black font-semibold px-4 py-2 rounded-xl hover:scale-105 transition-transform">
            Start
          </button>
        </div>
      </article>
    </section>
  )
}
