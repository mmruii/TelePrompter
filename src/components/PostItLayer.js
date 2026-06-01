'use client'
import { useState, useRef, useEffect } from 'react'
import { useAbly } from './AblyProvider'

export default function PostItLayer() {
  const { room, publish, subscribe, unsubscribe } = useAbly()
  const [postIts, setPostIts] = useState([])
  const [dragging, setDragging] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showTextInput, setShowTextInput] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const containerRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!room) return
    const handlePostIt = (data) => {
      if (data.type === 'add') { setPostIts(prev => prev.some(p => p.id === data.postIt.id) ? prev : [...prev, data.postIt]) }
      else if (data.type === 'remove') { setPostIts(prev => prev.filter(p => p.id !== data.id)) }
      else if (data.type === 'move') { setPostIts(prev => prev.map(p => p.id === data.id ? { ...p, x: data.x, y: data.y } : p)) }
    }
    subscribe('postits', handlePostIt)
    return () => unsubscribe('postits')
  }, [room, subscribe, unsubscribe])

  const addImagePostIt = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (ev) => {
      const file = ev.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (re) => {
        const postIt = { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, type: 'image', src: re.target.result, x: 50 + Math.random() * 200, y: 50 + Math.random() * 100, label: file.name.split('.')[0] }
        setPostIts(prev => [...prev, postIt])
        if (room) publish('postits', { type: 'add', postIt })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const openTextInput = () => { setShowTextInput(true); setTextDraft(''); setTimeout(() => textareaRef.current?.focus(), 50) }

  const confirmTextPostIt = () => {
    if (!textDraft.trim()) { setShowTextInput(false); return }
    const postIt = { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, type: 'text', text: textDraft.trim(), x: 50 + Math.random() * 200, y: 50 + Math.random() * 100 }
    setPostIts(prev => [...prev, postIt])
    if (room) publish('postits', { type: 'add', postIt })
    setTextDraft(''); setShowTextInput(false)
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); confirmTextPostIt() }
    if (e.key === 'Escape') { setShowTextInput(false); setTextDraft('') }
  }

  const removePostIt = (id) => { setPostIts(prev => prev.filter(p => p.id !== id)); if (room) publish('postits', { type: 'remove', id }) }

  const onMouseDown = (e, id) => { const p = postIts.find(x => x.id === id); if (!p) return; setDragging(id); setOffset({ x: e.clientX - p.x, y: e.clientY - p.y }) }
  const onMouseMove = (e) => { if (dragging === null) return; setPostIts(prev => prev.map(p => p.id === dragging ? { ...p, x: e.clientX - offset.x, y: e.clientY - offset.y } : p)) }
  const onMouseUp = () => { if (dragging !== null && room) { const p = postIts.find(x => x.id === dragging); if (p) publish('postits', { type: 'move', id: p.id, x: p.x, y: p.y }) } setDragging(null) }
  const onTouchStart = (e, id) => { const t = e.touches[0]; const p = postIts.find(x => x.id === id); if (!p) return; setDragging(id); setOffset({ x: t.clientX - p.x, y: t.clientY - p.y }) }
  const onTouchMove = (e) => { if (dragging === null) return; const t = e.touches[0]; setPostIts(prev => prev.map(p => p.id === dragging ? { ...p, x: t.clientX - offset.x, y: t.clientY - offset.y } : p)) }

  return (
    <div ref={containerRef} className="relative w-full" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <button onClick={addImagePostIt} className="px-3 py-1.5 bg-yellow-500/90 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-sm" title="Agregar imagen">📌 Imagen</button>
        <button onClick={openTextInput} className="px-3 py-1.5 bg-green-500/90 text-black text-sm font-bold rounded-lg hover:bg-green-400 transition-all shadow-sm" title="Agregar texto">📝 Texto</button>
        {showTextInput && (
          <div className="flex gap-1.5 items-end flex-1 min-w-[250px]">
            <textarea ref={textareaRef} value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onKeyDown={handleTextKeyDown} placeholder="Escribí el post-it... (Ctrl+Enter para confirmar)" rows={2} className="flex-1 bg-gray-900 border border-gray-600 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-green-500 resize-none" />
            <button onClick={confirmTextPostIt} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500">✓</button>
            <button onClick={() => { setShowTextInput(false); setTextDraft('') }} className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600">✕</button>
          </div>
        )}
      </div>
      {postIts.map(p => (
        <div key={p.id} className="post-it" style={{ left: p.x, top: p.y }} onMouseDown={(e) => onMouseDown(e, p.id)} onTouchStart={(e) => onTouchStart(e, p.id)}>
          <span className="close-btn" onClick={() => removePostIt(p.id)}>×</span>
          {p.type === 'image' ? (<><img src={p.src} alt={p.label} draggable={false} /><div className="text-xs text-gray-600 mt-1 text-center truncate max-w-[200px]">{p.label}</div></>) : (<div className="p-2 text-sm text-gray-800 font-medium whitespace-pre-wrap max-w-[200px]">{p.text}</div>)}
        </div>
      ))}
    </div>
  )
}
