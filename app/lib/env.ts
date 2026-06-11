import fs from "node:fs";
import path from "node:path";

export function getEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const contents = fs.readFileSync(envPath, "utf8");
    const match = contents.match(new RegExp(`^${name}=(.+)$`, "m"));

    return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return undefined;
  }
}
