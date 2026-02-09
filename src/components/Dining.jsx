import { useState, useEffect } from 'react'
import { Utensils, Star, Camera, Droplets, Zap, Wifi, X, Send, AlertCircle, Thermometer, Hammer, PaintBucket, Clock, CheckCircle, Trash2, ShoppingBag, Plus, Minus, Search, ChevronRight } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('mess') // 'mess' | 'canteen'
  
  // Mess State
  const [meals, setMeals] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [ticketModal, setTicketModal] = useState({ open: false, category: null, description: '' })
  
  // Canteen State
  const [canteenItems, setCanteenItems] = useState([])
  const [canteenCategories, setCanteenCategories] = useState([])
  const [cart, setCart] = useState({}) // { itemId: quantity }
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [canteenSearch, setCanteenSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [myOrders, setMyOrders] = useState([])

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()

    const mealSub = supabase.channel('dining-meals').on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => fetchData()).subscribe()
    const ticketSub = supabase.channel('dining-tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchData()).subscribe()
    const canteenSub = supabase.channel('dining-canteen').on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_items' }, () => fetchCanteenData()).subscribe()
    const orderSub = supabase.channel('dining-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_orders' }, () => fetchMyOrders()).subscribe()

    return () => {
      supabase.removeChannel(mealSub)
      supabase.removeChannel(ticketSub)
      supabase.removeChannel(canteenSub)
      supabase.removeChannel(orderSub)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'canteen') {
      fetchCanteenData()
      fetchMyOrders()
    }
  }, [activeTab])

  const fetchData = async () => {
    const { data: mealData } = await supabase.from('meals').select('*').order('served_at', { ascending: true })
    if (mealData) setMeals(mealData)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: ticketData } = await supabase.from('tickets').select('*').eq('student_id', user.id).order('created_at', { ascending: false })
      if (ticketData) setMyTickets(ticketData)
    }
  }

  const fetchCanteenData = async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('canteen_items').select('*').eq('is_available', true).order('name'),
      supabase.from('canteen_categories').select('*').order('name')
    ])
    if (itemsRes.data) setCanteenItems(itemsRes.data)
    if (catsRes.data) setCanteenCategories(catsRes.data)
  }

  const fetchMyOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, items:canteen_order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setMyOrders(data)
  }

  // --- Mess Functions ---
  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Login required'); setLoading(false); return }

    const categoryLabel = maintenanceOptions.find(m => m.id === ticketModal.category)?.label || 'General'
    const { error } = await supabase.from('tickets').insert([{
      student_id: user.id,
      title: `${categoryLabel} Issue Reported`,
      category: ticketModal.category,
      description: ticketModal.description || 'No details.',
      priority: 'medium', status: 'open'
    }])

    if (error) alert('Failed: ' + error.message)
    else {
      setTicketModal({ open: false, category: null, description: '' })
      fetchData()
      alert('Ticket raised!')
    }
    setLoading(false)
  }

  const handleCancelTicket = async (ticketId) => {
    if (!confirm('Cancel ticket?')) return
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
    if (!error) setMyTickets(prev => prev.filter(t => t.id !== ticketId))
  }

  // --- Canteen Functions ---
  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }))
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) newCart[itemId]--
      else delete newCart[itemId]
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = canteenItems.find(i => i.id === itemId)
      return total + (item ? item.price * qty : 0)
    }, 0)
  }

  const handleCheckout = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Login required'); setLoading(false); return }

    const totalAmount = getCartTotal()
    
    // Create Order via Atomic RPC
    const orderItems = Object.entries(cart).map(([itemId, qty]) => {
      const item = canteenItems.find(i => i.id === itemId)
      return {
        item_id: itemId,
        quantity: qty,
        price_at_time: item.price
      }
    })

    const { error } = await supabase.rpc('create_canteen_order', {
      p_user_id: user.id,
      p_total_amount: totalAmount,
      p_notes: orderNotes,
      p_items: orderItems
    })

    if (error) {
      alert('Order failed: ' + error.message)
    } else {
      alert('Order placed successfully! Track it in "My Orders".')
      setCart({})
      setOrderNotes('')
      setIsCartOpen(false)
      fetchMyOrders()
    }
    setLoading(false)
  }

  // --- Render ---

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': case 'ready': case 'completed': return 'text-neon-green border-neon-green/30 bg-neon-green/10'
      case 'in-progress': case 'preparing': return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10'
      case 'open': case 'pending': return 'text-neon-gold border-neon-gold/30 bg-neon-gold/10'
      default: return 'text-slate-400 border-slate-600 bg-slate-800/50'
    }
  }

  return (
    <section className="space-y-6 pb-24 animate-slide-up min-h-screen relative">
      
      {/* Top Toggle */}
      <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800 w-fit mx-auto mb-6">
        <button
          onClick={() => setActiveTab('mess')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'mess' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Hostel Mess
        </button>
        <button
          onClick={() => setActiveTab('canteen')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'canteen' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Canteen
        </button>
      </div>

      {activeTab === 'mess' ? (
        // --- HOSTEL MESS VIEW ---
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-neon-gold" />
              Todays Menu
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {meals.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No meals scheduled.</p>
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
                        <Star key={star} className={`w-4 h-4 ${star <= (meal.rating || 0) ? 'text-neon-gold fill-neon-gold' : 'text-slate-600'}`} />
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Maintenance</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {maintenanceOptions.map(({ id, icon: Icon, label, color }) => (
                <button
                  key={id}
                  onClick={() => setTicketModal({ open: true, category: id, description: '' })}
                  className="glass p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group active:scale-95"
                >
                  <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-blue" />
              My Requests
            </h3>
            <div className="space-y-3">
              {myTickets.length === 0 ? (
                <div className="glass p-4 text-center text-slate-500 text-sm">No active requests.</div>
              ) : (
                myTickets.map((ticket) => (
                  <div key={ticket.id} className="glass p-4 flex items-center justify-between group">
                    <div>
                      <h4 className="text-white font-medium text-sm">{ticket.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)} uppercase tracking-wide`}>
                          {ticket.status}
                        </span>
                        <span className="text-slate-500 text-xs">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {ticket.status === 'open' && (
                      <button onClick={() => handleCancelTicket(ticket.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- CANTEEN VIEW ---
        <div className="space-y-6">
          {/* Recent Orders */}
          {myOrders.length > 0 && (
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-white font-bold mb-3 text-sm flex justify-between">
                Current Orders
                <span className="text-orange-500 cursor-pointer text-xs">View All</span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {myOrders.map(order => (
                  <div key={order.id} className="min-w-[200px] bg-black border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} uppercase`}>
                        {order.status}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">#{order.id.slice(0,4)}</span>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1">
                      {order.items?.map(i => `${i.quantity}x item`).join(', ')}
                    </div>
                    <div className="mt-auto pt-2 border-t border-zinc-900 flex justify-between items-center">
                      <span className="text-white font-bold text-sm">₹{order.total_amount}</span>
                      <span className="text-[10px] text-zinc-600">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="sticky top-20 z-10 bg-black/80 backdrop-blur-md pb-4 pt-2">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                placeholder="Search for food..."
                value={canteenSearch}
                onChange={e => setCanteenSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button 
                onClick={() => setActiveCategory('All')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === 'All' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
              >
                All
              </button>
              {canteenCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 gap-4 pb-20">
            {canteenItems
              .filter(item => 
                (activeCategory === 'All' || item.category_id === activeCategory) &&
                item.name.toLowerCase().includes(canteenSearch.toLowerCase())
              )
              .map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex gap-4">
                  <div className="w-20 h-20 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600"><Utensils size={20} /></div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{item.name}</h3>
                      <p className="text-zinc-500 text-xs line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-orange-500 font-bold font-mono">₹{item.price}</span>
                      
                      {cart[item.id] ? (
                        <div className="flex items-center gap-3 bg-zinc-800 rounded-full px-2 py-1 border border-zinc-700">
                          <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-zinc-700 rounded-full text-white"><Minus size={14} /></button>
                          <span className="text-sm font-bold text-white w-4 text-center">{cart[item.id]}</span>
                          <button onClick={() => addToCart(item)} className="p-1 hover:bg-zinc-700 rounded-full text-white"><Plus size={14} /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Floating Cart Button */}
          {Object.keys(cart).length > 0 && (
            <div className="fixed bottom-24 left-4 right-4 z-20 animate-slide-up">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-orange-500 text-white p-4 rounded-xl shadow-2xl shadow-orange-500/20 flex justify-between items-center font-bold"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-black/20 px-3 py-1 rounded-lg text-sm">
                    {Object.values(cart).reduce((a,b) => a+b, 0)} items
                  </div>
                  <span className="text-sm">View Cart</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">₹{getCartTotal()}</span>
                  <ChevronRight size={20} />
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-zinc-800 rounded-full text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(cart).map(([itemId, qty]) => {
                const item = canteenItems.find(i => i.id === itemId)
                if (!item) return null
                return (
                  <div key={itemId} className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                    <div>
                      <h3 className="text-white font-bold">{item.name}</h3>
                      <p className="text-orange-500 text-sm">₹{item.price} x {qty}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-800 rounded-full px-2 py-1 border border-zinc-700">
                      <button onClick={() => removeFromCart(itemId)} className="p-2 text-white"><Minus size={16} /></button>
                      <span className="text-white font-bold w-4 text-center">{qty}</span>
                      <button onClick={() => addToCart(item)} className="p-2 text-white"><Plus size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">Special Instructions</label>
              <textarea 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. No onions, extra spicy..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 bg-zinc-900 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-4 text-zinc-400 text-sm">
              <span>Item Total</span>
              <span>₹{getCartTotal()}</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-white font-bold text-xl">
              <span>Grand Total</span>
              <span>₹{getCartTotal()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Place Order (Pay at Counter)'}
            </button>
          </div>
        </div>
      )}

      {/* Ticket Modal (Hostel) */}
      {ticketModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setTicketModal({ ...ticketModal, open: false })} 
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-white">Report Issue</h3>
              <p className="text-zinc-400 text-sm mt-1">Category: <span className="text-neon-blue">{maintenanceOptions.find(m => m.id === ticketModal.category)?.label}</span></p>
            </div>
            <form onSubmit={handleSubmitTicket} className="space-y-5">
              <textarea
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-neon-blue/50 focus:outline-none min-h-[120px]"
                placeholder="Describe the issue..."
                value={ticketModal.description}
                onChange={(e) => setTicketModal({ ...ticketModal, description: e.target.value })}
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setTicketModal({ ...ticketModal, open: false })} className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-neon-blue text-black font-bold rounded-xl">{loading ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
