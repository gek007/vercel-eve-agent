import { defineAgent, defineDynamic } from "eve";
import { openai } from "eve/models/openai";
import { anthropic } from "eve/models/anthropic";
import { selectProvider } from "../lib/model-provider";
export default defineAgent({
  model: defineDynamic({
    events: {
      "step.started": () => {
        const selected = selectProvider();
        return {
          model:
            selected.provider === "openai"
              ? openai(selected.model)
              : anthropic(selected.model),
          modelContextWindowTokens: 128000,
        };
      },
    },
  }),
  defaultTools: false,
  tool: false,
  limits: {
    maxInputTokensPerSession: 200000,
    maxOutputTokensPerSession: 20000,
    maxTokenCostUsdPerSession: 2,
    sessionTimeoutMs: 7 * 24 * 60 * 60 * 1000,
  },
});
