import { createServiceClient } from '@/lib/supabase-server'

export interface ProjectCapConfig {
  max: number
  label: string
}

export async function getProjectCap(): Promise<ProjectCapConfig> {
  const db = createServiceClient()
  const { data } = await db
    .from('operational_config')
    .select('value')
    .eq('key', 'project_cap_quarter')
    .maybeSingle()

  const val = (data as { value?: ProjectCapConfig } | null)?.value
  return val ?? { max: 12, label: 'Cap trimestral Estlar' }
}

export async function getActiveProjectCount(): Promise<number> {
  const db = createServiceClient()
  const quarterStart = getQuarterStart()
  const { count } = await db
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', quarterStart.toISOString())

  return count ?? 0
}

function getQuarterStart(): Date {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  return new Date(now.getFullYear(), quarter * 3, 1)
}

export async function checkProjectCap(): Promise<{
  cap: ProjectCapConfig
  active: number
  available: number
  atCap: boolean
}> {
  const cap = await getProjectCap()
  const active = await getActiveProjectCount()
  const available = Math.max(0, cap.max - active)
  return { cap, active, available, atCap: active >= cap.max }
}
