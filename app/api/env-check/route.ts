import { getEnvValue } from "@/app/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = getEnvValue("HF_TOKEN");

  return Response.json({
    hasToken: Boolean(token),
    tokenPrefix: token ? token.slice(0, 3) : null,
    environment: process.env.VERCEL_ENV || "local",
  });
}