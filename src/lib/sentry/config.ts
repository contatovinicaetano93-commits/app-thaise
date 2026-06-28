const tracesSampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.1

export function getClientDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN
}

export function getServerDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
}

export function getSentryOrg(): string | undefined {
  return process.env.SENTRY_ORG
}

export function getSentryProject(): string | undefined {
  return process.env.SENTRY_PROJECT
}

export function getSentryIssuesUrl(): string {
  const org = process.env.NEXT_PUBLIC_SENTRY_ORG ?? process.env.SENTRY_ORG
  const project = process.env.NEXT_PUBLIC_SENTRY_PROJECT ?? process.env.SENTRY_PROJECT
  if (org && project) {
    return `https://${org}.sentry.io/projects/${project}/`
  }
  return 'https://sentry.io'
}

export function getTracesSampleRate(): number {
  return tracesSampleRate
}
