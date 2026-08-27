"use client";

import { useState } from "react";
import { Check, CopySimple, LinkedinLogo, XLogo } from "@phosphor-icons/react";

const actionClassName =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-control-border hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]";

function copyWithDocument(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) throw new Error("Copy failed");
}

export function PostShareLinks({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const xShareUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: title, url })}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      copyWithDocument(url);
      setCopied(true);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <nav aria-label="Share this article" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted">Share</span>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={actionClassName}
      >
        <XLogo size={16} weight="regular" />
      </a>
      <a
        href={linkedInShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={actionClassName}
      >
        <LinkedinLogo size={14} weight="regular" />
        LinkedIn
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={`${actionClassName} cursor-pointer`}
      >
        {copied ? <Check size={14} weight="bold" /> : <CopySimple size={14} weight="regular" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </nav>
  );
}
