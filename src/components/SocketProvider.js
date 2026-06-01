'use client'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState(null)
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const s = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    s.on('user-joined', ({ users }) => setUsers(users))
    s.on('user-left', ({ users }) => setUsers(users))

    socketRef.current = s
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  const joinRoom = ({ roomId, password, username }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject('No connection')

      socketRef.current.emit('join-room', { roomId, password, username })

      const onState = (state) => {
        setRoom(roomId)
        setUsers(state.users)
        socketRef.current.off('join-error', onError)
        resolve(state)
      }

      const onError = (error) => {
        socketRef.current.off('room-state', onState)
        reject(error)
      }

      socketRef.current.once('room-state', onState)
      socketRef.current.once('join-error', onError)
    })
  }

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current.connect()
    }
    setRoom(null)
    setUsers([])
  }

  return (
    <SocketContext.Provider value={{ socket, room, users, connected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
