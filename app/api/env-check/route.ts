export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    hasToken: Boolean(process.env.HF_TOKEN),
    tokenPrefix: process.env.HF_TOKEN
      ? process.env.HF_TOKEN.slice(0, 3)
      : null,
    environment: process.env.VERCEL_ENV || "local",
  });
}