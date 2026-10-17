import { expect, it } from "vitest";
import { selectProvider } from "../lib/model-provider";
it("requires a direct provider key and never falls back to Gateway", () => {
  expect(() => selectProvider({ AI_GATEWAY_API_KEY: "gateway" })).toThrow();
  expect(selectProvider({ OPENAI_API_KEY: "key" })).toEqual({
    provider: "openai",
    model: undefined,
  });
  expect(selectProvider({ ANTHROPIC_API_KEY: "key" })).toEqual({
    provider: "anthropic",
    model: undefined,
  });
});
it("honors an explicit provider and fails closed if its key is missing", () => {
  expect(
    selectProvider({
      OPENAI_API_KEY: "one",
      ANTHROPIC_API_KEY: "two",
      MODEL_PROVIDER: "anthropic",
      ANTHROPIC_MODEL: "chosen",
    }),
  ).toEqual({ provider: "anthropic", model: "chosen" });
  expect(() =>
    selectProvider({ OPENAI_API_KEY: "one", MODEL_PROVIDER: "anthropic" }),
  ).toThrow();
});
