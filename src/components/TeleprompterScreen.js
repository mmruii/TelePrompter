'use client'
import { useRef, useState, useEffect } from 'react'

export default function TeleprompterScreen({ children, className = '' }) {
  const screenRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      screenRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Salir con Escape también (por si el navegador no lo hace)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="relative">
      <div
        ref={screenRef}
        className={`teleprompter-display ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      >
        {/* Botón dentro del contenedor fullscreen para que siempre sea visible */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-[10000] px-3 py-1.5 bg-gray-800/80 backdrop-blur text-gray-200 text-xs sm:text-sm rounded-md hover:bg-gray-700 transition-all shadow-lg border border-gray-600/50"
        >
          {isFullscreen ? '✕ Salir (Esc)' : '⊞ Pantalla completa'}
        </button>
        <div className={isFullscreen ? 'pt-10' : ''}>
          {children}
        </div>
      </div>
    </div>
  )
}
