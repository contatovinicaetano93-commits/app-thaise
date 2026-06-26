'use client'

import { Sparkles } from 'lucide-react'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { MonthlyReportPanel } from '@/components/reports/MonthlyReportPanel'
import { useMonthlyReport } from '@/lib/hooks/use-monthly-report'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ReportsPage() {
  const router = useRouter()
  const { data, loading, error, isGestor, refresh } = useMonthlyReport()

  useEffect(() => {
    if (!loading && !isGestor) router.replace('/dashboard')
  }, [loading, isGestor, router])

  if (!isGestor && !loading) return null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageFeedHeader
        title="Relatório mensal"
        icon={Sparkles}
        subtitle="Análise executiva do mês gerada com IA"
        menuItems={[
          { label: 'Visão geral', href: '/dashboard' },
          { label: 'Insights QCPS', href: '/insights' },
        ]}
      />

      <MonthlyReportPanel
        data={data}
        loading={loading}
        error={error}
        onRetry={refresh}
        defaultOpen
      />
    </div>
  )
}
