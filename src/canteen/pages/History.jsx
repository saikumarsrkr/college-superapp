import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function History() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_orders')
        .select('*, items:canteen_order_items(*)')
        .in('status', ['completed', 'rejected', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      if (data) setOrders(data)
    } catch (err) {
      console.error('Error fetching history:', err)
      // setError(err.message) // If we had error state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Order History</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-mono text-zinc-400">#{order.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-zinc-300">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    order.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-white">₹{order.total_amount}</td>
                <td className="px-6 py-4 text-zinc-400">
                  {order.items?.length || 0} items
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
