"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { Logo, GithubMark } from "@/components/Logo";
import { KeyDialog } from "@/components/KeyDialog";
import { ConfigPane } from "@/components/ConfigPane";
import { ConversationView } from "@/components/ConversationView";
import { InputArea } from "@/components/InputArea";
import { runStream } from "@/lib/anthropic";
import { loadApiKey, saveApiKey } from "@/lib/storage";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOOLS_JSON,
  DEFAULT_USER_MESSAGE,
  SUGGESTED_RESULTS,
} from "@/lib/sample";
import type {
  Block,
  Message,
  PendingToolUse,
  Tool,
  ToolResultBlock,
  UsageStats,
} from "@/lib/types";

const EMPTY_USAGE: UsageStats = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

interface ParsedTools {
  tools: Tool[];
  error: string | null;
}

function parseTools(json: string): ParsedTools {
  const trimmed = json.trim();
  if (!trimmed) return { tools: [], error: null };
  try {
    const data = JSON.parse(trimmed);
    if (!Array.isArray(data)) return { tools: [], error: "Tools must be an array." };
    for (const t of data) {
      if (!t || typeof t !== "object") return { tools: [], error: "Each tool must be an object." };
      if (typeof t.name !== "string") return { tools: [], error: "Each tool needs a string name." };
      if (typeof t.description !== "string")
        return { tools: [], error: "Each tool needs a string description." };
      if (!t.input_schema || typeof t.input_schema !== "object")
        return { tools: [], error: "Each tool needs an input_schema object." };
    }
    return { tools: data as Tool[], error: null };
  } catch (e) {
    return { tools: [], error: e instanceof Error ? e.message : "Invalid JSON." };
  }
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [toolsJson, setToolsJson] = useState(DEFAULT_TOOLS_JSON);
  const [composer, setComposer] = useState(DEFAULT_USER_MESSAGE);

  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingBlocks, setStreamingBlocks] = useState<Block[] | null>(null);
  const [pendingToolUses, setPendingToolUses] = useState<PendingToolUse[]>([]);
  const [, setTotalUsage] = useState<UsageStats>({ ...EMPTY_USAGE });
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const { tools, error: toolsError } = useMemo(() => parseTools(toolsJson), [toolsJson]);
  const running = streamingBlocks !== null;
  const isFirstMessage = messages.length === 0;

  useEffect(() => {
    setApiKey(loadApiKey());
    setMounted(true);
  }, []);

  const fireApi = useCallback(
    (nextMessages: Message[]) => {
      if (toolsError) {
        setError(`Tools JSON is invalid: ${toolsError}`);
        return;
      }
      setError(null);
      setStreamingBlocks([]);
      const ac = new AbortController();
      abortRef.current = ac;

      void runStream(
        apiKey,
        {
          model,
          system,
          messages: nextMessages,
          tools,
          maxTokens: DEFAULT_MAX_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        },
        {
          onUpdate: (blocks) => setStreamingBlocks(blocks),
          onUsage: (u) =>
            setTotalUsage((prev) => ({
              input_tokens: prev.input_tokens + u.input_tokens,
              output_tokens: prev.output_tokens + u.output_tokens,
              cache_read_input_tokens: prev.cache_read_input_tokens + u.cache_read_input_tokens,
              cache_creation_input_tokens:
                prev.cache_creation_input_tokens + u.cache_creation_input_tokens,
            })),
          onDone: ({ blocks }) => {
            setMessages((prev) => [...prev, { role: "assistant", content: blocks }]);
            setStreamingBlocks(null);
            const pendings: PendingToolUse[] = blocks
              .filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use")
              .map((b) => ({
                id: b.id,
                name: b.name,
                input: b.input,
                resultDraft: "",
                isError: false,
              }));
            setPendingToolUses(pendings);
          },
          onError: (msg) => {
            setError(msg);
            setStreamingBlocks(null);
            // Undo the last user message so the user can edit and retry.
            setMessages((prev) => prev.slice(0, -1));
          },
        },
        ac.signal,
      );
    },
    [apiKey, model, system, tools, toolsError],
  );

  const onSend = useCallback(() => {
    if (!apiKey) {
      setShowKey(true);
      return;
    }
    const text = composer.trim();
    if (!text || running) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setComposer("");
    fireApi(next);
  }, [apiKey, composer, messages, running, fireApi]);

  const onApplyResults = useCallback(() => {
    if (running || pendingToolUses.length === 0) return;
    const blocks: ToolResultBlock[] = pendingToolUses.map((p) => ({
      type: "tool_result",
      tool_use_id: p.id,
      content: p.resultDraft,
      is_error: p.isError || undefined,
    }));
    const next: Message[] = [...messages, { role: "user", content: blocks }];
    setMessages(next);
    setPendingToolUses([]);
    fireApi(next);
  }, [pendingToolUses, messages, running, fireApi]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const onReset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingBlocks(null);
    setPendingToolUses([]);
    setError(null);
    setTotalUsage({ ...EMPTY_USAGE });
    setComposer(DEFAULT_USER_MESSAGE);
  }, []);

  const onLoadSample = useCallback(() => {
    abortRef.current?.abort();
    setModel(DEFAULT_MODEL);
    setSystem(DEFAULT_SYSTEM);
    setToolsJson(DEFAULT_TOOLS_JSON);
    setComposer(DEFAULT_USER_MESSAGE);
    setMessages([]);
    setStreamingBlocks(null);
    setPendingToolUses([]);
    setError(null);
    setTotalUsage({ ...EMPTY_USAGE });
  }, []);

  const onUpdateDraft = useCallback((id: string, draft: string) => {
    setPendingToolUses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, resultDraft: draft } : p)),
    );
  }, []);

  const onToggleError = useCallback((id: string, isError: boolean) => {
    setPendingToolUses((prev) => prev.map((p) => (p.id === id ? { ...p, isError } : p)));
  }, []);

  const onQuickFill = useCallback((id: string) => {
    setPendingToolUses((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const suggested = SUGGESTED_RESULTS[p.name];
        return { ...p, resultDraft: suggested ?? p.resultDraft };
      }),
    );
  }, []);

  const keyMasked = apiKey ? `••••${apiKey.slice(-4)}` : "no key";

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg-elev/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">tool-lab</h1>
            <p className="hidden text-[11px] text-fg-faint sm:block">
              an interactive Claude tool-use sandbox
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden font-mono text-[11px] text-fg-faint sm:inline">
            {messages.length} turn{messages.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setShowKey(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              mounted && apiKey
                ? "border-success/40 text-success"
                : "border-accent/50 text-accent"
            }`}
          >
            <KeyRound size={14} />
            <span className="font-mono">{mounted ? keyMasked : "…"}</span>
          </button>
          <a
            href="https://github.com/ferhatatagun/tool-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-border-strong p-1.5 text-fg-muted transition-colors hover:text-fg"
            aria-label="Source on GitHub"
          >
            <GithubMark size={14} />
          </a>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <section className="min-h-0 border-b border-border bg-bg-elev lg:border-b-0 lg:border-r">
          <ConfigPane
            model={model}
            onModel={setModel}
            system={system}
            onSystem={setSystem}
            toolsJson={toolsJson}
            onToolsJson={setToolsJson}
            toolsError={toolsError}
            toolsCount={tools.length}
            running={running}
            onLoadSample={onLoadSample}
            onReset={onReset}
          />
        </section>

        <section className="flex min-h-0 flex-col bg-bg-elev-2">
          {error && (
            <div className="border-b border-danger/30 bg-danger/5 px-4 py-2 text-xs text-danger">
              {error}
            </div>
          )}
          <ConversationView
            messages={messages}
            streamingBlocks={streamingBlocks}
            streamingActive={running}
          />
          <InputArea
            running={running}
            onStop={onStop}
            pendingToolUses={pendingToolUses}
            onUpdateDraft={onUpdateDraft}
            onToggleError={onToggleError}
            onQuickFill={onQuickFill}
            onApplyResults={onApplyResults}
            composer={composer}
            onComposer={setComposer}
            onSend={onSend}
            hasKey={!!apiKey}
            isFirstMessage={isFirstMessage}
          />
        </section>
      </main>

      <KeyDialog
        open={showKey}
        initialKey={apiKey}
        onClose={() => setShowKey(false)}
        onSave={(k) => {
          setApiKey(k);
          saveApiKey(k);
          setShowKey(false);
        }}
      />
    </div>
  );
}
