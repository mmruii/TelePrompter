'use client'
import { useState } from 'react'
import Comunicacion from '@/components/Comunicacion'
import ComunicacionEnter from '@/components/ComunicacionEnter'
import ScrollManual from '@/components/ScrollManual'
import AutoScroll from '@/components/AutoScroll'

const SECTIONS = [
  { id: 'comunicacion', label: 'Comunicación', desc: 'Tiempo real caracter a caracter' },
  { id: 'comunicacion-enter', label: 'Comunicación Enter', desc: 'Campo de texto + Enter' },
  { id: 'scroll', label: 'Scroll Manual', desc: 'Navegación libre por archivo' },
  { id: 'auto-scroll', label: 'Auto-Scroll', desc: 'Avance automático temporizado' },
]

export default function Home() {
  const [activeSection, setActiveSection] = useState('comunicacion')

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-white mb-1">📺 Teleprompter Web</h1>
        <p className="text-gray-400 text-sm">Podcast en vivo — Hosteable en Vercel</p>
      </header>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 px-6 py-4 border-b border-gray-800">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {s.label}
            <span className="block text-xs opacity-60">{s.desc}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="p-6">
        {activeSection === 'comunicacion' && <Comunicacion />}
        {activeSection === 'comunicacion-enter' && <ComunicacionEnter />}
        {activeSection === 'scroll' && <ScrollManual />}
        {activeSection === 'auto-scroll' && <AutoScroll />}
      </div>
    </main>
  )
}
