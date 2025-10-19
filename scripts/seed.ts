import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolvePath(relative: string) {
  return join(__dirname, "..", relative);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase URL or service role key in environment variables.");
  }

  const client = createClient(supabaseUrl, serviceKey);

  const programs = JSON.parse(readFileSync(resolvePath("supabase/seeds/programs.json"), "utf-8"));
  const workouts = JSON.parse(readFileSync(resolvePath("supabase/seeds/workouts.json"), "utf-8"));
  const meals = JSON.parse(readFileSync(resolvePath("supabase/seeds/meals.json"), "utf-8"));

  await upsert("programs", programs, "key");
  await upsert("workouts", workouts, "title");
  await upsert("meals", meals, "title");

  console.log("Seed completed.");

  async function upsert(table: string, data: Record<string, unknown>[], conflictColumn: string) {
    if (!data.length) return;
    const { error } = await client.from(table).upsert(data, { onConflict: conflictColumn });
    if (error) {
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
