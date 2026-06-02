"use client";

import { useEffect, useRef } from "react";
import { User, Sparkles, Wrench, CornerDownRight, TriangleAlert } from "lucide-react";
import type { Block, Message } from "@/lib/types";

interface Props {
  messages: Message[];
  /** in-progress assistant blocks while streaming */
  streamingBlocks: Block[] | null;
  streamingActive: boolean;
}

export function ConversationView({ messages, streamingBlocks, streamingActive }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as the conversation grows or streams.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingBlocks]);

  // Build a tool_use_id → tool name lookup so tool_results can show the tool name.
  const toolNames = new Map<string, string>();
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b.type === "tool_use") toolNames.set(b.id, b.name);
      }
    }
  }
  if (streamingBlocks) {
    for (const b of streamingBlocks) {
      if (b.type === "tool_use") toolNames.set(b.id, b.name);
    }
  }

  // Flatten into rendered rows with role context.
  const rows: { role: "user" | "assistant"; block: Block; key: string }[] = [];
  messages.forEach((m, mi) => {
    if (typeof m.content === "string") {
      rows.push({ role: m.role, block: { type: "text", text: m.content }, key: `${mi}-s` });
    } else {
      m.content.forEach((b, bi) => rows.push({ role: m.role, block: b, key: `${mi}-${bi}` }));
    }
  });
  if (streamingBlocks) {
    streamingBlocks.forEach((b, bi) =>
      rows.push({ role: "assistant", block: b, key: `stream-${bi}` }),
    );
  }
  const lastIdx = rows.length - 1;
  const empty = rows.length === 0;

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      {empty ? (
        <EmptyState />
      ) : (
        <div className="mx-auto max-w-3xl space-y-2.5">
          {rows.map((r, i) => (
            <BlockRow
              key={r.key}
              role={r.role}
              block={r.block}
              toolNames={toolNames}
              isLast={i === lastIdx}
              streamingActive={streamingActive && i === lastIdx}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Wrench size={26} className="mb-3 text-fg-faint" />
      <p className="max-w-[20rem] text-sm text-fg-faint">
        Define tools on the left and send a user message — the agent loop plays out here.
      </p>
    </div>
  );
}

interface RowProps {
  role: "user" | "assistant";
  block: Block;
  toolNames: Map<string, string>;
  isLast: boolean;
  streamingActive: boolean;
}

function BlockRow({ role, block, toolNames, isLast, streamingActive }: RowProps) {
  const meta = metaFor(role, block);
  return (
    <div className="flex gap-3">
      <div className="relative flex w-5 shrink-0 flex-col items-center">
        <span
          className="relative z-10 mt-1.5 h-3 w-3 rounded-full border-2"
          style={{ borderColor: meta.color, background: "var(--bg)" }}
        />
        {!isLast && <span className="absolute top-4 bottom-0 w-px bg-border" />}
      </div>
      <div className="mb-1 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          {block.type === "tool_use" && (
            <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-fg">
              {block.name}()
            </code>
          )}
          {block.type === "tool_result" && (
            <>
              <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">
                {toolNames.get(block.tool_use_id) ?? "tool"}
              </code>
              {block.is_error && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-danger">
                  <TriangleAlert size={10} /> error
                </span>
              )}
            </>
          )}
        </div>
        <div className="rounded-xl border border-border bg-bg-elev p-3">
          <BlockBody block={block} streamingActive={streamingActive} role={role} />
        </div>
      </div>
    </div>
  );
}

function BlockBody({
  block,
  streamingActive,
  role,
}: {
  block: Block;
  streamingActive: boolean;
  role: "user" | "assistant";
}) {
  if (block.type === "text") {
    const empty = !block.text;
    return (
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg">
        {empty && streamingActive ? (
          <span className="text-fg-faint italic">thinking…</span>
        ) : (
          block.text
        )}
        {streamingActive && (
          <span
            className="caret-blink ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] align-middle"
            style={{ background: role === "assistant" ? "var(--assistant)" : "var(--user)" }}
          />
        )}
      </p>
    );
  }
  if (block.type === "tool_use") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-bg px-3 py-2 font-mono text-[12px] leading-relaxed text-fg-muted">
        {prettyJson(block.input)}
      </pre>
    );
  }
  // tool_result
  return (
    <pre
      className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-bg px-3 py-2 font-mono text-[12px] leading-relaxed"
      style={{ color: block.is_error ? "var(--danger)" : "var(--fg-muted)" }}
    >
      {block.content}
    </pre>
  );
}

function metaFor(role: "user" | "assistant", block: Block) {
  if (block.type === "tool_use") {
    return { label: "Tool call", color: "var(--tool)", icon: <Wrench size={12} /> };
  }
  if (block.type === "tool_result") {
    const color = block.is_error ? "var(--danger)" : "var(--result)";
    return { label: "Result", color, icon: <CornerDownRight size={12} /> };
  }
  if (role === "user") return { label: "User", color: "var(--user)", icon: <User size={12} /> };
  return { label: "Claude", color: "var(--assistant)", icon: <Sparkles size={12} /> };
}

function prettyJson(v: unknown): string {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return String(v);
  }
}
