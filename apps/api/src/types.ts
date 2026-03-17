export type SessionUser = {
  id: string
  email: string
  name: string
  image?: string | null
}

export type AppEnv = {
  Bindings: {
    hexi_site: D1Database
    BETTER_AUTH_URL: string
    AVATAR_BUCKET: R2Bucket
  }
  Variables: {
    user: SessionUser
    session: { id: string; userId: string }
  }
}
