import { useState, useEffect } from 'react'
import { FileText, Search, Download, MessageCircle, Book, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Academy Component
 * 
 * Displays academic resources and faculty directory.
 * Fetches data from Supabase 'resources' and 'faculty' tables.
 * Supports searching and filtering by resource title or faculty name.
 * 
 * @component
 */
export default function Academy() {
  const [activeSection, setActiveSection] = useState('resources')
  const [searchQuery, setSearchQuery] = useState('')
  const [resources, setResources] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    /**
     * Fetches resources and faculty data from Supabase.
     * Updates state with transformed data for UI display.
     * Handles errors gracefully and manages loading state.
     */
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [resResp, facResp] = await Promise.all([
          supabase.from('resources').select('*').order('created_at', { ascending: false }),
          supabase.from('faculty').select('*').order('name', { ascending: true }),
        ])

        if (resResp.error || facResp.error) throw (resResp.error || facResp.error)

        if (isMounted) {
          setResources((resResp.data ?? []).map(item => ({
            id: item.id,
            title: item.title,
            type: item.category || 'DOC',
            size: '2 MB', // Placeholder as size isn't in DB schema yet
            author: 'Unknown', // Placeholder or fetch relation
            url: item.file_url
          })))

          setFaculty((facResp.data ?? []).map(prof => ({
            id: prof.id,
            name: prof.name,
            role: prof.specialization,
            status: prof.is_available ? 'available' : 'busy',
            time: prof.office_hours || 'By Appointment'
          })))
        }
      } catch (err) {
        console.error('Error fetching academy data:', err)
        if (isMounted) setError('Failed to load academy data.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    
    const resourceSub = supabase
      .channel('academy-resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => fetchData())
      .subscribe()

    const facultySub = supabase
      .channel('academy-faculty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => fetchData())
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(resourceSub)
      supabase.removeChannel(facultySub)
    }
  }, [])

  const query = searchQuery.trim().toLowerCase()

  const filteredResources = resources.filter(item => 
    (item.title ?? '').toLowerCase().includes(query) ||
    (item.author ?? '').toLowerCase().includes(query)
  )

  const filteredFaculty = faculty.filter(prof => 
    (prof.name ?? '').toLowerCase().includes(query) || 
    (prof.role ?? '').toLowerCase().includes(query)
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
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm animate-pulse">Loading Academy Data...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-400 text-sm">{error}</div>
        ) : activeSection === 'resources' ? (
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
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <Download size={18} />
                    </a>
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
          )
        }
      </div>
    </div>
  )
}
