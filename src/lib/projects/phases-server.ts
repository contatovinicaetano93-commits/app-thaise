import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PROJECT_PHASES } from '@/lib/projects/default-phases'
import type { ProjectPhaseRow } from '@/types/database'

export async function seedDefaultPhases(
  db: SupabaseClient,
  projectId: string,
): Promise<ProjectPhaseRow[]> {
  const rows = DEFAULT_PROJECT_PHASES.map((p, i) => ({
    project_id: projectId,
    name: p.name,
    sort_order: i,
    weight_pct: p.weight_pct,
  }))

  const { data, error } = await db
    .from('project_phases')
    .insert(rows as never)
    .select('*')

  if (error) throw new Error(error.message)

  const phases = (data ?? []) as ProjectPhaseRow[]
  if (phases[0]) {
    await db
      .from('projects')
      .update({ current_phase_id: phases[0].id } as never)
      .eq('id', projectId)
  }

  return phases
}

export async function fetchPhasesForProjects(
  db: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, ProjectPhaseRow[]>> {
  const map = new Map<string, ProjectPhaseRow[]>()
  if (projectIds.length === 0) return map

  const { data } = await db
    .from('project_phases')
    .select('*')
    .in('project_id', projectIds)
    .order('sort_order', { ascending: true })

  for (const row of (data ?? []) as ProjectPhaseRow[]) {
    const list = map.get(row.project_id) ?? []
    list.push(row)
    map.set(row.project_id, list)
  }
  return map
}
