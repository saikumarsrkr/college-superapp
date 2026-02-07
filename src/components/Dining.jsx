import { useState, useEffect } from 'react'
import { Utensils, Star, Camera, Droplets, Zap, Wifi, X, Send, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const maintenanceOptions = [
  { id: 'plumbing', icon: Droplets, label: 'Plumbing', color: 'text-blue-400' },
  { id: 'electrical', icon: Zap, label: 'Electrical', color: 'text-yellow-400' },
  { id: 'wifi', icon: Wifi, label: 'WiFi', color: 'text-neon-blue' },
]

export default function Dining() {
  const [meals, setMeals] = useState([])
  const [ticketModal, setTicketModal] = useState({ open: false, category: null, description: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMeals = async () => {
      const { data } = await supabase.from('meals').select('*').order('served_at', { ascending: true })
      if (data) setMeals(data)
    }
    fetchMeals()

    // Real-time subscription
    const subscription = supabase
      .channel('meals-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => {
        fetchMeals()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to raise a ticket.')
      setLoading(false)
      return
    }

    const categoryLabel = maintenanceOptions.find(m => m.id === ticketModal.category)?.label || 'General'

    const { error } = await supabase.from('tickets').insert([{
      student_id: user.id,
      title: `${categoryLabel} Issue Reported`,
      category: ticketModal.category,
      description: ticketModal.description || 'No additional details provided.',
      priority: 'medium',
      status: 'open'
    }])

    if (error) {
      alert('Failed to submit ticket: ' + error.message)
    } else {
      setTicketModal({ open: false, category: null, description: '' })
      alert('Ticket raised successfully! Maintenance team has been notified.')
    }
    setLoading(false)
  }

  return (
    <section className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-neon-gold" />
          Hostel & Dining
        </h2>

        {/* Mess Menu - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {meals.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No meals scheduled yet.</p>
          ) : (
            meals.map((meal) => (
              <article key={meal.id} className="glass p-4 min-w-[200px] flex-shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{meal.name}</h3>
                    <p className="text-xs text-slate-400">{meal.served_at ? meal.served_at.slice(0, 5) : ''}</p>
                  </div>
                  <button className="p-2 bg-neon-blue/20 rounded-full text-neon-blue hover:bg-neon-blue/30 transition-all">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 mb-3">{meal.items}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (meal.rating || 0) ? 'text-neon-gold fill-neon-gold' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Quick Maintenance */}
      <div>
        <h3 className="text-white font-semibold mb-3">Quick Maintenance</h3>
        <div className="grid grid-cols-3 gap-3">
          {maintenanceOptions.map(({ id, icon, label, color }) => {
            const Icon = icon
            return (
            <button
              key={id}
              onClick={() => setTicketModal({ open: true, category: id, description: '' })}
              className="glass p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group active:scale-95"
            >
              <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs text-slate-300">{label}</span>
            </button>
          )})}
        </div>
      </div>

      {/* Hostel Info */}
      <div className="glass p-4">
        <h3 className="text-white font-semibold mb-3">Your Room</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Block</p>
            <p className="text-white font-medium">C-204</p>
          </div>
          <div>
            <p className="text-slate-400">Warden</p>
            <p className="text-white font-medium">Mr. Sharma</p>
          </div>
          <div>
            <p className="text-slate-400">Check-out</p>
            <p className="text-white font-medium">10:00 PM</p>
          </div>
          <div>
            <p className="text-slate-400">Laundry</p>
            <p className="text-neon-green font-medium">Available</p>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="text-neon-gold" />
                Report {maintenanceOptions.find(m => m.id === ticketModal.category)?.label} Issue
              </h3>
              <button onClick={() => setTicketModal({ ...ticketModal, open: false })} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Description</label>
                <textarea
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-neon-blue/50 focus:outline-none min-h-[100px]"
                  placeholder="Describe the issue (e.g., leaking tap, no signal)..."
                  value={ticketModal.description}
                  onChange={(e) => setTicketModal({ ...ticketModal, description: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : <><Send size={18} /> Submit Ticket</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
