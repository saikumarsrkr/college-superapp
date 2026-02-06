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
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neon-blue">Admin Command</h1>
          <p className="text-slate-400 text-sm">System Override Enabled</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-red-500/20 text-red-500 rounded-lg">
          <LogOut size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveSection('dining')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeSection === 'dining' ? 'bg-neon-blue text-black font-bold' : 'glass text-slate-400'
          }`}
        >
          <Utensils size={18} /> Dining
        </button>
        <button
          onClick={() => setActiveSection('classes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeSection === 'classes' ? 'bg-neon-blue text-black font-bold' : 'glass text-slate-400'
          }`}
        >
          <BookOpen size={18} /> Classes
        </button>
        <button
          onClick={() => setActiveSection('skills')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeSection === 'skills' ? 'bg-neon-blue text-black font-bold' : 'glass text-slate-400'
          }`}
        >
          <Trophy size={18} /> Skills
        </button>
      </div>

      {/* Add New Form */}
      <form onSubmit={handleAdd} className="glass p-6 mb-8 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-neon-green" /> Add New {activeSection}
        </h3>
        <div className="grid gap-4">
          {activeSection === 'dining' && (
            <>
              <input placeholder="Meal Name (e.g. Lunch)" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
              <input placeholder="Items (e.g. Rice, Dal)" value={newItem.items || ''} onChange={e => setNewItem({...newItem, items: e.target.value})} className="input-field" required />
              <input type="time" value={newItem.served_at || ''} onChange={e => setNewItem({...newItem, served_at: e.target.value})} className="input-field" />
            </>
          )}
          {activeSection === 'classes' && (
            <>
              <input placeholder="Code (e.g. CS-101)" value={newItem.code || ''} onChange={e => setNewItem({...newItem, code: e.target.value})} className="input-field" required />
              <input placeholder="Name (e.g. Intro to AI)" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
              <input placeholder="Room (e.g. 304)" value={newItem.room || ''} onChange={e => setNewItem({...newItem, room: e.target.value})} className="input-field" />
            </>
          )}
          {activeSection === 'skills' && (
            <>
              <input placeholder="Skill Name" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
              <input placeholder="Category" value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})} className="input-field" />
              <input type="number" placeholder="XP Reward" value={newItem.xp_reward || ''} onChange={e => setNewItem({...newItem, xp_reward: e.target.value})} className="input-field" />
            </>
          )}
          <button type="submit" className="bg-neon-green text-black font-bold py-3 rounded-xl mt-2">
            Add to Database
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-4">
        {loading ? <p className="text-slate-500 text-center">Loading data...</p> : items.map(item => (
          <div key={item.id} className="glass p-4 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-white">{item.name || item.title}</h4>
              <p className="text-xs text-slate-400">
                {activeSection === 'dining' && item.items}
                {activeSection === 'classes' && `${item.code} | ${item.room}`}
                {activeSection === 'skills' && `${item.category} | ${item.xp_reward} XP`}
              </p>
            </div>
            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:text-red-300">
              <Trash size={18} />
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .input-field {
          @apply w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-neon-blue outline-none;
        }
      `}</style>
    </div>
  )
}
