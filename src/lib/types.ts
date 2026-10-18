import { MODEL_OPTIONS, modelLabel } from "./models";

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

/**
 * Models that think by default return thinking blocks. They are never shown,
 * but must be sent back byte-for-byte (including empty `thinking` text and the
 * signature) to keep the model's reasoning across a tool loop.
 */
export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface RedactedThinkingBlock {
  type: "redacted_thinking";
  data: string;
}

export type Block =
  | TextBlock
  | ToolUseBlock
  | ToolResultBlock
  | ThinkingBlock
  | RedactedThinkingBlock;

export interface Message {
  role: Role;
  content: Block[] | string;
  /**
   * Assistant messages only: the system + tools this reply was generated under
   * (see `contextKey`). Client-side bookkeeping — never sent to the API.
   */
  ctx?: string;
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

export const MODEL_SUGGESTIONS = MODEL_OPTIONS;

export const shortModel = modelLabel;
