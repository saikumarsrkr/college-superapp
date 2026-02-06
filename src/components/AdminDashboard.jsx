import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash, LogOut, Utensils, BookOpen, Trophy } from 'lucide-react'

export default function AdminDashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('dining')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [newItem, setNewItem] = useState({})

  useEffect(() => {
    fetchItems()
  }, [activeSection])

  const fetchItems = async () => {
    setLoading(true)
    let table = ''
    if (activeSection === 'dining') table = 'meals'
    if (activeSection === 'classes') table = 'classes'
    if (activeSection === 'skills') table = 'skills'

    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: false })
    if (error) console.error('Error fetching:', error)
    else setItems(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    let table = ''
    if (activeSection === 'dining') table = 'meals'
    if (activeSection === 'classes') table = 'classes'
    if (activeSection === 'skills') table = 'skills'

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) alert('Error deleting')
    else fetchItems()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    let table = ''
    let payload = {}

    if (activeSection === 'dining') {
      table = 'meals'
      payload = { name: newItem.name, items: newItem.items, served_at: newItem.served_at || '12:00' }
    }
    if (activeSection === 'classes') {
      table = 'classes'
      payload = { code: newItem.code, name: newItem.name, room: newItem.room, start_time: newItem.start_time || '09:00' }
    }
    if (activeSection === 'skills') {
      table = 'skills'
      payload = { name: newItem.name, category: newItem.category || 'Tech', xp_reward: newItem.xp_reward || 100 }
    }

    const { error } = await supabase.from(table).insert([payload])
    if (error) alert('Error adding: ' + error.message)
    else {
      setNewItem({})
      fetchItems()
    }
  }

  return (
    <div className="min-h-screen bg-black relative text-white p-6 pb-24 overflow-hidden">
      {/* Admin Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:60px_60px] opacity-5" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight">COMMAND CENTER</h1>
            <p className="text-zinc-500 text-sm font-mono mt-1 tracking-widest">SYSTEM_ADMIN_ACCESS_GRANTED</p>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
          >
            <LogOut size={16} /> Terminate Session
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { id: 'dining', icon: Utensils, label: 'Mess Menu' },
            { id: 'classes', icon: BookOpen, label: 'Timetable' },
            { id: 'skills', icon: Trophy, label: 'Skill Tree' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all duration-300 ${
                activeSection === id 
                  ? 'bg-zinc-900 border-red-500/50 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]' 
                  : 'bg-black border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 text-zinc-500'
              }`}
            >
              <Icon size={24} className={activeSection === id ? 'text-red-500' : 'text-zinc-600'} />
              <span className={`text-sm font-bold uppercase tracking-wider ${activeSection === id ? 'text-white' : 'text-zinc-500'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Management Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Plus size={16} className="text-red-500" /> New Entry
              </h3>
              
              <form onSubmit={handleAdd} className="space-y-4">
                {activeSection === 'dining' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Meal Name</label>
                      <input placeholder="e.g. Lunch" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Menu Items</label>
                      <textarea placeholder="e.g. Rice, Dal, Paneer" value={newItem.items || ''} onChange={e => setNewItem({...newItem, items: e.target.value})} className="input-field min-h-[80px]" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Time</label>
                      <input type="time" value={newItem.served_at || ''} onChange={e => setNewItem({...newItem, served_at: e.target.value})} className="input-field" />
                    </div>
                  </>
                )}

                {activeSection === 'classes' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Course Code</label>
                      <input placeholder="e.g. CS-101" value={newItem.code || ''} onChange={e => setNewItem({...newItem, code: e.target.value})} className="input-field" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Course Name</label>
                      <input placeholder="e.g. Intro to AI" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Room</label>
                        <input placeholder="304" value={newItem.room || ''} onChange={e => setNewItem({...newItem, room: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Time</label>
                        <input type="time" value={newItem.start_time || ''} onChange={e => setNewItem({...newItem, start_time: e.target.value})} className="input-field" />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'skills' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Skill Name</label>
                      <input placeholder="e.g. Python" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Category</label>
                      <input placeholder="e.g. Tech" value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})} className="input-field" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">XP Reward</label>
                      <input type="number" placeholder="100" value={newItem.xp_reward || ''} onChange={e => setNewItem({...newItem, xp_reward: e.target.value})} className="input-field" />
                    </div>
                  </>
                )}

                <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors mt-4 text-xs uppercase tracking-wide">
                  Deploy to Database
                </button>
              </form>
            </div>
          </div>

          {/* Database List */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 min-h-[600px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Live Database Records</h3>
                <span className="text-xs font-mono text-zinc-600">{items.length} records found</span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                  <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-mono">SYNCING...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="group flex justify-between items-center p-4 bg-black border border-zinc-800 rounded-xl hover:border-red-500/30 transition-all">
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.name || item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">
                            ID: {item.id.toString().slice(0,8)}
                          </span>
                          <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                            {activeSection === 'dining' && item.items}
                            {activeSection === 'classes' && `${item.code} • ${item.room}`}
                            {activeSection === 'skills' && `${item.category} • ${item.xp_reward} XP`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                      <p className="text-zinc-600 text-sm">Database is empty.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          @apply w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-all placeholder:text-zinc-700 font-mono;
        }
      `}</style>
    </div>
  )
}
