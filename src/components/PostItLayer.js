'use client'
import { useState, useRef } from 'react'

export default function PostItLayer() {
  const [postIts, setPostIts] = useState([])
  const [dragging, setDragging] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const addPostIt = (e) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (ev) => {
      const file = ev.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (re) => {
        setPostIts(prev => [...prev, {
          id: Date.now(),
          src: re.target.result,
          x: 50 + Math.random() * 200,
          y: 50 + Math.random() * 100,
          label: file.name.split('.')[0],
        }])
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const removePostIt = (id) => {
    setPostIts(prev => prev.filter(p => p.id !== id))
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
    setDragging(null)
  }

  // Touch support
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
      {/* Add Post-it button */}
      <button
        onClick={addPostIt}
        className="mb-3 px-3 py-1.5 bg-yellow-500 text-black text-sm font-bold rounded hover:bg-yellow-400 transition"
        title="Agregar imagen como post-it"
      >
        📌 Agregar Post-it (imagen)
      </button>

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
          <img src={p.src} alt={p.label} draggable={false} />
          <div className="text-xs text-gray-600 mt-1 text-center truncate max-w-[200px]">
            {p.label}
          </div>
        </div>
      ))}
    </div>
  )
}
