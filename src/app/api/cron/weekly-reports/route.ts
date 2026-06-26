import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { generateAllWeeklyReports } from '@/lib/estlar/weekly-report'
import { createServiceClient } from '@/lib/supabase-server'
import { notifyUser } from '@/lib/webhooks/dispatch'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? req.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return err('Não autorizado', 401)
  }

  try {
    const result = await generateAllWeeklyReports()
    const db = createServiceClient()

    const { data: gestores } = await db.from('profiles').select('id').eq('role', 'gestor') as {
      data: Array<{ id: string }> | null
    }

    for (const g of gestores ?? []) {
      await notifyUser(
        g.id,
        'Relatórios 360 gerados',
        `${result.generated} rascunho(s) semanal(is) prontos para revisão`,
        '/reports/weekly',
      )
    }

    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

export const dynamic = 'force-dynamic'
