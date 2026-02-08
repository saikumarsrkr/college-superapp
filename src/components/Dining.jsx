import { useState, useEffect } from 'react'
import { Utensils, Star, Camera, Droplets, Zap, Wifi, X, Send, AlertCircle, Thermometer, Hammer, PaintBucket, Clock, CheckCircle, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const maintenanceOptions = [
  { id: 'plumbing', icon: Droplets, label: 'Plumbing', color: 'text-blue-400' },
  { id: 'electrical', icon: Zap, label: 'Electrical', color: 'text-yellow-400' },
  { id: 'wifi', icon: Wifi, label: 'WiFi', color: 'text-neon-blue' },
  { id: 'ac', icon: Thermometer, label: 'AC/Cooling', color: 'text-cyan-300' },
  { id: 'furniture', icon: Hammer, label: 'Furniture', color: 'text-orange-400' },
  { id: 'cleaning', icon: PaintBucket, label: 'Cleaning', color: 'text-pink-400' },
]

export default function Dining() {
  const [meals, setMeals] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [ticketModal, setTicketModal] = useState({ open: false, category: null, description: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()

    const mealSub = supabase
      .channel('dining-meals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => fetchData())
      .subscribe()

    const ticketSub = supabase
      .channel('dining-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(mealSub)
      supabase.removeChannel(ticketSub)
    }
  }, [])

  const fetchData = async () => {
    // Fetch Meals
    const { data: mealData } = await supabase.from('meals').select('*').order('served_at', { ascending: true })
    if (mealData) setMeals(mealData)

    // Fetch My Tickets
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
      if (ticketData) setMyTickets(ticketData)
    }
  }

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
      fetchData() // Refresh tickets immediately
      alert('Ticket raised successfully! Maintenance team has been notified.')
    }
    setLoading(false)
  }

  const handleCancelTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)

      if (error) throw error
      
      // Manually remove the deleted ticket from state to update UI instantly
      setMyTickets(prev => prev.filter(t => t.id !== ticketId))
      
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Error cancelling ticket: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-neon-green border-neon-green/30 bg-neon-green/10'
      case 'in-progress': return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10'
      case 'open': return 'text-neon-gold border-neon-gold/30 bg-neon-gold/10'
      default: return 'text-slate-400 border-slate-600 bg-slate-800/50'
    }
  }

  return (
    <section className="space-y-6 pb-24 animate-slide-up">
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
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

      {/* My Requests Section */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-neon-blue" />
          My Requests
        </h3>
        <div className="space-y-3">
          {myTickets.length === 0 ? (
            <div className="glass p-4 text-center text-slate-500 text-sm">
              No active maintenance requests.
            </div>
          ) : (
            myTickets.map((ticket) => (
              <div key={ticket.id} className="glass p-4 flex items-center justify-between group">
                <div>
                  <h4 className="text-white font-medium text-sm">{ticket.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)} uppercase tracking-wide`}>
                      {ticket.status}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {ticket.status === 'resolved' && (
                    <p className="text-neon-green text-[10px] mt-1 flex items-center gap-1">
                      <CheckCircle size={10} /> Resolved on {new Date(ticket.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {ticket.status === 'open' && (
                  <button 
                    onClick={() => handleCancelTicket(ticket.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Cancel Request"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hostel Info */}
      <div className="glass p-4">
        <h3 className="text-white font-semibold mb-3">Your Room</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up p-6 relative">
            <button 
              onClick={() => setTicketModal({ ...ticketModal, open: false })} 
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className={`w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-4 border border-zinc-700`}>
                <AlertCircle className="w-8 h-8 text-neon-gold" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Report Issue
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                Category: <span className="text-neon-blue">{maintenanceOptions.find(m => m.id === ticketModal.category)?.label}</span>
              </p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-5">
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2 block">
                  Describe the Problem
                </label>
                <textarea
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 focus:outline-none min-h-[120px] transition-all placeholder:text-zinc-600"
                  placeholder="e.g. The tap in the bathroom is leaking continuously..."
                  value={ticketModal.description}
                  onChange={(e) => setTicketModal({ ...ticketModal, description: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setTicketModal({ ...ticketModal, open: false })}
                  className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] py-3 bg-neon-blue text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} /> Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
