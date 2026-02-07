import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Search, User, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ChatSystem({ session }) {
  const [isOpen, setIsOpen] = useState(false)
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
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', `%${searchQuery}%`)
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
    if (activeChat) {
      fetchMessages(activeChat.id)

      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel)
      }
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
      // Optimistic update handled by subscription or we can do it manually if latency is high, 
      // but subscription is cleaner for consistency.
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  if (!session) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 p-4 rounded-full shadow-lg shadow-neon-blue/20 transition-all ${
          isOpen ? 'bg-zinc-800 text-zinc-400 rotate-90' : 'bg-neon-blue text-black hover:scale-110'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 w-96 h-[500px] bg-black/95 border border-zinc-800 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-scale-up">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between">
            {activeChat ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <ChevronLeft size={20} className="text-zinc-400" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    {activeChat.full_name?.[0] || activeChat.email[0]}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{activeChat.full_name || 'Student'}</h3>
                    <p className="text-neon-green text-[10px] font-mono leading-tight">Online</p>
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <MessageCircle className="text-neon-blue" size={20} /> Messages
              </h3>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-zinc-950/50">
            {activeChat ? (
              // Conversation View
              <div className="p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-zinc-600 text-xs py-10">
                    Start the conversation with {activeChat.full_name?.split(' ')[0]}
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isMe 
                          ? 'bg-neon-blue text-black rounded-tr-none' 
                          : 'bg-zinc-800 text-white rounded-tl-none border border-zinc-700'
                      }`}>
                        {msg.content}
                        <div className={`text-[8px] mt-1 text-right ${isMe ? 'text-black/50' : 'text-zinc-500'}`}>
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
              <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Search Results</p>
                    {searchResults.length === 0 ? (
                      <p className="text-zinc-600 text-sm italic">No users found.</p>
                    ) : (
                      searchResults.map(profile => (
                        <button
                          key={profile.id}
                          onClick={() => { setActiveChat(profile); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{profile.full_name || profile.email}</p>
                            <p className="text-zinc-500 text-xs">{profile.role || 'Student'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Recent Chats */}
                {searchQuery.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recent</p>
                    {recentChats.length === 0 ? (
                      <p className="text-zinc-600 text-sm italic">No recent conversations.</p>
                    ) : (
                      recentChats.map(profile => (
                        <button
                          key={profile.id}
                          onClick={() => setActiveChat(profile)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {profile.full_name?.[0] || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{profile.full_name || 'Unknown User'}</p>
                            <p className="text-zinc-500 text-xs">Tap to chat</p>
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
            <div className="p-3 bg-zinc-900 border-t border-white/10">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-2 bg-neon-blue text-black rounded-xl hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}
