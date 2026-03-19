import { ApiErrorSchema } from "@workspace/api-rpc"
import { hc } from "@workspace/api-rpc/client"
import type { ApiError, AppType } from "@workspace/api-rpc"
import { getAuthApiUrl } from "@/lib/auth-api-url";

const AUTH_API_URL = getAuthApiUrl()

export const apiClient = hc<AppType>(AUTH_API_URL, {
  init: {
    credentials: "include",
  },
})

export class ApiRequestError extends Error {
  status: number
  code?: string
  retryAfter?: number

  constructor(message: string, options: { status: number; code?: string; retryAfter?: number }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options.status
    this.code = options.code
    this.retryAfter = options.retryAfter
  }
}

function redirectToSignIn() {
  if (typeof window === "undefined") return
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const target = `/sign-in?redirect=${encodeURIComponent(current)}`
  if (window.location.pathname !== "/sign-in") {
    window.location.replace(target)
  }
}

export async function getApiError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null)
  const parsed = ApiErrorSchema.safeParse(payload)
  if (parsed.success) return parsed.data
  return { error: fallback } satisfies ApiError
}

export async function assertApiOk(response: Response, fallback: string) {
  if (response.ok) return
  const { error, code } = await getApiError(response, fallback)
  if (response.status === 401) {
    redirectToSignIn()
  }
  const retryAfterHeader = response.headers.get("Retry-After")
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined
  throw new ApiRequestError(error, {
    status: response.status,
    code,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
  })
}

type JsonResponsePromise = Promise<{
  json(): Promise<unknown>
} & Response>

type SuccessJson<TRequest extends JsonResponsePromise> = Exclude<
  Awaited<ReturnType<Awaited<TRequest>["json"]>>,
  ApiError
>

export async function apiRequest<TRequest extends JsonResponsePromise>(
  request: TRequest,
  fallback: string,
): Promise<SuccessJson<TRequest>> {
  const response = await request
  await assertApiOk(response, fallback)
  return response.json() as Promise<SuccessJson<TRequest>>
}
