'use client'
import { useState, useEffect } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useSocket } from './SocketProvider'

export default function Comunicacion() {
  const { socket, room } = useSocket()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    const onState = (state) => {
      if (state.comunicacion) {
        setMessages(state.comunicacion.messages || [])
        setDraft(state.comunicacion.draft || '')
      }
    }
    const onUpdate = (data) => {
      setMessages(data.messages || [])
      setDraft(data.draft || '')
    }
    socket.on('room-state', onState)
    socket.on('com-update', onUpdate)
    return () => {
      socket.off('room-state', onState)
      socket.off('com-update', onUpdate)
    }
  }, [socket])

  // Capturar teclas en tiempo real
  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

      if (e.key === 'Enter') {
        if (draft.trim()) {
          const newMessages = [...messages, draft]
          setMessages(newMessages)
          setDraft('')
          if (socket && room) socket.emit('com-confirm', { messages: newMessages, draft: '' })
        } else {
          setDraft('')
          if (socket && room) socket.emit('com-keystroke', { messages, draft: '' })
        }
        e.preventDefault()
      } else if (e.key === 'Backspace') {
        const newDraft = draft.slice(0, -1)
        setDraft(newDraft)
        if (socket && room) socket.emit('com-keystroke', { messages, draft: newDraft })
        e.preventDefault()
      } else if (e.key === 'Delete') {
        setMessages([])
        setDraft('')
        if (socket && room) socket.emit('com-clear')
        e.preventDefault()
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const newDraft = draft + e.key
        setDraft(newDraft)
        if (socket && room) socket.emit('com-keystroke', { messages, draft: newDraft })
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [draft, messages, socket, room])

  const clearAll = () => {
    setMessages([])
    setDraft('')
    if (socket && room) socket.emit('com-clear')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-purple-600/20 p-1.5 rounded-lg">🎙️</span>
            Comunicación en Tiempo Real
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Escribí directamente. Cada tecla se sincroniza con todos.
          </p>
        </div>
        <button onClick={clearAll} className="px-4 py-2 bg-red-600/90 text-white text-xs sm:text-sm rounded-lg hover:bg-red-500 transition-all shadow-md self-start sm:self-auto">
          🗑️ Limpiar
        </button>
      </div>

      <PostItLayer />

      <TeleprompterScreen>
        {messages.map((msg, i) => (
          <div key={i} className="line-confirmed mb-4">{msg}</div>
        ))}
        {draft && (
          <div className="line-draft mb-4">{draft}<span className="animate-pulse">▊</span></div>
        )}
        {messages.length === 0 && !draft && (
          <div className="text-gray-600 text-center mt-20">
            Empezá a escribir...<br/>
            <span className="text-sm">Enter = confirmar | Delete = limpiar | Backspace = borrar</span>
          </div>
        )}
      </TeleprompterScreen>

      <div className="mt-3 text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1">
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Enter</kbd> confirmar</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Backspace</kbd> borrar</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Delete</kbd> limpiar todo</span>
      </div>
    </div>
  )
}
