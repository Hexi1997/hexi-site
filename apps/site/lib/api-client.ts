import { ApiErrorSchema } from "@workspace/api-rpc"
import { hc } from "@workspace/api-rpc/client"
import type { ApiError, AppType } from "@workspace/api-rpc"

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? ""

export const apiClient = hc<AppType>(AUTH_API_URL, {
  init: {
    credentials: "include",
  },
})

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
  return parsed.success ? parsed.data.error : fallback
}

export async function assertApiOk(response: Response, fallback: string) {
  if (response.ok) return
  const error = await getApiError(response, fallback)
  if (response.status === 401) {
    redirectToSignIn()
  }
  throw new Error(error)
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
