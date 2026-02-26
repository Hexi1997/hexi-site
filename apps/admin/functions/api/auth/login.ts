interface Env {
  ADMIN_PAT: string;
  ADMIN_PASSWORD_HASH: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  const { env } = context;

  try {
    const { password } = (await context.request.json()) as { password: string };

    if (!password) {
      return Response.json(
        { error: "Password required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const hash = await sha256(password);

    if (hash !== env.ADMIN_PASSWORD_HASH) {
      return Response.json(
        { error: "Incorrect password" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Fetch GitHub user info to return along with the token
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${env.ADMIN_PAT}`,
        "User-Agent": "hexi-admin",
      },
    });

    if (!userRes.ok) {
      return Response.json(
        { error: "GitHub token invalid" },
        { status: 500, headers: corsHeaders }
      );
    }

    const user = (await userRes.json()) as {
      login: string;
      avatar_url: string;
      name: string | null;
    };

    return Response.json(
      { token: env.ADMIN_PAT, user },
      { headers: corsHeaders }
    );
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
};
