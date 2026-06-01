'use client'
import { useState, useEffect } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useAbly } from './AblyProvider'

export default function Comunicacion() {
  const { room, publish, subscribe, unsubscribe, username } = useAbly()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!room) return
    const handleMsg = (data) => {
      if (data.type === 'new-message') {
        setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message])
      } else if (data.type === 'clear') { setMessages([]) }
    }
    subscribe('realtime', handleMsg)
    return () => unsubscribe('realtime')
  }, [room, subscribe, unsubscribe])

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === 'Enter') {
        if (draft.trim()) {
          const msg = { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, text: draft, author: username || 'local' }
          setMessages(prev => [...prev, msg])
          if (room) publish('realtime', { type: 'new-message', message: msg })
        }
        setDraft(''); e.preventDefault()
      } else if (e.key === 'Backspace') { setDraft(prev => prev.slice(0, -1)); e.preventDefault()
      } else if (e.key === 'Delete') { setMessages([]); setDraft(''); if (room) publish('realtime', { type: 'clear' }); e.preventDefault()
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { setDraft(prev => prev + e.key); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [draft, room, publish, username])

  const clearAll = () => { setMessages([]); setDraft(''); if (room) publish('realtime', { type: 'clear' }) }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2"><span className="bg-purple-600/20 p-1.5 rounded-lg">🎙️</span> Comunicación en Tiempo Real</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">{room ? '🟢 Sincronizado' : '⚫ Modo offline'} — Escribí directamente</p>
        </div>
        <button onClick={clearAll} className="px-4 py-2 bg-red-600/90 text-white text-xs sm:text-sm rounded-lg hover:bg-red-500 transition-all shadow-md self-start sm:self-auto">🗑️ Limpiar</button>
      </div>
      <PostItLayer />
      <TeleprompterScreen>
        {messages.map((msg) => (<div key={msg.id} className="line-confirmed mb-4">{msg.author && <span className="text-xs text-blue-400 mr-2 opacity-60">[{msg.author}]</span>}{msg.text}</div>))}
        {draft && <div className="line-draft mb-4">{draft}<span className="animate-pulse">▊</span></div>}
        {messages.length === 0 && !draft && (<div className="text-gray-600 text-center mt-20">Empezá a escribir...<br/><span className="text-sm">Enter = confirmar | Delete = limpiar | Backspace = borrar</span></div>)}
      </TeleprompterScreen>
      <div className="mt-3 text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1">
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Enter</kbd> confirmar</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Backspace</kbd> borrar</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Delete</kbd> limpiar todo</span>
      </div>
    </div>
  )
}
