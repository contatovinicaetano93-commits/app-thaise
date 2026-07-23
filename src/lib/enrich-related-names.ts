import { createServiceClient } from '@/lib/supabase-server'

type Named = { id: string; name: string }

/** Preenche project/client embutidos quando o RLS do role não enxerga essas tabelas. */
export async function enrichProjectAndClientNames<T extends {
  project_id?: string | null
  client_id?: string | null
  project?: { id?: string; name?: string | null } | null
  client?: { id?: string; name?: string | null } | null
}>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows

  const projectIds = [...new Set(rows.map(r => r.project_id ?? r.project?.id).filter(Boolean))] as string[]
  const clientIds = [...new Set(rows.map(r => r.client_id ?? r.client?.id).filter(Boolean))] as string[]

  if (projectIds.length === 0 && clientIds.length === 0) return rows

  const db = createServiceClient()
  const [projectsRes, clientsRes] = await Promise.all([
    projectIds.length
      ? db.from('projects').select('id, name').in('id', projectIds)
      : Promise.resolve({ data: [] as Named[] }),
    clientIds.length
      ? db.from('clients').select('id, name').in('id', clientIds)
      : Promise.resolve({ data: [] as Named[] }),
  ])

  const projects = new Map((projectsRes.data ?? []).map(p => [p.id, p.name]))
  const clients = new Map((clientsRes.data ?? []).map(c => [c.id, c.name]))

  return rows.map(row => {
    const projectId = row.project_id ?? row.project?.id
    const clientId = row.client_id ?? row.client?.id
    const projectName = projectId ? projects.get(projectId) : undefined
    const clientName = clientId ? clients.get(clientId) : undefined

    return {
      ...row,
      project: projectId
        ? { ...(row.project ?? {}), id: projectId, name: projectName ?? row.project?.name ?? null }
        : row.project,
      client: clientId
        ? { ...(row.client ?? {}), id: clientId, name: clientName ?? row.client?.name ?? null }
        : row.client,
    }
  })
}
