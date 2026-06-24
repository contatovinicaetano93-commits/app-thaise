import * as Sentry from '@sentry/nextjs'
import { getServerDsn, getTracesSampleRate } from '@/lib/sentry/config'

const dsn = getServerDsn()

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: getTracesSampleRate(),
    includeLocalVariables: true,
    enableLogs: true,
  })
}
