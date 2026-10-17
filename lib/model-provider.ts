export function selectProvider(
  env: Record<string, string | undefined> = process.env,
): { provider: "openai" | "anthropic"; model: string | undefined } {
  const requested = env.MODEL_PROVIDER;
  if (requested && requested !== "openai" && requested !== "anthropic")
    throw new Error("MODEL_PROVIDER must be openai or anthropic.");
  const provider =
    requested ??
    (env.OPENAI_API_KEY
      ? "openai"
      : env.ANTHROPIC_API_KEY
        ? "anthropic"
        : null);
  if (provider === "openai" && env.OPENAI_API_KEY)
    return { provider, model: env.OPENAI_MODEL || undefined };
  if (provider === "anthropic" && env.ANTHROPIC_API_KEY)
    return { provider, model: env.ANTHROPIC_MODEL || undefined };
  throw new Error(
    "A direct model provider key is required. Ask the workspace administrator to configure it.",
  );
}
