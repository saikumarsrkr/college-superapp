import { useState } from 'react'
import { Book, FileText, Search, User, Download, MessageCircle } from 'lucide-react'

export default function Academy() {
  const [activeSection, setActiveSection] = useState('resources')
  const [searchQuery, setSearchQuery] = useState('')

  const resources = [
    { id: 1, title: 'Data Structures Notes', type: 'PDF', size: '2.4 MB', author: 'Prof. Sharma' },
    { id: 2, title: 'ML Lab Manual v2', type: 'DOCX', size: '1.1 MB', author: 'Dr. Emily' },
    { id: 3, title: 'Cybersec Research Paper', type: 'PDF', size: '4.5 MB', author: 'IEEE' },
  ]

  const faculty = [
    { id: 1, name: 'Dr. Arjun Singh', role: 'HOD - CSE', status: 'available', time: 'Now' },
    { id: 2, name: 'Prof. Neha Gupta', role: 'AI Specialist', status: 'busy', time: '14:00' },
    { id: 3, name: 'Mr. Rahul Verma', role: 'Cyber Labs', status: 'available', time: 'Now' },
  ]

  const filteredResources = resources.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFaculty = faculty.filter(prof => 
    prof.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prof.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-slide-up pb-24">
      {/* Header */}
      <header className="px-2">
        <h1 className="text-3xl font-bold text-white mb-1">Academy</h1>
        <p className="text-slate-400 text-sm">Resources, Faculty & Research</p>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Search papers, books, faculty..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
        />
      </div>

      {/* Toggle */}
      <div className="flex p-1 bg-white/5 rounded-xl">
        <button 
          onClick={() => setActiveSection('resources')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSection === 'resources' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Resources
        </button>
        <button 
          onClick={() => setActiveSection('faculty')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSection === 'faculty' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Faculty
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {activeSection === 'resources' ? (
          <>
            <h2 className="text-white font-semibold px-1">Recent Uploads</h2>
            {filteredResources.length === 0 ? (
              <p className="text-slate-500 text-sm px-1 italic">No resources found matching "{searchQuery}"</p>
            ) : (
              filteredResources.map((item) => (
                <div key={item.id} className="glass-panel p-4 flex items-center justify-between group active:scale-98 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-medium">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.author} • {item.size}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h2 className="text-white font-semibold px-1">Faculty Directory</h2>
            {filteredFaculty.length === 0 ? (
              <p className="text-slate-500 text-sm px-1 italic">No faculty found matching "{searchQuery}"</p>
            ) : (
              filteredFaculty.map((prof) => (
                <div key={prof.id} className="glass-panel p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs border border-white/10">
                      {prof.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-medium">{prof.name}</h3>
                      <p className="text-xs text-slate-500">{prof.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      prof.status === 'available' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {prof.status === 'available' ? 'Online' : 'Busy'}
                    </div>
                    <button className="p-2 rounded-full bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
