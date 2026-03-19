import { createAuthClient } from "better-auth/react"
import { getAuthApiUrl } from "@/lib/auth-api-url";

const authApiUrl = getAuthApiUrl();

export const authClient = createAuthClient({
  baseURL: authApiUrl,
  fetchOptions: {
    credentials: "include",
  },
})

export const { useSession } = authClient
