'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const done = localStorage.getItem('onboarding_done')
    router.replace(done ? '/dashboard' : '/onboarding')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}
