import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const ownerId = args[args.indexOf("--user") + 1];
const deployment = args[args.indexOf("--deployment") + 1];
if (
  !args.includes("--user") ||
  !args.includes("--deployment") ||
  !ownerId?.startsWith("user_") ||
  !deployment ||
  !/^(local|dev|dev:[A-Za-z0-9_-]+)$/.test(deployment)
) {
  console.error(
    "Usage: npm run seed -- --deployment local|dev --user user_... (production is refused)",
  );
  process.exit(1);
}
const selected = deployment === "dev" ? "dev" : deployment;
const result = spawnSync(
  "npx",
  [
    "convex",
    "run",
    "seed:run",
    JSON.stringify({ ownerId, version: 1 }),
    "--deployment",
    selected,
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
