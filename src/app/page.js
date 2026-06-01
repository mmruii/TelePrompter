'use client'
import { useState } from 'react'
import { useAbly } from '@/components/AblyProvider'
import RoomJoin from '@/components/RoomJoin'
import Comunicacion from '@/components/Comunicacion'
import ComunicacionEnter from '@/components/ComunicacionEnter'
import ScrollManual from '@/components/ScrollManual'
import AutoScroll from '@/components/AutoScroll'

const SECTIONS = [
  { id: 'comunicacion', label: '🎙️ Tiempo Real', icon: '🎙️', desc: 'Caracter a caracter' },
  { id: 'comunicacion-enter', label: '🖊️ Con Enter', icon: '🖊️', desc: 'Enviar con Enter' },
  { id: 'scroll', label: '📖 Scroll', icon: '📖', desc: 'Navegación manual' },
  { id: 'auto-scroll', label: '⏱️ Auto-Scroll', icon: '⏱️', desc: 'Avance automático' },
]

export default function Home() {
  const { room } = useAbly()
  const [activeSection, setActiveSection] = useState('comunicacion-enter')

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#0f1118]">
      {/* Header */}
      <header className="border-b border-gray-800/60 px-4 py-4 sm:px-6 sm:py-5 lg:px-10 backdrop-blur-sm bg-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              📺 Teleprompter <span className="text-blue-400">Live</span>
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Colaborativo en tiempo real — 6 personas simultáneas
            </p>
          </div>
        </div>
      </header>

      {/* Room — Always visible */}
      <div className="px-4 py-3 sm:px-6 lg:px-10 border-b border-gray-800/40">
        <RoomJoin />
      </div>

      {/* Navigation */}
      <nav className="px-4 py-3 sm:px-6 lg:px-10 border-b border-gray-800/40 bg-black/20">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
              }`}
            >
              <span className="sm:hidden">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="hidden lg:block text-[10px] opacity-60 mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-10">
        {activeSection === 'comunicacion' && <Comunicacion />}
        {activeSection === 'comunicacion-enter' && <ComunicacionEnter />}
        {activeSection === 'scroll' && <ScrollManual />}
        {activeSection === 'auto-scroll' && <AutoScroll />}
      </div>

      {/* Status bar */}
      {room && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-800/50 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>🟢 Sala: <strong className="text-gray-300">{room}</strong></span>
          <span className="text-[10px]">Sincronizado en tiempo real</span>
        </div>
      )}
    </main>
  )
}
