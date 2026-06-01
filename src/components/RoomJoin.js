'use client'
import { useState } from 'react'
import { useSocket } from './SocketProvider'

export default function RoomJoin() {
  const { room, users, connected, joinRoom, leaveRoom } = useSocket()
  const [roomId, setRoomId] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!roomId.trim() || !username.trim()) {
      setError('Completá sala y nombre')
      return
    }
    setLoading(true)
    setError('')
    try {
      await joinRoom({ roomId: roomId.trim(), password: password.trim(), username: username.trim() })
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  if (room) {
    return (
      <div className="flex items-center gap-3 flex-wrap px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-300">
            Sala: <strong className="text-white">{room}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {users.map((u, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-600/30 text-blue-300 text-xs rounded-full border border-blue-500/30">
              {u}
            </span>
          ))}
        </div>
        <button
          onClick={leaveRoom}
          className="ml-auto px-3 py-1 bg-red-600/80 text-white text-xs rounded hover:bg-red-500 transition-all"
        >
          Salir
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleJoin} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-6">
      <h3 className="text-white font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        Unirse a una sala
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tu nombre"
          className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="ID de sala"
          className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (opcional)"
          className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button
        type="submit"
        disabled={loading || !connected}
        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all disabled:opacity-50 text-sm"
      >
        {loading ? 'Conectando...' : '🔗 Unirse / Crear sala'}
      </button>
      <p className="text-gray-500 text-xs mt-2">
        Si la sala no existe, se crea automáticamente. La contraseña es opcional.
      </p>
    </form>
  )
}
