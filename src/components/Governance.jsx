import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Timer, Plus, X, Link as LinkIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Governance Component
 * 
 * Manages campus complaints, tickets, and resolution tracking.
 * Features:
 * - Ticket List: Real-time feed of all public/student tickets.
 * - Status Indicators: Visual cues for Resolved, In-Progress, Pending, Overdue.
 * - SLA Tracking: Dynamic calculation of remaining time based on `sla_due_at`.
 * - Analytics: Response time metrics visualization.
 * - Ticket Creation: Raise new tickets with optional Vault document attachments.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {boolean} props.ghostMode - Whether ghost mode is enabled (blurs IDs).
 */
export default function Governance({ ghostMode }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [vaultDocs, setVaultDocs] = useState([])
  const [newTicket, setNewTicket] = useState({ title: '', category: 'General', description: '', attachment: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    /**
     * Loads tickets from Supabase and sets up a realtime listener.
     */
    const fetchTickets = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setTickets(data)
      setLoading(false)
    }
    fetchTickets()
    
    // Realtime subscription
    const subscription = supabase
      .channel('tickets-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  useEffect(() => {
    const fetchVaultDocs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('documents').select('*').eq('student_id', user.id)
        if (data) setVaultDocs(data)
      }
    }

    if (showCreate) {
      fetchVaultDocs()
    }
  }, [showCreate])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to raise a ticket.')
      setSubmitting(false)
      return
    }

    // Append attachment to description if selected
    let finalDescription = newTicket.description
    if (newTicket.attachment) {
      const doc = vaultDocs.find(d => d.id === parseInt(newTicket.attachment))
      if (doc) {
        finalDescription += `\n\n[Attached Evidence: ${doc.name}](${doc.file_url})`
      }
    }

    const { error } = await supabase.from('tickets').insert([{
      student_id: user.id,
      title: newTicket.title,
      category: newTicket.category,
      description: finalDescription,
      priority: 'medium',
      status: 'open'
    }])

    if (error) {
      alert('Failed to create ticket: ' + error.message)
    } else {
      setShowCreate(false)
      setNewTicket({ title: '', category: 'General', description: '', attachment: '' })
    }
    setSubmitting(false)
  }

  /**
   * Returns UI configuration (color, icon, border) based on ticket status.
   * @param {string} status - Ticket status (resolved, in-progress, etc.)
   */
  const getStatusConfig = (status) => {
    switch (status) {
      case 'resolved':
        return { 
          color: 'bg-neon-green/20 text-neon-green', 
          icon: CheckCircle,
          border: 'border-neon-green/30'
        }
      case 'in-progress':
        return { 
          color: 'bg-neon-blue/20 text-neon-blue', 
          icon: Timer,
          border: 'border-neon-blue/30'
        }
      case 'pending':
      case 'open':
        return { 
          color: 'bg-neon-gold/20 text-neon-gold', 
          icon: Clock,
          border: 'border-neon-gold/30'
        }
      case 'overdue':
        return { 
          color: 'bg-neon-red/20 text-neon-red', 
          icon: AlertTriangle,
          border: 'border-neon-red/50'
        }
      default:
        return { 
          color: 'bg-slate-500/20 text-slate-400', 
          icon: Clock,
          border: ''
        }
    }
  }

  /**
   * Formats the Service Level Agreement (SLA) time remaining.
   * @param {string} dueDate - ISO date string of due time.
   * @param {string} status - Current status of the ticket.
   */
  const formatSLA = (dueDate, status) => {
    if (status === 'resolved') return 'Resolved'
    if (!dueDate) return 'No SLA'
    
    const due = new Date(dueDate)
    const now = new Date()
    const diffHours = Math.floor((due - now) / (1000 * 60 * 60))
    
    if (diffHours < 0) return `Overdue by ${Math.abs(diffHours)}h`
    return `${diffHours}h remaining`
  }

  const responseData = [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 72 },
    { label: 'Wed', value: 90 },
    { label: 'Thu', value: 65 },
    { label: 'Fri', value: 95 },
  ]

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Governance</h2>
          <p className="text-slate-400 text-sm">Track complaints & resolutions</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl hover:bg-neon-blue/20 transition-all text-xs font-bold"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {loading && <p className="text-slate-500 text-xs text-center">Loading tickets...</p>}
        
        {!loading && tickets.map((ticket) => {
          const config = getStatusConfig(ticket.status)
          const Icon = config.icon
          const slaText = formatSLA(ticket.sla_due_at, ticket.status)
          const isOverdue = slaText.includes('Overdue')

          return (
            <article
              key={ticket.id}
              className={`glass p-4 border ${config.border} ${isOverdue ? 'animate-shake' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={`text-xs font-mono text-slate-500 ${ghostMode ? 'ghost-blur' : ''}`}>
                    {ticket.id.slice(0, 8)}
                  </p>
                  <h3 className="text-white font-medium mt-1">{ticket.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                  <Icon size={12} />
                  {ticket.status.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{ticket.department || ticket.category}</span>
                <span className={isOverdue ? 'text-neon-red' : 'text-slate-400'}>
                  {slaText}
                </span>
              </div>
            </article>
          )
        })}
      </div>

      {/* Response Time Analytics */}
      <article className="glass p-4">
        <h3 className="text-white font-semibold mb-4">Admin Response Time</h3>
        <div className="flex items-end justify-between h-24 gap-2">
          {responseData.map((day) => (
            <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
              <div 
                className="w-full bg-neon-blue/30 rounded-t-sm transition-all hover:bg-neon-blue/50"
                style={{ height: `${day.value}%` }}
              />
              <span className="text-slate-500 text-xs">{day.label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-400 text-xs mt-3">Average: 81% within SLA</p>
      </article>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Raise Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider ml-1">Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Brief issue summary"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider ml-1">Category</label>
                  <select 
                    className="input-field"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Harassment">Harassment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider ml-1">Attach from Vault</label>
                  <div className="relative">
                    <select 
                      className="input-field pl-8"
                      value={newTicket.attachment}
                      onChange={(e) => setNewTicket({...newTicket, attachment: e.target.value})}
                    >
                      <option value="">None</option>
                      {vaultDocs.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                      ))}
                    </select>
                    <LinkIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider ml-1">Description</label>
                <textarea 
                  className="input-field min-h-[100px]"
                  placeholder="Detailed description of the issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
