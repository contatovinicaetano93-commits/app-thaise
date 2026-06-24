import * as Sentry from '@sentry/nextjs'
import { getClientDsn, getTracesSampleRate } from '@/lib/sentry/config'

const dsn = getClientDsn()

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: getTracesSampleRate(),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
    integrations: [Sentry.replayIntegration()],
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
