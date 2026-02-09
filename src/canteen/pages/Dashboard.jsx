import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  Activity,
  Play,
  Pause
} from 'lucide-react'

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    completedToday: 0,
    revenueToday: 0,
    lowStock: 0
  })
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchStatus()

    // Realtime subscription for stats updates
    const ordersSub = supabase
      .channel('canteen_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_orders' }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSub)
    }
  }, [])

  const fetchStats = async () => {
    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
    
    try {
      const pendingRes = await supabase.from('canteen_orders').select('id', { count: 'exact' }).eq('status', 'pending')
      if (pendingRes.error) throw pendingRes.error

      const preparingRes = await supabase.from('canteen_orders').select('id', { count: 'exact' }).eq('status', 'preparing')
      if (preparingRes.error) throw preparingRes.error

      const completedRes = await supabase.from('canteen_orders').select('total_amount').eq('status', 'completed').gte('created_at', todayStart)
      if (completedRes.error) throw completedRes.error

      const lowStockRes = await supabase.from('canteen_inventory').select('id', { count: 'exact' }).lt('quantity', 10)
      if (lowStockRes.error) throw lowStockRes.error

      setStats({
        pending: pendingRes.count || 0,
        preparing: preparingRes.count || 0,
        completedToday: completedRes.data?.length || 0,
        revenueToday: completedRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        lowStock: lowStockRes.count || 0
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('canteen_settings')
      .select('value')
      .eq('key', 'is_open')
      .single()
    if (data) setIsOpen(data.value === 'true')
  }

  const toggleOpen = async () => {
    const newState = !isOpen
    const { error } = await supabase
      .from('canteen_settings')
      .upsert({ key: 'is_open', value: String(newState) })
    
    if (!error) setIsOpen(newState)
  }

  const colorMap = {
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'hover:border-orange-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'hover:border-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'hover:border-green-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'hover:border-red-500' }
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
    const theme = colorMap[color] || colorMap.orange
    
    return (
      <div 
        onClick={onClick}
        className={`bg-zinc-900 border border-zinc-800 p-6 rounded-xl cursor-pointer transition-colors ${theme.border}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${theme.bg} ${theme.text}`}>
            <Icon size={24} />
          </div>
        </div>
        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    )
  }

  if (loading) return <div className="text-zinc-500">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">Welcome back, Manager</p>
        </div>
        
        <button
          onClick={toggleOpen}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            isOpen 
              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
          }`}
        >
          {isOpen ? <Pause size={18} /> : <Play size={18} />}
          {isOpen ? 'PAUSE ORDERS' : 'RESUME ORDERS'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Orders in Queue" 
          value={stats.pending} 
          icon={ShoppingCart} 
          color="orange"
          onClick={() => setActiveTab('live_orders')}
        />
        <StatCard 
          title="Preparing" 
          value={stats.preparing} 
          icon={Activity} 
          color="blue"
          onClick={() => setActiveTab('live_orders')}
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenueToday}`} 
          icon={Users} 
          color="green"
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color="red"
          onClick={() => setActiveTab('inventory')}
        />
      </div>

      {/* Recent Activity or Chart Placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Live Activity</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg">
          Activity Chart Coming Soon
        </div>
      </div>
    </div>
  )
}
