"use client";

import { Sparkles, RotateCcw, Check, TriangleAlert } from "lucide-react";
import { MODEL_SUGGESTIONS } from "@/lib/types";

interface Props {
  model: string;
  onModel: (v: string) => void;
  system: string;
  onSystem: (v: string) => void;
  toolsJson: string;
  onToolsJson: (v: string) => void;
  toolsError: string | null;
  toolsCount: number;
  running: boolean;
  onLoadSample: () => void;
  onReset: () => void;
}

export function ConfigPane({
  model,
  onModel,
  system,
  onSystem,
  toolsJson,
  onToolsJson,
  toolsError,
  toolsCount,
  running,
  onLoadSample,
  onReset,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-faint">
          Config
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onLoadSample}
            disabled={running}
            className="flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50"
          >
            <Sparkles size={11} /> Sample
          </button>
          <button
            onClick={onReset}
            disabled={running}
            className="flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
            title="Reset the conversation"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Model">
          <input
            list="tl-models"
            value={model}
            onChange={(e) => onModel(e.target.value.trim())}
            disabled={running}
            spellCheck={false}
            autoComplete="off"
            placeholder="claude-sonnet-4-5-20250929"
            className="w-full rounded-lg border border-border-strong bg-bg px-2.5 py-1.5 font-mono text-xs text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent disabled:opacity-60"
          />
          <datalist id="tl-models">
            {MODEL_SUGGESTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </datalist>
        </Field>

        <Field label="System prompt">
          <textarea
            value={system}
            onChange={(e) => onSystem(e.target.value)}
            disabled={running}
            rows={4}
            spellCheck={false}
            placeholder="You are a concise assistant…"
            className="w-full resize-y rounded-lg border border-border-strong bg-bg px-2.5 py-1.5 text-[13px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent disabled:opacity-60"
          />
        </Field>

        <Field
          label="Tools"
          aside={
            toolsError ? (
              <span
                title={toolsError}
                className="flex items-center gap-1 text-[11px] font-medium text-danger"
              >
                <TriangleAlert size={11} /> invalid JSON
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                <Check size={11} /> {toolsCount} {toolsCount === 1 ? "tool" : "tools"}
              </span>
            )
          }
        >
          <textarea
            value={toolsJson}
            onChange={(e) => onToolsJson(e.target.value)}
            disabled={running}
            rows={14}
            spellCheck={false}
            placeholder='[\n  {\n    "name": "...",\n    "description": "...",\n    "input_schema": {...}\n  }\n]'
            className="w-full resize-y rounded-lg border border-border-strong bg-bg px-2.5 py-1.5 font-mono text-[11.5px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent disabled:opacity-60"
          />
          <p className="mt-1 text-[10px] text-fg-faint">
            Array of <span className="font-mono">{`{ name, description, input_schema }`}</span>.
            Edited live — invalid JSON disables Run.
          </p>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-fg-faint">
          {label}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}
