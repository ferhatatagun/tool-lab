"use client";

import { Send, Square, Play, ArrowRight, Radio, KeyRound } from "lucide-react";
import type { PendingToolUse } from "@/lib/types";

interface Props {
  running: boolean;
  onStop: () => void;

  pendingToolUses: PendingToolUse[];
  onUpdateDraft: (id: string, draft: string) => void;
  onToggleError: (id: string, isError: boolean) => void;
  onQuickFill: (id: string) => void;
  onApplyResults: () => void;

  composer: string;
  onComposer: (v: string) => void;
  onSend: () => void;

  hasKey: boolean;
  /** is this the first message of the conversation */
  isFirstMessage: boolean;
}

export function InputArea({
  running,
  onStop,
  pendingToolUses,
  onUpdateDraft,
  onToggleError,
  onQuickFill,
  onApplyResults,
  composer,
  onComposer,
  onSend,
  hasKey,
  isFirstMessage,
}: Props) {
  if (running) {
    return (
      <div className="flex items-center gap-3 border-t border-border bg-bg-elev px-4 py-3">
        <Radio size={14} className="text-accent pulse-soft" />
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          Streaming response
        </span>
        <button
          onClick={onStop}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-danger hover:text-danger"
        >
          <Square size={12} fill="currentColor" /> Stop
        </button>
      </div>
    );
  }

  if (pendingToolUses.length > 0) {
    const ready = pendingToolUses.every((p) => p.resultDraft.trim().length > 0);
    return (
      <div className="border-t border-border bg-bg-elev p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tool">
            {pendingToolUses.length === 1
              ? "Provide the tool result"
              : `Provide ${pendingToolUses.length} tool results`}
          </span>
          <span className="text-[11px] text-fg-faint">
            You play the tool — return whatever you want.
          </span>
        </div>

        <div className="space-y-2">
          {pendingToolUses.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-bg p-2.5"
              style={{ borderColor: "color-mix(in srgb, var(--tool) 25%, var(--border))" }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <code className="rounded bg-bg-elev px-1.5 py-0.5 font-mono text-[11px] text-tool">
                  {p.name}
                </code>
                <button
                  onClick={() => onQuickFill(p.id)}
                  className="text-[11px] text-fg-faint underline-offset-2 hover:text-accent hover:underline"
                  title="Insert a suggested result"
                >
                  fill suggestion
                </button>
                <label className="ml-auto flex cursor-pointer items-center gap-1 text-[11px] text-fg-muted">
                  <input
                    type="checkbox"
                    checked={p.isError}
                    onChange={(e) => onToggleError(p.id, e.target.checked)}
                    className="accent-[var(--danger)]"
                  />
                  is_error
                </label>
              </div>
              <textarea
                value={p.resultDraft}
                onChange={(e) => onUpdateDraft(p.id, e.target.value)}
                rows={2}
                spellCheck={false}
                placeholder="Type the tool result — text, JSON, anything"
                className="w-full resize-y rounded-lg border border-border-strong bg-bg-elev px-2.5 py-1.5 font-mono text-[12px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end">
          <button
            onClick={onApplyResults}
            disabled={!ready}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continue <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Idle: composer
  return (
    <div className="flex items-end gap-2 border-t border-border bg-bg-elev p-3">
      <textarea
        value={composer}
        onChange={(e) => onComposer(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        spellCheck={false}
        placeholder={isFirstMessage ? "Start the agent: send a user message…" : "Send another message…"}
        className="flex-1 resize-y rounded-xl border border-border-strong bg-bg px-3 py-2 text-[14px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent"
      />
      <button
        onClick={onSend}
        disabled={!composer.trim()}
        className="flex h-[68px] w-28 shrink-0 items-center justify-center gap-2 self-stretch rounded-xl bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {hasKey ? (
          <>
            {isFirstMessage ? <Play size={14} fill="currentColor" /> : <Send size={14} />}
            {isFirstMessage ? "Run" : "Send"}
          </>
        ) : (
          <>
            <KeyRound size={14} /> Key
          </>
        )}
      </button>
    </div>
  );
}