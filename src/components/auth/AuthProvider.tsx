'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Profile, UserRole } from '@/lib/auth/roles'
import { canManage } from '@/lib/auth/roles'

export type LinkedSupplier = { id: string; name: string; status: string }

interface AuthState {
  profile: Profile | null
  linkedSupplier: LinkedSupplier | null
  /** null while auth is loading — do not use for permissions until settled */
  role: UserRole | null
  loading: boolean
  isGestor: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  profile: null,
  linkedSupplier: null,
  role: null,
  loading: true,
  isGestor: false,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [linkedSupplier, setLinkedSupplier] = useState<LinkedSupplier | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      if (json.ok) {
        setProfile(json.data.profile)
        setLinkedSupplier(json.data.supplier ?? null)
      } else {
        setProfile(null)
        setLinkedSupplier(null)
      }
    } catch {
      setProfile(null)
      setLinkedSupplier(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const role = loading ? null : (profile?.role ?? 'cliente')

  return (
    <AuthContext.Provider value={{
      profile,
      linkedSupplier,
      role,
      loading,
      isGestor: !loading && profile ? canManage(profile.role) : false,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
