'use client'
import { useState, useEffect, useCallback } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'

export default function ScrollManual() {
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [fileName, setFileName] = useState('')
  const linesPerScreen = 8

  const loadFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      const parsed = content.split('\n')
      setLines(parsed)
      setCurrentLine(0)
    }
    reader.readAsText(file, 'utf-8')
  }

  const scrollUp = useCallback(() => {
    setCurrentLine(prev => Math.max(0, prev - 1))
  }, [])

  const scrollDown = useCallback(() => {
    setCurrentLine(prev => Math.min(Math.max(0, lines.length - linesPerScreen), prev + 1))
  }, [lines.length])

  const pageUp = useCallback(() => {
    setCurrentLine(prev => Math.max(0, prev - linesPerScreen))
  }, [])

  const pageDown = useCallback(() => {
    setCurrentLine(prev => Math.min(Math.max(0, lines.length - linesPerScreen), prev + linesPerScreen))
  }, [lines.length])

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowUp') { scrollUp(); e.preventDefault() }
      if (e.key === 'ArrowDown') { scrollDown(); e.preventDefault() }
      if (e.key === 'PageUp') { pageUp(); e.preventDefault() }
      if (e.key === 'PageDown') { pageDown(); e.preventDefault() }
      if (e.key === 'Home') { setCurrentLine(0); e.preventDefault() }
      if (e.key === 'End') { setCurrentLine(Math.max(0, lines.length - linesPerScreen)); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [scrollUp, scrollDown, pageUp, pageDown, lines.length])

  // Mouse wheel
  useEffect(() => {
    const handler = (e) => {
      if (e.deltaY > 0) scrollDown()
      else scrollUp()
    }
    window.addEventListener('wheel', handler, { passive: true })
    return () => window.removeEventListener('wheel', handler)
  }, [scrollUp, scrollDown])

  const visibleLines = lines.slice(currentLine, currentLine + linesPerScreen)
  const progress = lines.length > 0 ? `${currentLine + 1} / ${lines.length}` : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">📖 Scroll Manual</h2>
          <p className="text-gray-400 text-sm mt-1">
            Cargá un archivo y navegá con flechas o rueda del mouse.
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
        <div className="mt-3 flex items-center gap-4">
          <button onClick={() => setCurrentLine(0)} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⏮ Inicio</button>
          <button onClick={pageUp} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⬆ Pág</button>
          <button onClick={scrollUp} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">↑</button>
          <button onClick={scrollDown} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">↓</button>
          <button onClick={pageDown} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⬇ Pág</button>
          <button onClick={() => setCurrentLine(Math.max(0, lines.length - linesPerScreen))} className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700">⏭ Final</button>
          {fileName && <span className="text-gray-500 text-xs ml-auto">📄 {fileName}</span>}
        </div>
      )}
    </div>
  )
}
