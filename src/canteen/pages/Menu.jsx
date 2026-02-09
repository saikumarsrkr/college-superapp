import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Image as ImageIcon
} from 'lucide-react'

export default function Menu({ role }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true,
    daily_limit: '',
    current_stock: '',
    recipe: '{}', // JSON string for editing
    image_url: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('canteen_items').select('*').order('name'),
      supabase.from('canteen_categories').select('*').order('name')
    ])

    if (itemsRes.data) setItems(itemsRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
  }

  // --- Category Handlers ---

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return

    const { data, error } = await supabase
      .from('canteen_categories')
      .insert([{ name: newCategory.trim() }])
      .select()

    if (error) {
      alert('Error creating category: ' + error.message)
    } else if (data && data.length > 0) {
      setCategories([...categories, data[0]])
      setNewCategory('')
    } else {
      alert('Failed to create category (No data returned)')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure? This will remove the category from all associated items.')) return
    
    const { error } = await supabase.from('canteen_categories').delete().eq('id', id)
    if (!error) {
      setCategories(categories.filter(c => c.id !== id))
    } else {
      alert('Failed to delete: ' + error.message)
    }
  }

  // --- Item Handlers ---

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Parse recipe JSON
    let parsedRecipe = {}
    try {
      parsedRecipe = JSON.parse(formData.recipe || '{}')
    } catch (err) {
      alert('Invalid Recipe JSON format. Use {"ItemName": Qty}')
      setLoading(false)
      return
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
      is_available: formData.is_available,
      image_url: formData.image_url,
      daily_limit: formData.daily_limit ? parseInt(formData.daily_limit) : null,
      current_stock: formData.current_stock ? parseInt(formData.current_stock) : null,
      recipe: parsedRecipe
    }

    if (editingItem) {
      const { error } = await supabase
        .from('canteen_items')
        .update(payload)
        .eq('id', editingItem.id)
      
      if (!error) {
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
        closeModal()
      } else {
        alert('Error updating item: ' + error.message)
      }
    } else {
      const { data, error } = await supabase
        .from('canteen_items')
        .insert([payload])
        .select()
      
      if (!error && data) {
        setItems([...items, data[0]])
        closeModal()
      } else {
        alert('Error creating item: ' + error.message)
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    const { error } = await supabase.from('canteen_items').delete().eq('id', id)
    if (!error) setItems(items.filter(i => i.id !== id))
  }

  const toggleAvailability = async (item) => {
    const { error } = await supabase
      .from('canteen_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    
    if (!error) {
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    }
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        ...item,
        recipe: JSON.stringify(item.recipe || {}, null, 2),
        // Ensure nulls are empty strings for inputs
        daily_limit: item.daily_limit ?? '',
        current_stock: item.current_stock ?? '',
        category_id: item.category_id ?? ''
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
        is_available: true,
        daily_limit: '',
        current_stock: '',
        recipe: '{}',
        image_url: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Menu Management</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
          >
            Categories
          </button>
          <button 
            onClick={() => openModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-zinc-900 border ${item.is_available ? 'border-zinc-800' : 'border-zinc-800 opacity-60'} rounded-xl p-4 flex flex-col gap-4 group hover:border-zinc-700 transition-all`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-zinc-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.name}</h3>
                  <p className="text-orange-500 font-mono">₹{item.price}</p>
                </div>
              </div>
              <button onClick={() => toggleAvailability(item)} className="text-zinc-400 hover:text-white transition-colors">
                {item.is_available ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} />}
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 line-clamp-2">{item.description || 'No description'}</p>
            
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-500">
                {item.current_stock !== null && (
                  <span className={item.current_stock < 10 ? 'text-red-500 font-bold' : ''}>
                    Stock: {item.current_stock}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
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
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Manage Categories</h2>
            
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center bg-black p-2 rounded border border-zinc-800">
                  <span className="text-white text-sm">{cat.name}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                className="flex-1 bg-black border border-zinc-800 rounded p-2 text-white text-sm"
                placeholder="New Category Name"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded">
                <Plus size={20} />
              </button>
            </form>
            
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingItem ? 'Edit Item' : 'New Menu Item'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Name</label>
                  <input 
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Price (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase">Category</label>
                <select 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase">Description</label>
                <textarea 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white h-20" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Daily Limit</label>
                  <input 
                    type="number"
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                    value={formData.daily_limit}
                    onChange={e => setFormData({...formData, daily_limit: e.target.value})}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Current Stock</label>
                  <input 
                    type="number"
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                    value={formData.current_stock}
                    onChange={e => setFormData({...formData, current_stock: e.target.value})}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase">Recipe (Inventory Usage)</label>
                <textarea 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white font-mono text-xs h-20" 
                  value={formData.recipe}
                  onChange={e => setFormData({...formData, recipe: e.target.value})}
                  placeholder='{"Bun": 1, "Patty": 1}'
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Format: JSON object where keys match Inventory Item Names and values are quantity per order.
                </p>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase">Image URL</label>
                <input 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white" 
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..."
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
