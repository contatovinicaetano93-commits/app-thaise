import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Estlar · Hub de Arquitetura',
  description:
    'Onde a performance e o design se complementam. Plataforma de inteligência criativa e construtiva para transformar projetos em ativos.',
  openGraph: {
    title: 'Estlar · Hub de Arquitetura',
    description: 'Onde a performance e o design se complementam.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${cormorant.variable} h-full`}>
      <body className="h-full bg-gray-50 antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
