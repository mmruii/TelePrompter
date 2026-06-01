'use client'
import { useState, useRef } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'

export default function ComunicacionEnter() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (draft.trim()) {
      setMessages(prev => [...prev, draft.trim()])
    }
    setDraft('')
    inputRef.current?.focus()
  }

  const clearAll = () => {
    setMessages([])
    setDraft('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && e.shiftKey) {
      clearAll()
      e.preventDefault()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">🖊️ Comunicación con Enter</h2>
          <p className="text-gray-400 text-sm mt-1">
            Escribí en el campo, el borrador se ve en pantalla. Enter confirma.
          </p>
        </div>
        <button onClick={clearAll} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500">
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
            Escribí abajo y presioná Enter...
          </div>
        )}
      </TeleprompterScreen>

      {/* Input field */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí el mensaje aquí..."
          className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg font-mono text-lg focus:outline-none focus:border-blue-500"
          autoFocus
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition"
        >
          Enviar
        </button>
      </form>

      <div className="mt-3 text-gray-500 text-xs">
        <kbd className="bg-gray-800 px-1 rounded">Enter</kbd> confirmar |
        <kbd className="bg-gray-800 px-1 rounded">Shift+Delete</kbd> limpiar todo
      </div>
    </div>
  )
}
