"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { COMMAND_NAMES, runCommand } from "@/lib/tui-commands";

interface HistoryEntry {
  input?: string;
  lines: string[];
  art?: string[];
}

// Each art row packs 12 hex chars per cell: RRGGBB (top pixel) + RRGGBB
// (bottom pixel), drawn as a half-block so one character shows two pixels.
function ArtBlock({ rows }: { rows: string[] }) {
  return (
    <div aria-hidden="true" className="my-2 leading-none">
      {rows.map((row, y) => (
        <div key={y} className="flex">
          {Array.from({ length: row.length / 12 }, (_, x) => {
            const cell = row.slice(x * 12, x * 12 + 12);
            return (
              <span
                key={x}
                style={{ color: `#${cell.slice(0, 6)}`, backgroundColor: `#${cell.slice(6)}` }}
              >
                {"\u2580"}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const BOOT: HistoryEntry[] = [
  {
    lines: [
      "Mark Stuart CLI v1.0.0",
      "Type \"help\" for available commands, \"exit\" to return to the site.",
      "Some commands are not in help. Curiosity is rewarded.",
      "",
    ],
  },
];

export function TuiTerminal() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [history, setHistory] = useState<HistoryEntry[]>(BOOT);
  const [input, setInput] = useState("");
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = input;
    setCommandLog((log) => (value.trim() ? [...log, value.trim()] : log));
    setLogIndex(null);
    setInput("");

    const result = await runCommand(value);

    if (result.clear) {
      setHistory([]);
      return;
    }
    setHistory((current) => [
      ...current,
      { input: value, lines: result.lines, art: result.art },
    ]);
    if (result.toggleTheme) {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }
    if (result.navigateTo) {
      setTimeout(() => router.push(result.navigateTo as string), 400);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      const prefix = input.trim().toLowerCase();
      const match = COMMAND_NAMES.find((name) => name.startsWith(prefix) && prefix);
      if (match) setInput(match);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandLog.length === 0) return;
      const next = logIndex === null ? commandLog.length - 1 : Math.max(0, logIndex - 1);
      setLogIndex(next);
      setInput(commandLog[next]);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (logIndex === null) return;
      const next = logIndex + 1;
      if (next >= commandLog.length) {
        setLogIndex(null);
        setInput("");
      } else {
        setLogIndex(next);
        setInput(commandLog[next]);
      }
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-dvh bg-zinc-950 px-4 py-6 font-mono text-sm leading-relaxed text-zinc-300 sm:px-6 sm:text-[15px]"
    >
      <div className="mx-auto max-w-3xl">
        {history.map((entry, index) => (
          <div key={index}>
            {entry.input !== undefined ? (
              <p className="text-zinc-500">
                <span className="text-teal-400">$</span> {entry.input}
              </p>
            ) : null}
            {entry.art ? <ArtBlock rows={entry.art} /> : null}
            {entry.lines.map((line, lineIndex) => (
              <p key={lineIndex} className="whitespace-pre-wrap break-words">
                {line || " "}
              </p>
            ))}
          </div>
        ))}

        <form onSubmit={submit} className="flex items-center gap-2">
          <span className="shrink-0 text-teal-400">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 border-none bg-transparent text-zinc-100 caret-teal-400 outline-none"
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
}
