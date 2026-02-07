            { id: 'skills', icon: Trophy, label: 'Skill Tree', desc: 'Gamification rewards' },
          ].map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`relative flex-1 min-w-[240px] p-5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                activeSection === id 
                  ? 'bg-zinc-900 border-red-500/50 shadow-lg shadow-red-500/10' 
                  : 'bg-black border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform duration-500 ${activeSection === id ? 'scale-110 rotate-12 text-red-500' : 'scale-100 rotate-0 text-white'}`}>
                <Icon size={80} />
              </div>
              <div className="relative z-10">
                <Icon size={24} className={`mb-3 ${activeSection === id ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <h3 className={`text-lg font-bold ${activeSection === id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{label}</h3>
                <p className="text-xs text-zinc-600 mt-1">{desc}</p>
              </div>
            </button>
          ))}