import type { Message, Tool } from "./types";

export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
export const DEFAULT_MAX_TOKENS = 1024;
export const DEFAULT_TEMPERATURE = 1;

export const DEFAULT_SYSTEM =
  "You are a concise assistant. Use the available tools when they help, and answer directly when you have enough information. After getting tool results, give a clear, short final answer.";

export const DEFAULT_TOOLS: Tool[] = [
  {
    name: "get_weather",
    description: "Get the current weather conditions for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. 'Istanbul'" },
      },
      required: ["city"],
    },
  },
  {
    name: "get_traffic",
    description: "Get the current traffic and travel time between two locations.",
    input_schema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Starting location" },
        destination: { type: "string", description: "Destination" },
      },
      required: ["origin", "destination"],
    },
  },
];

export const DEFAULT_TOOLS_JSON = JSON.stringify(DEFAULT_TOOLS, null, 2);

export const DEFAULT_USER_MESSAGE =
  "Should I bike to work today? I'm in Istanbul, going from Beşiktaş to Levent.";

/** Suggested mock results, in case the user wants quick replies. */
export const SUGGESTED_RESULTS: Record<string, string> = {
  get_weather: "22°C, clear skies, light wind 12 km/h, sunset 19:48.",
  get_traffic: "Heavy traffic — driving takes ~35 min, biking ~22 min on the dedicated bike lane.",
};

/**
 * A fully-played-out demo conversation — the agent loop end to end, no key
 * needed. Loaded by the "Preview sample" button and by `?demo=1`.
 */
export const SAMPLE_CONVERSATION: Message[] = [
  { role: "user", content: DEFAULT_USER_MESSAGE },
  {
    role: "assistant",
    content: [
      { type: "text", text: "Let me check a couple of things." },
      {
        type: "tool_use",
        id: "toolu_demo_01",
        name: "get_weather",
        input: { city: "Istanbul" },
      },
    ],
  },
  {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: "toolu_demo_01",
        content: SUGGESTED_RESULTS.get_weather,
      },
    ],
  },
  {
    role: "assistant",
    content: [
      { type: "text", text: "Weather's great. Now checking traffic." },
      {
        type: "tool_use",
        id: "toolu_demo_02",
        name: "get_traffic",
        input: { origin: "Beşiktaş", destination: "Levent" },
      },
    ],
  },
  {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: "toolu_demo_02",
        content: SUGGESTED_RESULTS.get_traffic,
      },
    ],
  },
  {
    role: "assistant",
    content: [
      {
        type: "text",
        text:
          "Yes — bike. It's clear and 22°C, and the bike lane saves about 13 minutes over driving in this traffic. Perfect conditions for the ride.",
      },
    ],
  },
];
