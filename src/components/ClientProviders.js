'use client'
import { AblyProvider } from './AblyProvider'

export default function ClientProviders({ children }) {
  return (
    <AblyProvider>
      {children}
    </AblyProvider>
  )
}
