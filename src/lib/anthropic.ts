import type { Block, Message, TextBlock, Tool, ToolUseBlock, UsageStats } from "./types";

/**
 * Direct browser → Anthropic streaming, with tool-use support. Tracks per-block
 * state: text deltas stream live; tool_use input JSON is accumulated from
 * input_json_delta events and parsed at content_block_stop.
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface RunRequest {
  model: string;
  system: string;
  messages: Message[];
  tools: Tool[];
  maxTokens: number;
  temperature: number;
}

export interface StreamCallbacks {
  /** Called whenever the assembled blocks change (text deltas, tool_use start/complete). */
  onUpdate: (blocks: Block[]) => void;
  onUsage: (usage: UsageStats) => void;
  /** Final assistant message with all blocks. */
  onDone: (final: { blocks: Block[]; usage: UsageStats; stopReason: string | null }) => void;
  onError: (message: string) => void;
}

const EMPTY_USAGE: UsageStats = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

function mergeUsage(target: UsageStats, raw: Record<string, unknown> | undefined) {
  if (!raw) return;
  if (typeof raw.input_tokens === "number") target.input_tokens = raw.input_tokens;
  if (typeof raw.output_tokens === "number") target.output_tokens = raw.output_tokens;
  if (typeof raw.cache_read_input_tokens === "number")
    target.cache_read_input_tokens = raw.cache_read_input_tokens;
  if (typeof raw.cache_creation_input_tokens === "number")
    target.cache_creation_input_tokens = raw.cache_creation_input_tokens;
}

export async function runStream(
  apiKey: string,
  req: RunRequest,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const blocks: Block[] = [];
  /** index → partial JSON string accumulator for tool_use inputs */
  const toolUseJson: Record<number, string> = {};
  const usage: UsageStats = { ...EMPTY_USAGE };
  let stopReason: string | null = null;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        system: req.system.trim() || undefined,
        messages: req.messages,
        tools: req.tools.length > 0 ? req.tools : undefined,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      cb.onError(await readError(res));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;

        let evt: Record<string, unknown>;
        try {
          evt = JSON.parse(dataLine.slice(5).trim());
        } catch {
          continue;
        }

        switch (evt.type) {
          case "message_start": {
            const msg = evt.message as { usage?: Record<string, unknown> } | undefined;
            mergeUsage(usage, msg?.usage);
            cb.onUsage({ ...usage });
            break;
          }
          case "content_block_start": {
            const idx = evt.index as number;
            const block = evt.content_block as Record<string, unknown>;
            if (block.type === "text") {
              blocks[idx] = { type: "text", text: "" };
            } else if (block.type === "tool_use") {
              blocks[idx] = {
                type: "tool_use",
                id: String(block.id),
                name: String(block.name),
                input: {},
              };
              toolUseJson[idx] = "";
            }
            cb.onUpdate(blocks.filter(Boolean));
            break;
          }
          case "content_block_delta": {
            const idx = evt.index as number;
            const delta = evt.delta as Record<string, unknown>;
            if (delta.type === "text_delta" && typeof delta.text === "string") {
              const b = blocks[idx];
              if (b && b.type === "text") {
                (b as TextBlock).text += delta.text;
                cb.onUpdate(blocks.filter(Boolean));
              }
            } else if (delta.type === "input_json_delta" && typeof delta.partial_json === "string") {
              toolUseJson[idx] = (toolUseJson[idx] ?? "") + delta.partial_json;
            }
            break;
          }
          case "content_block_stop": {
            const idx = evt.index as number;
            const b = blocks[idx];
            if (b && b.type === "tool_use") {
              try {
                const raw = toolUseJson[idx] ?? "";
                (b as ToolUseBlock).input = raw ? JSON.parse(raw) : {};
              } catch {
                (b as ToolUseBlock).input = {};
              }
              cb.onUpdate(blocks.filter(Boolean));
            }
            break;
          }
          case "message_delta": {
            const delta = evt.delta as Record<string, unknown> | undefined;
            mergeUsage(usage, evt.usage as Record<string, unknown>);
            if (typeof delta?.stop_reason === "string") stopReason = delta.stop_reason;
            cb.onUsage({ ...usage });
            break;
          }
          case "error": {
            const err = evt.error as Record<string, unknown> | undefined;
            cb.onError(String(err?.message ?? "Stream error from Anthropic."));
            return;
          }
        }
      }
    }

    const finalBlocks = blocks.filter(Boolean);
    cb.onDone({ blocks: finalBlocks, usage: { ...usage }, stopReason });
  } catch (err: unknown) {
    if (signal?.aborted) {
      cb.onDone({ blocks: blocks.filter(Boolean), usage: { ...usage }, stopReason: "aborted" });
      return;
    }
    cb.onError(errorMessage(err));
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message ?? body?.message;
    if (msg) return `${res.status} · ${msg}`;
  } catch {
    /* fall through */
  }
  if (res.status === 401) return "401 · Invalid API key.";
  if (res.status === 429) return "429 · Rate limited — wait a moment.";
  return `${res.status} · Request failed.`;
}

function errorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return "Network error — the request was blocked or could not reach Anthropic.";
  }
  if (err instanceof Error) return err.message;
  return "Unknown error while calling the Anthropic API.";
}
