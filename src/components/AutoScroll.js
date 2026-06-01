'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useSocket } from './SocketProvider'

export default function AutoScroll() {
  const { socket, room } = useSocket()
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [fileName, setFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [interval, setInterval_] = useState(3000)
  const linesPerScreen = 8
  const timerRef = useRef(null)

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    const onState = (state) => {
      if (state.autoScrollData) {
        setLines(state.autoScrollData.lines || [])
        setCurrentLine(state.autoScrollData.currentLine || 0)
        setFileName(state.autoScrollData.fileName || '')
        setIsPlaying(state.autoScrollData.isPlaying || false)
        setInterval_(state.autoScrollData.interval || 3000)
      }
    }
    const onAutoState = (data) => {
      setLines(data.lines || [])
      setCurrentLine(data.currentLine || 0)
      setFileName(data.fileName || '')
      setIsPlaying(data.isPlaying || false)
      setInterval_(data.interval || 3000)
    }
    const onPlaying = (val) => setIsPlaying(val)
    const onLine = (val) => setCurrentLine(val)
    const onInterval = (val) => setInterval_(val)

    socket.on('room-state', onState)
    socket.on('autoscroll-state', onAutoState)
    socket.on('autoscroll-playing', onPlaying)
    socket.on('autoscroll-line', onLine)
    socket.on('autoscroll-interval', onInterval)
    return () => {
      socket.off('room-state', onState)
      socket.off('autoscroll-state', onAutoState)
      socket.off('autoscroll-playing', onPlaying)
      socket.off('autoscroll-line', onLine)
      socket.off('autoscroll-interval', onInterval)
    }
  }, [socket])

  const loadFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = ev.target.result.split('\n')
      setLines(parsed)
      setCurrentLine(0)
      setIsPlaying(false)
      if (socket && room) socket.emit('autoscroll-load', { lines: parsed, fileName: file.name })
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
            if (socket && room) socket.emit('autoscroll-play', false)
            return prev
          }
          const next = prev + 1
          if (socket && room) socket.emit('autoscroll-move', next)
          return next
        })
      }, interval)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, interval, lines.length, socket, room])

  const togglePlay = useCallback(() => {
    const next = !isPlaying
    setIsPlaying(next)
    if (socket && room) socket.emit('autoscroll-play', next)
  }, [isPlaying, socket, room])

  const speedUp = useCallback(() => {
    const next = Math.max(500, interval - 500)
    setInterval_(next)
    if (socket && room) socket.emit('autoscroll-speed', next)
  }, [interval, socket, room])

  const speedDown = useCallback(() => {
    const next = Math.min(10000, interval + 500)
    setInterval_(next)
    if (socket && room) socket.emit('autoscroll-speed', next)
  }, [interval, socket, room])

  const moveTo = useCallback((line) => {
    const clamped = Math.max(0, Math.min(Math.max(0, lines.length - linesPerScreen), line))
    setCurrentLine(clamped)
    if (socket && room) socket.emit('autoscroll-move', clamped)
  }, [lines.length, socket, room])

  const scrollUp = useCallback(() => moveTo(currentLine - 1), [currentLine, moveTo])
  const scrollDown = useCallback(() => moveTo(currentLine + 1), [currentLine, moveTo])

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === ' ') { togglePlay(); e.preventDefault() }
      if (e.key === '+' || e.key === '=') { speedUp(); e.preventDefault() }
      if (e.key === '-') { speedDown(); e.preventDefault() }
      if (e.key === 'ArrowUp') { scrollUp(); e.preventDefault() }
      if (e.key === 'ArrowDown') { scrollDown(); e.preventDefault() }
      if (e.key === 'Home') { moveTo(0); e.preventDefault() }
      if (e.key === 'End') { moveTo(lines.length); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, speedUp, speedDown, scrollUp, scrollDown, moveTo, lines.length])

  const visibleLines = lines.slice(currentLine, currentLine + linesPerScreen)
  const progress = lines.length > 0 ? `${currentLine + 1} / ${lines.length}` : '—'
  const intervalSec = (interval / 1000).toFixed(1)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-orange-600/20 p-1.5 rounded-lg">⏱️</span>
            Auto-Scroll
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Avance automático temporizado. Sincronizado con la sala.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs sm:text-sm font-mono bg-gray-800/50 px-2 py-1 rounded">{progress}</span>
          <label className="px-4 py-2 bg-green-600/90 text-white text-xs sm:text-sm rounded-lg hover:bg-green-500 cursor-pointer transition-all shadow-md">
            📂 Cargar archivo
            <input type="file" accept=".txt,.md" onChange={loadFile} className="hidden" />
          </label>
        </div>
      </div>

      <PostItLayer />

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 p-3 bg-gray-900/80 rounded-xl border border-gray-800/60 backdrop-blur-sm">
        <button
          onClick={togglePlay}
          className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-md ${
            isPlaying ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-green-600 text-white hover:bg-green-500'
          }`}
        >
          {isPlaying ? '⏸ Pausa' : '▶ Play'}
        </button>

        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-2 py-1">
          <button onClick={speedUp} className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600 transition">+</button>
          <span className="text-gray-300 text-xs sm:text-sm font-mono w-12 text-center">{intervalSec}s</span>
          <button onClick={speedDown} className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600 transition">−</button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={scrollUp} className="px-2 py-1 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">↑</button>
          <button onClick={scrollDown} className="px-2 py-1 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">↓</button>
          <button onClick={() => moveTo(0)} className="px-2 py-1 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⏮</button>
          <button onClick={() => moveTo(lines.length)} className="px-2 py-1 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⏭</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isPlaying && <span className="text-green-400 text-xs animate-pulse">● LIVE</span>}
          {!isPlaying && lines.length > 0 && <span className="text-yellow-400 text-xs">● PAUSADO</span>}
          {fileName && <span className="text-gray-500 text-xs hidden sm:inline">📄 {fileName}</span>}
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
            <span className="text-sm">Luego presioná Espacio para iniciar</span>
          </div>
        )}
      </TeleprompterScreen>

      <div className="mt-3 text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1">
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Espacio</kbd> play/pausa</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">+/-</kbd> velocidad</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">↑/↓</kbd> manual</span>
        <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Home/End</kbd> inicio/final</span>
      </div>
    </div>
  )
}
