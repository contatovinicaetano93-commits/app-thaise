import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Plataforma Thaise',
  description: 'Hub operacional — fornecedores, clientes e pedidos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
