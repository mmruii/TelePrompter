'use client'
import { useState, useRef, useEffect } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useAbly } from './AblyProvider'

export default function ComunicacionEnter() {
  const { room, publish, subscribe, unsubscribe, username } = useAbly()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isBold, setIsBold] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!room) return
    const handleMsg = (data) => {
      if (data.type === 'new-message') {
        setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message])
      } else if (data.type === 'update-message') {
        setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m))
      } else if (data.type === 'clear') {
        setMessages([])
      }
    }
    subscribe('messages', handleMsg)
    return () => unsubscribe('messages')
  }, [room, subscribe, unsubscribe])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (draft.trim()) {
      const msg = { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, text: draft.trim(), bold: isBold, highlight: isHighlight, author: username || 'local' }
      setMessages(prev => [...prev, msg])
      if (room) publish('messages', { type: 'new-message', message: msg })
    }
    setDraft('')
    setIsBold(false)
    setIsHighlight(false)
    inputRef.current?.focus()
  }

  const clearAll = () => {
    if (room) publish('messages', { type: 'clear' })
    setMessages([])
    setDraft('')
    inputRef.current?.focus()
  }

  const toggleBold = (msgId) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, bold: !m.bold } : m)
      const msg = updated.find(m => m.id === msgId)
      if (room && msg) publish('messages', { type: 'update-message', message: msg })
      return updated
    })
  }

  const toggleHighlight = (msgId) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, highlight: !m.highlight } : m)
      const msg = updated.find(m => m.id === msgId)
      if (room && msg) publish('messages', { type: 'update-message', message: msg })
      return updated
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && e.shiftKey) { clearAll(); e.preventDefault() }
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setIsBold(p => !p) }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600/20 p-1.5 rounded-lg">🖊️</span> Comunicación con Enter
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            {room ? '🟢 Sincronizado en tiempo real' : '⚫ Modo offline'}
          </p>
        </div>
        <button onClick={clearAll} className="px-4 py-2 bg-red-600/90 text-white text-xs sm:text-sm rounded-lg hover:bg-red-500 transition-all shadow-md self-start sm:self-auto">🗑️ Limpiar todo</button>
      </div>

      <PostItLayer />

      <TeleprompterScreen>
        {messages.map((msg) => (
          <div key={msg.id}
            className={`line-confirmed mb-4 cursor-pointer select-none transition-all hover:opacity-80 ${msg.bold ? 'font-bold' : ''} ${msg.highlight ? 'bg-yellow-500/30 px-2 rounded' : ''}`}
            onClick={() => toggleBold(msg.id)}
            onContextMenu={(e) => { e.preventDefault(); toggleHighlight(msg.id) }}
            title="Click: negrita | Click derecho: resaltar"
          >
            {msg.author && <span className="text-xs text-blue-400 mr-2 opacity-60">[{msg.author}]</span>}
            {msg.text}
          </div>
        ))}
        {messages.length === 0 && <div className="text-gray-600 text-center mt-20">Escribí abajo y presioná Enter...</div>}
      </TeleprompterScreen>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-1.5">
          <button type="button" onClick={() => setIsBold(p => !p)} className={`px-3 py-2 rounded-lg font-bold text-sm border transition-all ${isBold ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`} title="Negrita (Ctrl+B)">B</button>
          <button type="button" onClick={() => setIsHighlight(p => !p)} className={`px-3 py-2 rounded-lg text-sm border transition-all ${isHighlight ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`} title="Resaltar">🖍️</button>
          <input ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribí el mensaje aquí..." className={`flex-1 bg-gray-900 border border-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-mono text-base sm:text-lg focus:outline-none focus:border-blue-500 transition-all ${isBold ? 'font-bold' : ''} ${isHighlight ? 'bg-yellow-900/30' : ''}`} autoFocus />
        </div>
        <button type="submit" className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all shadow-md text-sm sm:text-base">Enviar ↵</button>
      </form>

      <div className="mt-3 text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1">
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Enter</kbd> confirmar</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Ctrl+B</kbd> negrita</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Click</kbd> toggle negrita</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Click der.</kbd> resaltar</span>
      </div>
    </div>
  )
}
