import Link from "next/link";

export function LogoGlyph() {
  return (
    <g stroke="none">
      <path d="M8 8H22V25H36L22 39V56H8Z" />
      <path d="M42 8H56V56H42V39H28L42 25Z" />
    </g>
  );
}

export function LogoMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 64 64"
      fill="var(--accent)"
      aria-hidden="true"
      focusable="false"
    >
      <LogoGlyph />
    </svg>
  );
}
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="HTMLinks home">
      <LogoMark />
      <span>HTMLinks</span>
    </Link>
  );
}
export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/docs">Docs</Link>
        <Link href="/#self-host">Self-host</Link>
        <a
          href="https://github.com/michael-elkabetz/HTMLinks"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}
