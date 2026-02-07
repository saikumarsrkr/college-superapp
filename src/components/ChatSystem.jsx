import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Search, User, ChevronLeft, AtSign } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ChatSystem({ session, isOpen, onClose }) {
  const [activeChat, setActiveChat] = useState(null) // profile object of the person we are chatting with
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentChats, setRecentChats] = useState([]) // List of profiles
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  const currentUserId = session?.user?.id

  // 1. Fetch Recent Chats (People I've talked to)
  useEffect(() => {
    if (isOpen && !activeChat) {
      fetchRecentChats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeChat])

  const fetchRecentChats = async () => {
    // This is a bit complex in pure Supabase JS without a join view, 
    // so we'll fetch unique sender/receiver IDs from messages involving us.
    const { data: sent } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', currentUserId)
    
    const { data: received } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', currentUserId)

    const ids = new Set([
      ...(sent?.map(m => m.receiver_id) || []),
      ...(received?.map(m => m.sender_id) || [])
    ])

    if (ids.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(ids))
      setRecentChats(profiles || [])
    }
  }

  // 2. Search Users
  useEffect(() => {
    if (searchQuery.length > 2) {
      const searchUsers = async () => {
        // Search by name OR username (handle)
        // Note: Supabase 'ilike' with 'or' syntax: .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        const q = searchQuery.replace('@', '') // strip @ if user typed it
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
          .neq('id', currentUserId) // Don't show myself
          .limit(5)
        setSearchResults(data || [])
      }
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, currentUserId])

  // 3. Chat Messages & Subscription
  useEffect(() => {
    let channel

    if (activeChat) {
      fetchMessages(activeChat.id)

      channel = supabase
        .channel(`chat:${activeChat.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`, // Listen for msg to me
        }, (payload) => {
          if (payload.new.sender_id === activeChat.id) {
            setMessages(prev => [...prev, payload.new])
            scrollToBottom()
          }
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`, // Listen for msg from me (other tab/device)
        }, (payload) => {
          if (payload.new.receiver_id === activeChat.id) {
            setMessages(prev => [...prev, payload.new])
            scrollToBottom()
          }
        })
        .subscribe()
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat])

  const fetchMessages = async (targetId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])
    scrollToBottom()
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return

    const payload = {
      sender_id: currentUserId,
      receiver_id: activeChat.id,
      content: newMessage.trim()
    }

    const { error } = await supabase.from('messages').insert([payload])
    
    if (error) {
      console.error('Error sending:', error)
    } else {
      setNewMessage('')
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  if (!session || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-24 md:right-4 md:w-96 md:h-[600px] bg-black/95 md:bg-black/95 md:border md:border-zinc-800 md:rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col animate-scale-up">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between shrink-0">
        {activeChat ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveChat(null)} className="p-1 hover:bg-white/10 rounded-full">
              <ChevronLeft size={24} className="text-zinc-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                {activeChat.full_name?.[0] || activeChat.email[0]}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">{activeChat.full_name || 'Student'}</h3>
                <p className="text-zinc-500 text-[10px] font-mono leading-tight">@{activeChat.username || 'unknown'}</p>
              </div>
            </div>
          </div>
        ) : (
          <h3 className="text-white font-bold text-xl flex items-center gap-2">
            <MessageCircle className="text-neon-blue" size={24} /> Messages
          </h3>
        )}
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-zinc-950/50 overscroll-contain">
        {activeChat ? (
          // Conversation View
          <div className="p-4 space-y-3 min-h-full">
            {messages.length === 0 && (
              <div className="text-center text-zinc-600 text-xs py-10">
                Start the conversation with @{activeChat.username || activeChat.full_name}
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe 
                      ? 'bg-neon-blue text-black rounded-tr-none' 
                      : 'bg-zinc-800 text-white rounded-tl-none border border-zinc-700'
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-black/50' : 'text-zinc-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Chat List / Search View
          <div className="p-4 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search by name or @handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
              />
            </div>

            {/* Search Results */}
            {searchQuery.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Search Results</p>
                {searchResults.length === 0 ? (
                  <p className="text-zinc-600 text-sm italic px-1">No users found.</p>
                ) : (
                  searchResults.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => { setActiveChat(profile); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900 hover:border-neon-blue/30 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-neon-blue group-hover:bg-neon-blue/10 transition-colors">
                        <AtSign size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{profile.full_name}</p>
                        <p className="text-zinc-500 text-xs">@{profile.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Recent Chats */}
            {searchQuery.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Recent Conversations</p>
                {recentChats.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                    <MessageCircle className="mx-auto text-zinc-700 mb-2" size={32} />
                    <p className="text-zinc-600 text-sm">No recent messages.</p>
                    <p className="text-zinc-700 text-xs mt-1">Search for a friend to start chatting!</p>
                  </div>
                ) : (
                  recentChats.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => setActiveChat(profile)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/20">
                        {profile.full_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-white font-bold text-sm truncate">{profile.full_name}</p>
                          <span className="text-[10px] text-zinc-600">@{profile.username}</span>
                        </div>
                        <p className="text-zinc-500 text-xs truncate">Tap to open chat</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-600" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer (Input) */}
      {activeChat && (
        <div className="p-3 bg-zinc-900 border-t border-white/10 shrink-0 safe-area-pb">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-colors"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-neon-blue text-black rounded-xl hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-neon-blue/20"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
