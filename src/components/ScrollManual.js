'use client'
import { useState, useCallback } from 'react'
import TeleprompterScreen from './TeleprompterScreen'
import PostItLayer from './PostItLayer'

export default function ScrollManual() {
  const [lines, setLines] = useState([])
  const [fileName, setFileName] = useState('')

  const loadFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setLines(ev.target.result.split('\n'))
    reader.readAsText(file, 'utf-8')
  }

  const clearFile = useCallback(() => { setLines([]); setFileName('') }, [])

  return (
    <div>
      <div className="flex flex-col gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">📖 Scroll Manual</h2>
          <p className="text-gray-400 text-sm mt-1">Navegá libremente por el archivo</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <label className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-500 text-sm">📂 Cargar archivo<input type="file" accept=".txt" onChange={loadFile} className="hidden" /></label>
          {fileName && (<><span className="text-gray-400 text-sm truncate max-w-[200px]">{fileName}</span><button onClick={clearFile} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500">🗑️</button></>)}
        </div>
      </div>
      <PostItLayer />
      <TeleprompterScreen className="overflow-y-auto max-h-[60vh]">
        {lines.length > 0 ? lines.map((line, i) => (<div key={i} className="line-confirmed mb-4">{line}</div>)) : (<div className="text-gray-600 text-center mt-20">Cargá un archivo .txt para empezar...</div>)}
      </TeleprompterScreen>
    </div>
  )
}
