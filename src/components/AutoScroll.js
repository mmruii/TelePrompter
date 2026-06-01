'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'

export default function AutoScroll() {
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [fileName, setFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [interval, setInterval_] = useState(3000) // ms
  const linesPerScreen = 8
  const timerRef = useRef(null)

  const loadFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setLines(ev.target.result.split('\n'))
      setCurrentLine(0)
      setIsPlaying(false)
    }
    reader.readAsText(file, 'utf-8')
  }

  // Auto-scroll timer
  useEffect(() => {
    if (isPlaying && lines.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentLine(prev => {
          const maxLine = Math.max(0, lines.length - linesPerScreen)
          if (prev >= maxLine) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, interval)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, interval, lines.length])

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const speedUp = useCallback(() => {
    setInterval_(prev => Math.max(500, prev - 500))
  }, [])

  const speedDown = useCallback(() => {
    setInterval_(prev => Math.min(10000, prev + 500))
  }, [])

  const scrollUp = useCallback(() => {
    setCurrentLine(prev => Math.max(0, prev - 1))
  }, [])

  const scrollDown = useCallback(() => {
    setCurrentLine(prev => Math.min(Math.max(0, lines.length - linesPerScreen), prev + 1))
  }, [lines.length])

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === ' ') { togglePlay(); e.preventDefault() }
      if (e.key === '+' || e.key === '=') { speedUp(); e.preventDefault() }
      if (e.key === '-') { speedDown(); e.preventDefault() }
      if (e.key === 'ArrowUp') { scrollUp(); e.preventDefault() }
      if (e.key === 'ArrowDown') { scrollDown(); e.preventDefault() }
      if (e.key === 'Home') { setCurrentLine(0); e.preventDefault() }
      if (e.key === 'End') { setCurrentLine(Math.max(0, lines.length - linesPerScreen)); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, speedUp, speedDown, scrollUp, scrollDown, lines.length])

  const visibleLines = lines.slice(currentLine, currentLine + linesPerScreen)
  const progress = lines.length > 0 ? `${currentLine + 1} / ${lines.length}` : '—'
  const intervalSec = (interval / 1000).toFixed(1)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">⏱️ Auto-Scroll</h2>
          <p className="text-gray-400 text-sm mt-1">
            Avance automático temporizado. Espacio = play/pausa. +/- = velocidad.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-mono">{progress}</span>
          <label className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-500 cursor-pointer transition">
            📂 Cargar archivo
            <input type="file" accept=".txt,.md" onChange={loadFile} className="hidden" />
          </label>
        </div>
      </div>

      <PostItLayer />

      {/* Controls bar */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-900 rounded-lg border border-gray-800">
        <button
          onClick={togglePlay}
          className={`px-4 py-2 rounded font-bold text-sm transition ${
            isPlaying ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'
          }`}
        >
          {isPlaying ? '⏸ Pausa' : '▶ Play'}
        </button>

        <div className="flex items-center gap-2">
          <button onClick={speedUp} className="px-2 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">+</button>
          <span className="text-gray-300 text-sm font-mono w-16 text-center">{intervalSec}s</span>
          <button onClick={speedDown} className="px-2 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">−</button>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button onClick={scrollUp} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">↑</button>
          <button onClick={scrollDown} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">↓</button>
          <button onClick={() => setCurrentLine(0)} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⏮</button>
          <button onClick={() => setCurrentLine(Math.max(0, lines.length - linesPerScreen))} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⏭</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isPlaying && <span className="text-green-400 text-xs animate-pulse">● REPRODUCIENDO</span>}
          {!isPlaying && lines.length > 0 && <span className="text-yellow-400 text-xs">● PAUSADO</span>}
          {fileName && <span className="text-gray-500 text-xs">📄 {fileName}</span>}
        </div>
      </div>

      <TeleprompterScreen>
        {visibleLines.length > 0 ? (
          visibleLines.map((line, i) => (
            <div key={currentLine + i} className="line-confirmed mb-2">
              {line || '\u00A0'}
            </div>
          ))
        ) : (
          <div className="text-gray-600 text-center mt-20">
            Cargá un archivo .txt o .md para empezar<br/>
            <span className="text-sm">Luego presioná Espacio para iniciar el auto-scroll</span>
          </div>
        )}
      </TeleprompterScreen>

      <div className="mt-3 text-gray-500 text-xs">
        <kbd className="bg-gray-800 px-1 rounded">Espacio</kbd> play/pausa |
        <kbd className="bg-gray-800 px-1 rounded">+/-</kbd> velocidad |
        <kbd className="bg-gray-800 px-1 rounded">↑/↓</kbd> manual |
        <kbd className="bg-gray-800 px-1 rounded">Home/End</kbd> inicio/final
      </div>
    </div>
  )
}
