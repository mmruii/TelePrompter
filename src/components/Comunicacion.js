'use client'
import { useState, useEffect, useRef } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'

export default function Comunicacion() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  // Capturar teclas en tiempo real
  useEffect(() => {
    const handler = (e) => {
      // Solo capturar si no hay otro input enfocado
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

      if (e.key === 'Enter') {
        if (draft.trim()) {
          setMessages(prev => [...prev, draft])
        }
        setDraft('')
        e.preventDefault()
      } else if (e.key === 'Backspace') {
        setDraft(prev => prev.slice(0, -1))
        e.preventDefault()
      } else if (e.key === 'Delete') {
        setMessages([])
        setDraft('')
        e.preventDefault()
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setDraft(prev => prev + e.key)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [draft])

  const clearAll = () => {
    setMessages([])
    setDraft('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">🎙️ Comunicación en Tiempo Real</h2>
          <p className="text-gray-400 text-sm mt-1">
            Escribí directamente (sin hacer click en nada). Cada tecla aparece en pantalla.
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
            Empezá a escribir...<br/>
            <span className="text-sm">Enter = confirmar | Delete = limpiar | Backspace = borrar</span>
          </div>
        )}
      </TeleprompterScreen>

      <div className="mt-3 text-gray-500 text-xs">
        Controles: <kbd className="bg-gray-800 px-1 rounded">Enter</kbd> confirmar |
        <kbd className="bg-gray-800 px-1 rounded">Backspace</kbd> borrar |
        <kbd className="bg-gray-800 px-1 rounded">Delete</kbd> limpiar todo
      </div>
    </div>
  )
}
