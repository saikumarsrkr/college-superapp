import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Package
} from 'lucide-react'

export default function Inventory({ role }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'units',
    min_threshold: '10'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('canteen_inventory')
      .select('*')
      .order('item_name')
    
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      min_threshold: parseFloat(formData.min_threshold)
    }

    if (editingItem) {
      const { error } = await supabase
        .from('canteen_inventory')
        .update(payload)
        .eq('id', editingItem.id)
      
      if (!error) {
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
        closeModal()
      }
    } else {
      const { data, error } = await supabase
        .from('canteen_inventory')
        .insert([payload])
        .select()
      
      if (!error && data) {
        setItems([...items, data[0]])
        closeModal()
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this inventory item?')) return
    const { error } = await supabase.from('canteen_inventory').delete().eq('id', id)
    if (!error) setItems(items.filter(i => i.id !== id))
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData(item)
    } else {
      setEditingItem(null)
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'units',
        min_threshold: '10'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const filteredItems = items.filter(i => 
    i.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Inventory</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
          >
            <Plus size={18} /> Add Stock
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredItems.map(item => {
              const isLow = item.quantity <= item.min_threshold
              return (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{item.item_name}</td>
                  <td className={`px-6 py-4 font-mono ${isLow ? 'text-red-500 font-bold' : 'text-zinc-300'}`}>
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{item.unit}</td>
                  <td className="px-6 py-4">
                    {isLow ? (
                      <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <AlertTriangle size={12} /> LOW STOCK
                      </span>
                    ) : (
                      <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-bold w-fit">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingItem ? 'Update Stock' : 'Add Inventory Item'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase">Item Name</label>
                <input 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                  value={formData.item_name}
                  onChange={e => setFormData({...formData, item_name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Quantity</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Unit</label>
                  <select 
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="units">Units</option>
                    <option value="kg">Kg</option>
                    <option value="liters">Liters</option>
                    <option value="packets">Packets</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase">Low Stock Threshold</label>
                <input 
                  type="number"
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                  value={formData.min_threshold}
                  onChange={e => setFormData({...formData, min_threshold: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
