import { createAuthClient } from "better-auth/react"

const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;

export const authClient = createAuthClient({
  baseURL: authApiUrl,
  fetchOptions: {
    credentials: "include",
  },
})

export const { useSession } = authClient
