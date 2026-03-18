type D1Database = unknown
type R2ObjectBody = {
  body: ReadableStream | null
  httpEtag: string
  writeHttpMetadata: (headers: Headers) => void
}
type R2Bucket = {
  put: (...args: any[]) => Promise<unknown>
  get: (...args: any[]) => Promise<R2ObjectBody | null>
  delete: (...args: any[]) => Promise<unknown>
}
