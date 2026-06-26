'use client'

import { useCallback, useEffect, useState } from 'react'
import { reportsApi } from '@/lib/api'
import { useAuth } from '@/components/auth/AuthProvider'

export interface MonthlyReportData {
  summary: string
  aiPowered: boolean
  metrics: {
    orders: number
    revenue: number
    activeSuppliers: number
    avgQcps: number
    activeProjects: number
    insights: number
    delivered: number
    pending: number
  }
  periodLabel: string
}

export function useMonthlyReport(options?: { autoFetch?: boolean }) {
  const autoFetch = options?.autoFetch ?? true
  const { isGestor, loading: authLoading } = useAuth()
  const [data, setData] = useState<MonthlyReportData | null>(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isGestor) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const report = await reportsApi.monthly()
      setData({
        summary: report.summary,
        aiPowered: report.aiPowered,
        metrics: report.metrics,
        periodLabel: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      })
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o relatório')
      throw e
    } finally {
      setLoading(false)
    }
  }, [isGestor])

  useEffect(() => {
    if (!autoFetch || authLoading) return
    void refresh().catch(() => {})
  }, [autoFetch, authLoading, refresh])

  return { data, loading: authLoading || loading, error, isGestor, refresh }
}
