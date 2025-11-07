import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Investing Assistant',
  description: 'Personalized investing guidance for all experience levels',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
