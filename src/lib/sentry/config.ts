const tracesSampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.1

export function getClientDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN
}

export function getServerDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
}

export function getTracesSampleRate(): number {
  return tracesSampleRate
}
