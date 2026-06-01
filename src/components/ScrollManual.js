'use client'
import { useState, useEffect, useCallback } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useSocket } from './SocketProvider'

export default function ScrollManual() {
  const { socket, room } = useSocket()
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [fileName, setFileName] = useState('')
  const linesPerScreen = 8

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    const onState = (state) => {
      if (state.scrollData) {
        setLines(state.scrollData.lines || [])
        setCurrentLine(state.scrollData.currentLine || 0)
        setFileName(state.scrollData.fileName || '')
      }
    }
    const onScrollState = (data) => {
      setLines(data.lines || [])
      setCurrentLine(data.currentLine || 0)
      setFileName(data.fileName || '')
    }
    const onLine = (line) => setCurrentLine(line)

    socket.on('room-state', onState)
    socket.on('scroll-state', onScrollState)
    socket.on('scroll-line', onLine)
    return () => {
      socket.off('room-state', onState)
      socket.off('scroll-state', onScrollState)
      socket.off('scroll-line', onLine)
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
      if (socket && room) socket.emit('scroll-load', { lines: parsed, fileName: file.name })
    }
    reader.readAsText(file, 'utf-8')
  }

  const moveTo = useCallback((line) => {
    const clamped = Math.max(0, Math.min(Math.max(0, lines.length - linesPerScreen), line))
    setCurrentLine(clamped)
    if (socket && room) socket.emit('scroll-move', clamped)
  }, [lines.length, socket, room])

  const scrollUp = useCallback(() => moveTo(currentLine - 1), [currentLine, moveTo])
  const scrollDown = useCallback(() => moveTo(currentLine + 1), [currentLine, moveTo])
  const pageUp = useCallback(() => moveTo(currentLine - linesPerScreen), [currentLine, moveTo])
  const pageDown = useCallback(() => moveTo(currentLine + linesPerScreen), [currentLine, moveTo])

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowUp') { scrollUp(); e.preventDefault() }
      if (e.key === 'ArrowDown') { scrollDown(); e.preventDefault() }
      if (e.key === 'PageUp') { pageUp(); e.preventDefault() }
      if (e.key === 'PageDown') { pageDown(); e.preventDefault() }
      if (e.key === 'Home') { moveTo(0); e.preventDefault() }
      if (e.key === 'End') { moveTo(lines.length); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scrollUp, scrollDown, pageUp, pageDown, moveTo, lines.length])

  useEffect(() => {
    const handler = (e) => { e.deltaY > 0 ? scrollDown() : scrollUp() }
    window.addEventListener('wheel', handler, { passive: true })
    return () => window.removeEventListener('wheel', handler)
  }, [scrollUp, scrollDown])

  const visibleLines = lines.slice(currentLine, currentLine + linesPerScreen)
  const progress = lines.length > 0 ? `${currentLine + 1} / ${lines.length}` : '—'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-green-600/20 p-1.5 rounded-lg">📖</span>
            Scroll Manual
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Cargá un archivo y navegá. Se sincroniza con la sala.
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
            <span className="text-sm">Luego usá ↑/↓, PgUp/PgDn, Home/End para navegar</span>
          </div>
        )}
      </TeleprompterScreen>

      {lines.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => moveTo(0)} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⏮ Inicio</button>
          <button onClick={pageUp} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⬆ Pág</button>
          <button onClick={scrollUp} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">↑</button>
          <button onClick={scrollDown} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">↓</button>
          <button onClick={pageDown} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⬇ Pág</button>
          <button onClick={() => moveTo(lines.length)} className="px-2.5 py-1.5 bg-gray-800/80 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition">⏭ Final</button>
          {fileName && <span className="text-gray-500 text-xs ml-auto">📄 {fileName}</span>}
        </div>
      )}
    </div>
  )
}
