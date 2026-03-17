export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function avatarPathFromURL(url: string | null | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const prefix = "/api/profile/avatar/"
    if (!parsed.pathname.startsWith(prefix)) return null
    return decodeURIComponent(parsed.pathname.slice(prefix.length))
  } catch {
    return null
  }
}

export function extFromType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    default:
      return "bin"
  }
}

export function errorMessageFromUnknown(err: unknown) {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message
  }
  return "Request failed"
}

export function errorStatusFromUnknown(err: unknown) {
  if (err && typeof err === "object" && "status" in err && typeof err.status === "number") {
    return err.status
  }
  return 400
}
