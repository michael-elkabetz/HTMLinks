import "server-only";
import postgres from "postgres";
let client: ReturnType<typeof postgres> | undefined;
export function sql() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required. Start PostgreSQL and run migrations.",
    );
  return (client ??= postgres(process.env.DATABASE_URL, {
    max: 6,
    prepare: false,
    idle_timeout: 20,
  }));
}
