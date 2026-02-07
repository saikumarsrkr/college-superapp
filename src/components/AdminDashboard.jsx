import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash, LogOut, Utensils, BookOpen, Trophy, Save, X } from 'lucide-react'

/**
 * Admin Dashboard Component
 * 
 * The central command center for administrators.
 * Features:
 * - Real-time management of Dining, Classes, and Skills.
 * - CRUD operations via Supabase (R/W access for Admins).
 * - Live subscription to table changes.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {function} props.onLogout - Callback to handle admin logout.
 */
export default function AdminDashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('dining')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({})

  /**
   * Fetches data for the currently active section.
   */
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

  useEffect(() => {
    fetchItems()

    // Real-time subscription for the active section
    let table = ''
    if (activeSection === 'dining') table = 'meals'
    if (activeSection === 'classes') table = 'classes'
    if (activeSection === 'skills') table = 'skills'

    const subscription = supabase
      .channel('admin-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
        fetchItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  /**
   * Deletes a record from the database.
   * @param {number} id - The ID of the record to delete.
   */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    let table = ''
    if (activeSection === 'dining') table = 'meals'
    if (activeSection === 'classes') table = 'classes'
    if (activeSection === 'skills') table = 'skills'

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) alert('Error deleting: ' + error.message)
    // Realtime will handle refresh
  }

  /**
   * Handles the creation of a new record.
   * Maps form inputs to the correct table schema based on activeSection.
   * @param {Event} e - Form submission event.
   */
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
    if (error) {
      console.error(error)
      alert('Error adding: ' + error.message)
    } else {
      setNewItem({})
      setShowAddModal(false)
      // Realtime will handle refresh
    }
  }

  return (
    <div className="min-h-screen bg-black relative text-white p-6 pb-24 overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ADMIN CONSOLE</h1>
              <p className="text-xs text-zinc-500 font-mono tracking-wider">v2.4.0 • SECURE MODE</p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-xl transition-all text-xs font-bold uppercase tracking-wider group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </header>

        {/* Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'dining', icon: Utensils, label: 'Dining Menu', desc: 'Manage meals & timings' },
            { id: 'classes', icon: BookOpen, label: 'Timetable', desc: 'Schedule classes & labs' },
            { id: 'skills', icon: Trophy, label: 'Skill Tree', desc: 'Gamification rewards' },
          ].map(({ id, icon, label, desc }) => {
            const Icon = icon
            return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`relative flex-1 min-w-[240px] p-5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                activeSection === id 
                  ? 'bg-zinc-900 border-red-500/50 shadow-lg shadow-red-500/10' 
                  : 'bg-black border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform duration-500 ${activeSection === id ? 'scale-110 rotate-12 text-red-500' : 'scale-100 rotate-0 text-white'}`}>
                <Icon size={80} />
              </div>
              <div className="relative z-10">
                <Icon size={24} className={`mb-3 ${activeSection === id ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <h3 className={`text-lg font-bold ${activeSection === id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{label}</h3>
                <p className="text-xs text-zinc-600 mt-1">{desc}</p>
              </div>
            </button>
          )})}
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* List Section */}
          <div className="lg:col-span-12">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-6 bg-red-500 rounded-full" />
                  {activeSection.toUpperCase()} DATABASE
                </h2>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
                >
                  <Plus size={18} /> Add New
                </button>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin mb-4" />
                    <p className="text-xs font-mono tracking-widest">SYNCHRONIZING DATA...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-black/20">
                    <p className="text-zinc-500 font-medium">No records found in this sector.</p>
                    <button onClick={() => setShowAddModal(true)} className="text-red-500 text-sm font-bold mt-2 hover:underline">Create first entry</button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">
                      <div className="col-span-4">Primary Info</div>
                      <div className="col-span-5">Details</div>
                      <div className="col-span-2">Meta</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>
                    
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-black/40 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-900/40 transition-all group">
                        
                        {/* Column 1: Primary Info */}
                        <div className="col-span-4">
                          <h4 className="font-bold text-white text-base">{item.name || item.title}</h4>
                          <span className="text-[10px] font-mono text-zinc-600 bg-black px-1.5 py-0.5 rounded border border-zinc-800 mt-1 inline-block">
                            ID: {item.id.toString().slice(0,8)}
                          </span>
                        </div>

                        {/* Column 2: Details */}
                        <div className="col-span-5 text-sm text-zinc-400">
                           {activeSection === 'dining' && (
                             <div>
                               <span className="text-zinc-500 block text-xs mb-0.5">Menu</span>
                               {item.items}
                             </div>
                           )}
                           {activeSection === 'classes' && (
                             <div className="flex gap-4">
                               <div>
                                 <span className="text-zinc-500 block text-xs mb-0.5">Code</span>
                                 <span className="font-mono text-white bg-zinc-800/50 px-2 py-0.5 rounded">{item.code}</span>
                               </div>
                               <div>
                                 <span className="text-zinc-500 block text-xs mb-0.5">Room</span>
                                 {item.room}
                               </div>
                             </div>
                           )}
                           {activeSection === 'skills' && (
                             <div>
                               <span className="text-zinc-500 block text-xs mb-0.5">Category</span>
                               <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">{item.category}</span>
                             </div>
                           )}
                        </div>

                        {/* Column 3: Meta */}
                        <div className="col-span-2 text-sm">
                          {activeSection === 'dining' && (
                            <div className="flex items-center gap-1.5 text-orange-400">
                              <ClockIcon size={14} /> {item.served_at?.slice(0,5)}
                            </div>
                          )}
                          {activeSection === 'classes' && (
                             <div className="flex items-center gap-1.5 text-green-400">
                               <ClockIcon size={14} /> {item.start_time?.slice(0,5)}
                             </div>
                          )}
                          {activeSection === 'skills' && (
                            <div className="flex items-center gap-1.5 text-yellow-400 font-bold font-mono">
                              +{item.xp_reward} XP
                            </div>
                          )}
                        </div>

                        {/* Column 4: Action */}
                        <div className="col-span-1 text-right">
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-green-500" /> New {activeSection} Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {activeSection === 'dining' && (
                <>
                  <InputGroup label="Meal Name" placeholder="e.g. Lunch" value={newItem.name} onChange={v => setNewItem({...newItem, name: v})} required />
                  <InputGroup label="Menu Items" placeholder="e.g. Rice, Dal, Paneer" value={newItem.items} onChange={v => setNewItem({...newItem, items: v})} required textarea />
                  <InputGroup label="Serving Time" type="time" value={newItem.served_at} onChange={v => setNewItem({...newItem, served_at: v})} />
                </>
              )}
              {activeSection === 'classes' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Course Code" placeholder="e.g. CS-101" value={newItem.code} onChange={v => setNewItem({...newItem, code: v})} required />
                    <InputGroup label="Room No." placeholder="e.g. 304" value={newItem.room} onChange={v => setNewItem({...newItem, room: v})} />
                  </div>
                  <InputGroup label="Course Name" placeholder="e.g. Intro to AI" value={newItem.name} onChange={v => setNewItem({...newItem, name: v})} required />
                  <InputGroup label="Start Time" type="time" value={newItem.start_time} onChange={v => setNewItem({...newItem, start_time: v})} />
                </>
              )}
              {activeSection === 'skills' && (
                <>
                  <InputGroup label="Skill Name" placeholder="e.g. Python" value={newItem.name} onChange={v => setNewItem({...newItem, name: v})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Category" placeholder="e.g. Tech" value={newItem.category} onChange={v => setNewItem({...newItem, category: v})} />
                    <InputGroup label="XP Reward" type="number" placeholder="100" value={newItem.xp_reward} onChange={v => setNewItem({...newItem, xp_reward: v})} />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-black font-bold rounded-xl hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
                  <Save size={18} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
const InputGroup = ({ label, type = 'text', placeholder, value, onChange, required, textarea }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider ml-1">{label}</label>
    {textarea ? (
      <textarea 
        placeholder={placeholder} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="input-field min-h-[80px]" 
        required={required} 
      />
    ) : (
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="input-field" 
        required={required} 
      />
    )}
  </div>
)

const ClockIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
