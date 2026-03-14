import { NextRequest } from "next/server";

const AGENT_API_URL = `${process.env.NEXT_PUBLIC_AGENT_API_URL ?? ""}/api/chat`;
const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN ?? "";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const upstream = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGENT_API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain",
    },
  });
}
