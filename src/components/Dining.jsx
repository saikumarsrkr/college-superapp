import { Utensils, Star, Camera, Droplets, Zap, Wifi } from 'lucide-react'

const meals = [
  { id: 1, name: 'Breakfast', time: '7:30 - 9:00', menu: 'Idli, Dosa, Tea', rating: 4 },
  { id: 2, name: 'Lunch', time: '12:30 - 2:00', menu: 'Rice, Dal, Sabzi', rating: 3 },
  { id: 3, name: 'Snacks', time: '4:30 - 5:30', menu: 'Samosa, Coffee', rating: 5 },
  { id: 4, name: 'Dinner', time: '7:30 - 9:00', menu: 'Roti, Curry, Rice', rating: 4 },
]

const maintenance = [
  { id: 'plumbing', icon: Droplets, label: 'Plumbing', color: 'text-blue-400' },
  { id: 'electrical', icon: Zap, label: 'Electrical', color: 'text-yellow-400' },
  { id: 'wifi', icon: Wifi, label: 'WiFi', color: 'text-neon-blue' },
]

export default function Dining() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-neon-gold" />
          Hostel & Dining
        </h2>

        {/* Mess Menu - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {meals.map((meal) => (
            <article key={meal.id} className="glass p-4 min-w-[200px] flex-shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-semibold">{meal.name}</h3>
                  <p className="text-xs text-slate-400">{meal.time}</p>
                </div>
                <button className="p-2 bg-neon-blue/20 rounded-full text-neon-blue hover:bg-neon-blue/30 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-300 mb-3">{meal.menu}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= meal.rating ? 'text-neon-gold fill-neon-gold' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Quick Maintenance */}
      <div>
        <h3 className="text-white font-semibold mb-3">Quick Maintenance</h3>
        <div className="grid grid-cols-3 gap-3">
          {maintenance.map(({ id, icon: Icon, label, color }) => (
            <button
              key={id}
              className="glass p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
            >
              <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs text-slate-300">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hostel Info */}
      <div className="glass p-4">
        <h3 className="text-white font-semibold mb-3">Your Room</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
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
    </section>
  )
}
