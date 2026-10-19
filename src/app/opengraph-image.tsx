import { ImageResponse } from "next/og";

export const alt = "HTMLinks — HTML publishing for AI coding agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f8faf9",
        color: "#2c414a",
        padding: "64px 76px",
        fontFamily: "sans-serif",
        borderBottom: "16px solid #176d83",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="#176d83">
          <path d="M8 8H22V25H36L22 39V56H8Z" />
          <path d="M42 8H56V56H42V39H28L42 25Z" />
        </svg>
        <span style={{ fontSize: 44 }}>HTMLinks</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <span style={{ fontSize: 68, lineHeight: 1.1, letterSpacing: -3 }}>
          Your agent’s HTML. One lasting link.
        </span>
        <span style={{ fontSize: 28, color: "#176d83" }}>
          Publish · Update · Password-protect · Self-host
        </span>
      </div>
      <span style={{ fontSize: 24 }}>
        Open-source publishing for coding agents
      </span>
    </div>,
    size,
  );
}
