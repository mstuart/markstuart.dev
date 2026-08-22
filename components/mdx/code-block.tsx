import type { ComponentProps, ReactNode } from "react";
import { highlight } from "sugar-high";
import { lang } from "sugar-high/lang";

export function Pre({ children }: ComponentProps<"pre">) {
  return (
    <pre className="my-6 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </pre>
  );
}

export function Code({ className, children }: ComponentProps<"code">) {
  const match = /language-(\w+)/.exec(className ?? "");

  if (!match || typeof children !== "string") {
    return (
      <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {children as ReactNode}
      </code>
    );
  }

  const html = highlight(children.replace(/\n$/, ""), { lang: lang(match[1]) });

  return (
    <code className="sh-code font-mono" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
