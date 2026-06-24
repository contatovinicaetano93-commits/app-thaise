export function parsePagination(searchParams: URLSearchParams, defaultLimit = 50) {
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? defaultLimit), 1), 100)
  const cursor = searchParams.get('cursor')
  return { limit, cursor }
}

export function paginationMeta<T extends Record<string, unknown>>(
  rows: T[],
  limit: number,
  cursorField: keyof T & string,
) {
  const last = rows.at(-1)
  const nextCursor =
    rows.length === limit && last && typeof last[cursorField] === 'string'
      ? (last[cursorField] as string)
      : undefined

  return { count: rows.length, limit, nextCursor }
}
