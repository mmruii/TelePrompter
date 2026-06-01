'use client'
import { useState, useRef, useEffect } from 'react'
import { useSocket } from './SocketProvider'

export default function PostItLayer() {
  const { socket, room } = useSocket()
  const [postIts, setPostIts] = useState([])
  const [dragging, setDragging] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showTextInput, setShowTextInput] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const containerRef = useRef(null)
  const textareaRef = useRef(null)

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    const onRoomState = (state) => setPostIts(state.postIts || [])
    const onAdded = (p) => setPostIts(prev => [...prev, p])
    const onRemoved = (id) => setPostIts(prev => prev.filter(p => p.id !== id))
    const onMoved = ({ id, x, y }) => setPostIts(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))

    socket.on('room-state', onRoomState)
    socket.on('postit-added', onAdded)
    socket.on('postit-removed', onRemoved)
    socket.on('postit-moved', onMoved)
    return () => {
      socket.off('room-state', onRoomState)
      socket.off('postit-added', onAdded)
      socket.off('postit-removed', onRemoved)
      socket.off('postit-moved', onMoved)
    }
  }, [socket])

  const addImagePostIt = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (ev) => {
      const file = ev.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (re) => {
        const postIt = {
          id: Date.now(),
          type: 'image',
          src: re.target.result,
          x: 50 + Math.random() * 200,
          y: 50 + Math.random() * 100,
          label: file.name.split('.')[0],
        }
        if (socket && room) {
          socket.emit('add-postit', postIt)
        } else {
          setPostIts(prev => [...prev, postIt])
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const openTextInput = () => {
    setShowTextInput(true)
    setTextDraft('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const confirmTextPostIt = () => {
    if (!textDraft.trim()) {
      setShowTextInput(false)
      return
    }
    const postIt = {
      id: Date.now(),
      type: 'text',
      text: textDraft.trim(),
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 100,
    }
    if (socket && room) {
      socket.emit('add-postit', postIt)
    } else {
      setPostIts(prev => [...prev, postIt])
    }
    setTextDraft('')
    setShowTextInput(false)
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      confirmTextPostIt()
    }
    if (e.key === 'Escape') {
      setShowTextInput(false)
      setTextDraft('')
    }
  }

  const removePostIt = (id) => {
    if (socket && room) {
      socket.emit('remove-postit', id)
    } else {
      setPostIts(prev => prev.filter(p => p.id !== id))
    }
  }

  const onMouseDown = (e, id) => {
    const postIt = postIts.find(p => p.id === id)
    if (!postIt) return
    setDragging(id)
    setOffset({
      x: e.clientX - postIt.x,
      y: e.clientY - postIt.y,
    })
  }

  const onMouseMove = (e) => {
    if (dragging === null) return
    setPostIts(prev => prev.map(p =>
      p.id === dragging
        ? { ...p, x: e.clientX - offset.x, y: e.clientY - offset.y }
        : p
    ))
  }

  const onMouseUp = () => {
    if (dragging !== null && socket && room) {
      const p = postIts.find(pi => pi.id === dragging)
      if (p) socket.emit('move-postit', { id: p.id, x: p.x, y: p.y })
    }
    setDragging(null)
  }

  const onTouchStart = (e, id) => {
    const touch = e.touches[0]
    const postIt = postIts.find(p => p.id === id)
    if (!postIt) return
    setDragging(id)
    setOffset({
      x: touch.clientX - postIt.x,
      y: touch.clientY - postIt.y,
    })
  }

  const onTouchMove = (e) => {
    if (dragging === null) return
    const touch = e.touches[0]
    setPostIts(prev => prev.map(p =>
      p.id === dragging
        ? { ...p, x: touch.clientX - offset.x, y: touch.clientY - offset.y }
        : p
    ))
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      {/* Add Post-it buttons */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <button
          onClick={addImagePostIt}
          className="px-3 py-1.5 bg-yellow-500/90 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-sm hover:shadow-md"
          title="Agregar imagen como post-it"
        >
          📌 Imagen
        </button>
        <button
          onClick={openTextInput}
          className="px-3 py-1.5 bg-green-500/90 text-black text-sm font-bold rounded-lg hover:bg-green-400 transition-all shadow-sm hover:shadow-md"
          title="Agregar texto como post-it"
        >
          📝 Texto
        </button>

        {/* Inline text input */}
        {showTextInput && (
          <div className="flex gap-1.5 items-end flex-1 min-w-[250px]">
            <textarea
              ref={textareaRef}
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="Escribí el post-it... (Ctrl+Enter para confirmar)"
              rows={2}
              className="flex-1 bg-gray-900 border border-gray-600 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-green-500 resize-none"
            />
            <button
              onClick={confirmTextPostIt}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500 transition-all"
            >
              ✓
            </button>
            <button
              onClick={() => { setShowTextInput(false); setTextDraft('') }}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600 transition-all"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Post-its */}
      {postIts.map(p => (
        <div
          key={p.id}
          className="post-it"
          style={{ left: p.x, top: p.y }}
          onMouseDown={(e) => onMouseDown(e, p.id)}
          onTouchStart={(e) => onTouchStart(e, p.id)}
        >
          <span className="close-btn" onClick={() => removePostIt(p.id)}>×</span>
          {p.type === 'image' ? (
            <>
              <img src={p.src} alt={p.label} draggable={false} />
              <div className="text-xs text-gray-600 mt-1 text-center truncate max-w-[200px]">
                {p.label}
              </div>
            </>
          ) : (
            <div className="p-2 text-sm text-gray-800 font-medium whitespace-pre-wrap max-w-[200px]">
              {p.text}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
