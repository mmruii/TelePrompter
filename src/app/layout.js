import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata = {
  title: 'Teleprompter Web - Podcast',
  description: 'Teleprompter web colaborativo para streamers de podcast',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
