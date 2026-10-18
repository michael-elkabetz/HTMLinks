"use client";
import { useId, useState } from "react";
import { CopyButton } from "./copy-button";
const clients = ["Claude Code", "Codex", "Other"];
export function InstallGuide() {
  const id = useId();
  const [client, setClient] = useState("Claude Code");
  const [protectedUpload, setProtectedUpload] = useState(false);
  const agent =
    client === "Claude Code"
      ? "claude-code"
      : client === "Codex"
        ? "codex"
        : null;
  const command = `npx skills add michael-elkabetz/HTMLinks --skill htmlinks${agent ? ` --agent ${agent}` : ""}`;
  const prompt = protectedUpload
    ? "/HTMLlink upload the Idea HTML doc with password protection"
    : "/HTMLlink upload the Idea HTML doc";
  return (
    <div className="install-panel" data-ui>
      <div className="install-heading">
        <div
          className="client-tabs"
          role="tablist"
          aria-label="Choose your agent"
        >
          {clients.map((name, index) => (
            <button
              type="button"
              key={name}
              id={`${id}-tab-${index}`}
              role="tab"
              aria-selected={client === name}
              aria-controls={`${id}-panel`}
              tabIndex={client === name ? 0 : -1}
              onClick={() => setClient(name)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight")
                  next = (index + 1) % clients.length;
                else if (event.key === "ArrowLeft")
                  next = (index + clients.length - 1) % clients.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = clients.length - 1;
                else return;
                event.preventDefault();
                setClient(clients[next]);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${clients.indexOf(client)}`}
        tabIndex={0}
      >
        <div className="code-panel">
          <CopyButton text={command} />
          <pre>
            <code>{command}</code>
          </pre>
        </div>
        <p className="install-note">
          Install from GitHub in your project, then reload your agent’s skills.
          {client === "Other" ? " Choose your agent when prompted." : ""}
        </p>
        <p className="destination-note">
          First upload? Your agent asks: managed hosting or your own server? It
          remembers your choice.
        </p>
        <label className="password-choice">
          <input
            type="checkbox"
            checked={protectedUpload}
            onChange={(event) => setProtectedUpload(event.target.checked)}
          />
          Protect this upload with a password
        </label>
        <div className="first-prompt">
          <p>“{prompt}”</p>
          <CopyButton label="Copy prompt" text={prompt} />
        </div>
        <p className="install-note">
          {protectedUpload
            ? "Your agent will arrange secure password input before uploading."
            : "Your agent uploads. You get a link. That’s it."}
        </p>
      </div>
    </div>
  );
}
