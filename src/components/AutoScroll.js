'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'
import { useAbly } from './AblyProvider'

export default function AutoScroll() {
  const { room, publish, subscribe, unsubscribe } = useAbly()
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [fileName, setFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3000)
  const linesPerScreen = 8
  const timerRef = useRef(null)

  useEffect(() => {
    if (!room) return
    const handle = (data) => {
      if (data.type === 'load') { setLines(data.lines || []); setCurrentLine(0); setFileName(data.fileName || ''); setIsPlaying(false) }
      else if (data.type === 'play') { setIsPlaying(data.val) }
      else if (data.type === 'move') { setCurrentLine(data.line) }
      else if (data.type === 'speed') { setSpeed(data.val) }
    }
    subscribe('autoscroll', handle)
    return () => unsubscribe('autoscroll')
  }, [room, subscribe, unsubscribe])

  const loadFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = ev.target.result.split('\n')
      setLines(parsed); setCurrentLine(0); setIsPlaying(false)
      if (room) publish('autoscroll', { type: 'load', lines: parsed, fileName: file.name })
    }
    reader.readAsText(file, 'utf-8')
  }

  useEffect(() => {
    if (isPlaying && lines.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentLine(prev => {
          const max = Math.max(0, lines.length - linesPerScreen)
          if (prev >= max) { setIsPlaying(false); if (room) publish('autoscroll', { type: 'play', val: false }); return prev }
          const next = prev + 1
          if (room) publish('autoscroll', { type: 'move', line: next })
          return next
        })
      }, speed)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, speed, lines.length, room, publish])

  const togglePlay = useCallback(() => { const next = !isPlaying; setIsPlaying(next); if (room) publish('autoscroll', { type: 'play', val: next }) }, [isPlaying, room, publish])
  const faster = useCallback(() => { const v = Math.max(500, speed - 500); setSpeed(v); if (room) publish('autoscroll', { type: 'speed', val: v }) }, [speed, room, publish])
  const slower = useCallback(() => { const v = Math.min(10000, speed + 500); setSpeed(v); if (room) publish('autoscroll', { type: 'speed', val: v }) }, [speed, room, publish])
  const goStart = useCallback(() => { setCurrentLine(0); setIsPlaying(false); if (room) { publish('autoscroll', { type: 'move', line: 0 }); publish('autoscroll', { type: 'play', val: false }) } }, [room, publish])

  const visible = lines.slice(currentLine, currentLine + linesPerScreen)

  return (
    <div>
      <div className="flex flex-col gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">⏱️ Auto-Scroll</h2>
          <p className="text-gray-400 text-sm mt-1">{room ? '🟢 Sincronizado' : '⚫ Modo offline'} — Cargá un archivo y avanzá automáticamente</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <label className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-500 text-sm">📂 Cargar archivo<input type="file" accept=".txt" onChange={loadFile} className="hidden" /></label>
          {fileName && <span className="text-gray-400 text-sm truncate max-w-[200px]">{fileName}</span>}
        </div>
        {lines.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={togglePlay} className={`px-4 py-2 font-bold rounded-lg text-sm ${isPlaying ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>{isPlaying ? '⏸ Pausar' : '▶️ Play'}</button>
            <button onClick={goStart} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm">⏮ Inicio</button>
            <button onClick={faster} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm">⚡ Rápido</button>
            <button onClick={slower} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 text-sm">🐢 Lento</button>
            <span className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">{(speed / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
      <PostItLayer />
      <TeleprompterScreen>
        {visible.length > 0 ? visible.map((line, i) => (<div key={currentLine + i} className="line-confirmed mb-4">{line}</div>)) : (<div className="text-gray-600 text-center mt-20">Cargá un archivo .txt para empezar...</div>)}
      </TeleprompterScreen>
    </div>
  )
}
