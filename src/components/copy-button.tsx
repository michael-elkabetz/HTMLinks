"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState(false);
  return (
    <>
      <button
        type="button"
        className="copy-button"
        aria-label={copied ? "Copied" : label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setError(false);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
        <span aria-hidden="true">
          {error ? "Select to copy" : copied ? "Copied" : label}
        </span>
      </button>
      <span className="sr-only" role="status">
        {error
          ? "Could not copy. Select the text and copy it manually."
          : copied
            ? `${label} copied to clipboard.`
            : ""}
      </span>
    </>
  );
}
