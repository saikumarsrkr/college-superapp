import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
  Clock,
  Save
} from 'lucide-react'

export default function Settings({ role }) {
  const [settings, setSettings] = useState({
    is_open: 'true',
    auto_accept_orders: 'false',
    operating_hours: '08:00 - 18:00'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('canteen_settings').select('*')
    if (data) {
      const newSettings = {}
      data.forEach(item => {
        newSettings[item.key] = item.value
      })
      setSettings(prev => ({ ...prev, ...newSettings }))
    }
    setLoading(false)
  }

  const handleToggle = async (key) => {
    const currentValue = settings[key] === 'true'
    const newValue = String(!currentValue)
    
    setSettings(prev => ({ ...prev, [key]: newValue }))
    
    await supabase
      .from('canteen_settings')
      .upsert({ key, value: newValue })
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value
    }))
    
    try {
      const { error } = await supabase.from('canteen_settings').upsert(updates)
      if (error) throw error
      alert('Settings saved!')
    } catch (err) {
      alert('Failed to save settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-zinc-500">Loading settings...</div>

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
        <div className="p-3 bg-zinc-900 rounded-xl text-orange-500">
          <SettingsIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Canteen Settings</h1>
          <p className="text-zinc-400">Configure operational parameters</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Open/Close */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Accepting Orders</h3>
            <p className="text-zinc-400 text-sm">Pause incoming orders instantly</p>
          </div>
          <button 
            onClick={() => handleToggle('is_open')}
            className={`transition-colors ${settings.is_open === 'true' ? 'text-green-500' : 'text-zinc-500'}`}
          >
            {settings.is_open === 'true' ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
          </button>
        </div>

        {/* Auto Accept */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Auto-Accept Orders</h3>
            <p className="text-zinc-400 text-sm">Automatically move new orders to Preparing</p>
          </div>
          <button 
            onClick={() => handleToggle('auto_accept_orders')}
            className={`transition-colors ${settings.auto_accept_orders === 'true' ? 'text-green-500' : 'text-zinc-500'}`}
          >
            {settings.auto_accept_orders === 'true' ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
          </button>
        </div>

        {/* Operating Hours */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Clock size={20} className="text-orange-500" />
            <h3>Operating Hours</h3>
          </div>
          <div className="flex gap-4">
            <input 
              type="text"
              value={settings.operating_hours}
              onChange={(e) => handleChange('operating_hours', e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none font-mono"
              placeholder="08:00 - 18:00"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Displayed to students on the ordering app. Does not automatically close the canteen.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </div>
    </div>
  )
}
