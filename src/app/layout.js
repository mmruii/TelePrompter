import './globals.css'

export const metadata = {
  title: 'Teleprompter Web - Podcast',
  description: 'Teleprompter web para streamers de podcast con post-its de imágenes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
