import { Shield, FileText, Award, Lock, ExternalLink } from 'lucide-react'

export default function Vault({ ghostMode }) {
  const documents = [
    { id: 1, name: 'ID Card', type: 'Identity', verified: true },
    { id: 2, name: 'Fee Receipt - Sem 4', type: 'Financial', verified: true },
    { id: 3, name: 'Library Card', type: 'Access', verified: true },
    { id: 4, name: 'Bonafide Certificate', type: 'Academic', verified: false },
  ]

  const achievements = [
    { id: 1, name: 'Dean\'s List', year: '2025', tier: 'gold' },
    { id: 2, name: 'Hackathon Winner', year: '2024', tier: 'blue' },
    { id: 3, name: 'Perfect Attendance', year: '2024', tier: 'green' },
  ]

  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold': return 'text-neon-gold border-neon-gold/50 glow-gold'
      case 'blue': return 'text-neon-blue border-neon-blue/50 glow-blue'
      case 'green': return 'text-neon-green border-neon-green/50 glow-green'
      default: return 'text-slate-400 border-slate-600'
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Vault</h2>
        <p className="text-slate-400 text-sm">Your secure documents & achievements</p>
      </div>

      {/* Security Status */}
      <article className="glass p-4 border border-neon-green/30 glow-green">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center">
            <Shield size={24} className="text-neon-green" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Vault Secured</h3>
            <p className="text-slate-400 text-sm">End-to-end encrypted</p>
          </div>
        </div>
      </article>

      {/* Documents */}
      <div>
        <h3 className="text-white font-semibold mb-3">Documents</h3>
        <div className="space-y-2">
          {documents.map((doc) => (
            <article key={doc.id} className="glass p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className={`text-white text-sm font-medium ${ghostMode ? 'ghost-blur' : ''}`}>
                    {doc.name}
                  </p>
                  <p className="text-slate-500 text-xs">{doc.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.verified ? (
                  <span className="text-neon-green text-xs font-medium">Verified</span>
                ) : (
                  <span className="text-neon-gold text-xs font-medium">Pending</span>
                )}
                <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <ExternalLink size={14} className="text-slate-400" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-white font-semibold mb-3">Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className={`glass p-3 text-center border ${getTierColor(achievement.tier)}`}
            >
              <Award size={24} className="mx-auto mb-2" />
              <p className="text-white text-xs font-medium leading-tight">{achievement.name}</p>
              <p className="text-slate-500 text-[10px] mt-1">{achievement.year}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Privacy Controls */}
      <article className="glass p-4">
        <h3 className="text-white font-semibold mb-3">Privacy Controls</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Share with recruiters</span>
            <button className="w-12 h-6 rounded-full bg-neon-blue/30 relative">
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-neon-blue" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Show on profile</span>
            <button className="w-12 h-6 rounded-full bg-slate-700 relative">
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-slate-500" />
            </button>
          </div>
        </div>
      </article>
    </section>
  )
}
