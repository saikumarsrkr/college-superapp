import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Timer } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Governance({ ghostMode }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Governance</h2>
        <p className="text-slate-400 text-sm">Track complaints & resolutions</p>
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
    </section>
  )
}
