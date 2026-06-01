'use client'
import { useRef, useState } from 'react'

export default function TeleprompterScreen({ children, className = '' }) {
  const screenRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      screenRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-50 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded opacity-60 hover:opacity-100 transition"
      >
        {isFullscreen ? '⊟ Salir' : '⊞ Fullscreen'}
      </button>
      <div
        ref={screenRef}
        className={`teleprompter-display ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
