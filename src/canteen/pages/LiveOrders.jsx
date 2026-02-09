import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Check, 
  X, 
  Clock, 
  ChefHat, 
  Bell, 
  Trash2,
  RefreshCw
} from 'lucide-react'

export default function LiveOrders() {
  const [orders, setOrders] = useState({
    pending: [],
    preparing: [],
    ready: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('live_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_orders' }, (payload) => {
        handleRealtimeUpdate(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('canteen_orders')
      .select(`
        *,
        items:canteen_order_items(
          quantity,
          price_at_time,
          item:canteen_items(name)
        ),
        user:user_id(
          email,
          raw_user_meta_data
        )
      `)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    // Group by status
    const grouped = {
      pending: [],
      preparing: [],
      ready: []
    }

    data.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order)
      }
    })

    setOrders(grouped)
    setLoading(false)
  }

  const handleRealtimeUpdate = (payload) => {
    // For simplicity, just refetch all orders on any change
    // Ideally we'd update state locally, but complex joins make fetching easier
    fetchOrders()
  }

  const updateStatus = async (orderId, newStatus) => {
    let notes = null
    
    if (['rejected', 'cancelled'].includes(newStatus)) {
      const reason = prompt(`Please enter a reason for ${newStatus === 'rejected' ? 'rejecting' : 'cancelling'} this order:`)
      if (!reason) return // Cancel action if no reason provided
      notes = `[${newStatus.toUpperCase()}: ${reason}]`
    }

    const payload = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    }

    // Append reason to notes if exists
    if (notes) {
      // Fetch current notes first to append
      const { data } = await supabase.from('canteen_orders').select('notes').eq('id', orderId).single()
      const currentNotes = data?.notes ? `${data.notes}\n` : ''
      payload.notes = currentNotes + notes
    }

    const { error } = await supabase
      .from('canteen_orders')
      .update(payload)
      .eq('id', orderId)

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const OrderCard = ({ order, type }) => {
    const timeElapsed = Math.floor((new Date() - new Date(order.created_at)) / 60000)
    const isLate = timeElapsed > 15 // Highlight if waiting > 15 mins

    return (
      <div className={`bg-zinc-900 border ${isLate ? 'border-red-500/50' : 'border-zinc-800'} rounded-xl p-4 shadow-lg flex flex-col gap-3 transition-all hover:scale-[1.02]`}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-zinc-500">#{order.id.slice(0, 8)}</span>
            <h3 className="font-bold text-white text-lg">
              {order.user?.raw_user_meta_data?.full_name || 'Student'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {order.payment_status?.toUpperCase()}
            </span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${isLate ? 'text-red-500' : 'text-zinc-400'}`}>
            <Clock size={14} />
            <span>{timeElapsed}m</span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-1 my-2">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-zinc-300">
                <span className="font-bold text-orange-500 mr-2">{item.quantity}x</span>
                {item.item?.name || 'Unknown Item'}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-xs text-yellow-500 italic">
            "{order.notes}"
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-zinc-800 flex gap-2">
          {type === 'pending' && (
            <>
              <button 
                onClick={() => updateStatus(order.id, 'rejected')}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <X size={14} /> REJECT
              </button>
              <button 
                onClick={async () => {
                  // Call RPC for transactional inventory deduction
                  const { error } = await supabase.rpc('accept_order_and_deduct_inventory', { p_order_id: order.id })
                  if (error) {
                    console.error(error)
                    alert('Failed to accept: ' + error.message)
                  } else {
                    // Success (Realtime will update UI)
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <ChefHat size={14} /> ACCEPT
              </button>
            </>
          )}

          {type === 'preparing' && (
            <button 
              onClick={() => updateStatus(order.id, 'ready')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <Bell size={14} /> READY
            </button>
          )}

          {type === 'ready' && (
            <button 
              onClick={() => updateStatus(order.id, 'completed')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-green-500 border border-green-500/50 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <Check size={14} /> PICKED UP
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="text-white p-8 animate-pulse">Loading orders...</div>

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 overflow-hidden">
      
      {/* Column 1: Pending */}
      <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-900">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50">
          <h2 className="font-bold text-orange-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            NEW ORDERS
          </h2>
          <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs font-bold">
            {orders.pending.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.pending.length === 0 ? (
            <div className="text-zinc-600 text-center mt-10 text-sm">No new orders</div>
          ) : (
            orders.pending.map(order => <OrderCard key={order.id} order={order} type="pending" />)
          )}
        </div>
      </div>

      {/* Column 2: Preparing */}
      <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-900">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50">
          <h2 className="font-bold text-blue-500 flex items-center gap-2">
            <ChefHat size={16} />
            KITCHEN
          </h2>
          <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs font-bold">
            {orders.preparing.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.preparing.map(order => <OrderCard key={order.id} order={order} type="preparing" />)}
        </div>
      </div>

      {/* Column 3: Ready */}
      <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-900">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50">
          <h2 className="font-bold text-green-500 flex items-center gap-2">
            <Bell size={16} />
            READY
          </h2>
          <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold">
            {orders.ready.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.ready.map(order => <OrderCard key={order.id} order={order} type="ready" />)}
        </div>
      </div>

    </div>
  )
}
