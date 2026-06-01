'use client'
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import Ably from 'ably'

const AblyContext = createContext(null)

export function AblyProvider({ children }) {
  const [room, setRoom] = useState(null)
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [username, setUsername] = useState('')
  const ablyRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_ABLY_API_KEY not set - offline mode')
      return
    }
    const ably = new Ably.Realtime({
      key: apiKey,
      clientId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })
    ably.connection.on('connected', () => setConnected(true))
    ably.connection.on('disconnected', () => setConnected(false))
    ably.connection.on('failed', () => setConnected(false))
    ablyRef.current = ably
    return () => ably.close()
  }, [])

  const joinRoom = useCallback(({ roomId, password, username: user }) => {
    return new Promise((resolve, reject) => {
      if (!ablyRef.current) { reject('No connection'); return }
      const channelName = password
        ? `teleprompter:${roomId}:${btoa(password).slice(0, 8)}`
        : `teleprompter:${roomId}`
      const ch = ablyRef.current.channels.get(channelName)
      ch.presence.enter({ username: user }, (err) => {
        if (err) { reject(err.message); return }
        ch.presence.get((err, members) => {
          if (!err && members) setUsers(members.map(m => m.data?.username || 'Anon'))
        })
        ch.presence.subscribe('enter', (m) => {
          setUsers(prev => [...new Set([...prev, m.data?.username || 'Anon'])])
        })
        ch.presence.subscribe('leave', (m) => {
          setUsers(prev => prev.filter(u => u !== (m.data?.username || 'Anon')))
        })
        channelRef.current = ch
        setRoom(roomId)
        setUsername(user)
        resolve({ roomId })
      })
    })
  }, [])

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.presence.leave()
      channelRef.current.detach()
      channelRef.current = null
    }
    setRoom(null)
    setUsers([])
    setUsername('')
  }, [])

  const publish = useCallback((event, data) => {
    if (channelRef.current) {
      channelRef.current.publish(event, data)
    }
  }, [])

  const subscribe = useCallback((event, callback) => {
    if (channelRef.current) {
      channelRef.current.subscribe(event, (msg) => callback(msg.data))
    }
  }, [])

  const unsubscribe = useCallback((event) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe(event)
    }
  }, [])

  return (
    <AblyContext.Provider value={{ room, users, connected, username, joinRoom, leaveRoom, publish, subscribe, unsubscribe }}>
      {children}
    </AblyContext.Provider>
  )
}

export function useAbly() {
  return useContext(AblyContext)
}
