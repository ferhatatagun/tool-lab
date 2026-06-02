export type Role = "user" | "assistant";

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type Block = TextBlock | ToolUseBlock | ToolResultBlock;

export interface Message {
  role: Role;
  content: Block[] | string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

/** A tool_use that's waiting for the user to provide a (mock) result. */
export interface PendingToolUse {
  id: string;
  name: string;
  input: unknown;
  /** the user's in-progress result text */
  resultDraft: string;
  /** is the user marking this as an error result */
  isError: boolean;
}

export const MODEL_SUGGESTIONS: { id: string; label: string }[] = [
  { id: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
  { id: "claude-opus-4-1-20250805", label: "Opus 4.1" },
];

export function shortModel(id: string): string {
  const known = MODEL_SUGGESTIONS.find((m) => m.id === id);
  if (known) return known.label;
  return id.replace(/^claude-/, "").replace(/-\d{8}$/, "");
}
