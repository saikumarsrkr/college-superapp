import { Eye, EyeOff, MessageCircle } from 'lucide-react'

export default function Header({ ghostMode, setGhostMode, toggleChat }) {
  const attendance = 87
  const xp = 2450
  const studentName = "Arjun Kumar"

  const getAttendanceColor = () => {
    if (attendance >= 85) return 'text-neon-green'
    if (attendance >= 75) return 'text-neon-gold'
    return 'text-neon-red'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass mx-4 mt-4 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-purple-600 flex items-center justify-center text-white font-bold text-lg glow-blue">
              AK
            </div>
            <div className="absolute -bottom-1 -right-1 bg-neon-blue text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              {ghostMode ? '•••' : xp}
            </div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">{studentName}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getAttendanceColor()}`}>
                {ghostMode ? '••%' : `${attendance}%`} Attendance
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <button
            onClick={toggleChat}
            className="p-2.5 bg-white/5 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-xl transition-all"
          >
            <MessageCircle size={20} />
          </button>

          {/* Ghost Mode Toggle */}
        <button
          onClick={() => setGhostMode(!ghostMode)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
            ghostMode 
              ? 'bg-neon-blue/20 text-neon-blue glow-blue' 
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          {ghostMode ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="text-xs font-medium">Ghost</span>
        </button>
        </div>
      </div>
    </header>
  )
}
