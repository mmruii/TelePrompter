'use client'
import { SocketProvider } from './SocketProvider'

export default function ClientProviders({ children }) {
  return <SocketProvider>{children}</SocketProvider>
}
