"use client";
import { useEffect, useRef, useState } from "react";
import type { ExampleKind } from "@/lib/examples";
import "./document-demo.css";

const options: {
  id: ExampleKind;
  label: string;
  filename: string;
  title: [string, string];
  description: string;
  detail: string;
}[] = [
  {
    id: "idea",
    label: "Idea doc",
    filename: "an-idea-worth-sharing.html",
    title: ["An idea.", "To explore."],
    description:
      "The problem, the proposal, and what to build first. Give your next idea a page people can explore.",
    detail: "Explore the proposal, or scroll to the tech design.",
  },
  {
    id: "technical",
    label: "Tech Design",
    filename: "html-publishing-design.html",
    title: ["Tech design.", "Made visible."],
    description:
      "An embedded Archify diagram, architecture decisions, and the failure paths. A tech design you can inspect.",
    detail: "Inspect the diagram, or scroll to the presentation.",
  },
  {
    id: "presentation",
    label: "Presentation",
    filename: "introducing-HTMLinks.html",
    title: ["The pitch.", "In three slides."],
    description:
      "Turn the same idea into a short slide deck, with full-screen layouts and slide controls in a self-contained HTML file.",
    detail: "Try the slides. Open any example to see the full page.",
  },
];

export function DocumentDemo() {
  const root = useRef<HTMLDivElement>(null);
  const selected = useRef(0);
  const enhanced = useRef(false);
  const [active, setActive] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const item = options[active];

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    function paint() {
      frame = 0;
      if (!element) return;
      enhanced.current =
        !preference.matches &&
        innerWidth > 1000 &&
        innerHeight > 740 &&
        element.querySelector<HTMLElement>(".example-pin")!.scrollHeight <=
          innerHeight;
      element.toggleAttribute("data-scroll-enabled", enhanced.current);
      element.toggleAttribute("data-scroll-disabled", !enhanced.current);
      if (!enhanced.current) return;
      const rect = element.getBoundingClientRect();
      const range = element.offsetHeight - innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, range)));
      element.style.setProperty("--example-progress", String(progress));
      const next = Math.min(
        options.length - 1,
        Math.floor(progress * options.length),
      );
      if (
        rect.top < innerHeight &&
        rect.bottom > 0 &&
        next !== selected.current
      ) {
        selected.current = next;
        setActive(next);
        setInteractive(false);
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
      element.removeAttribute("data-scroll-enabled");
    };
  }, []);

  function choose(index: number) {
    selected.current = index;
    setActive(index);
    setInteractive(false);
    const element = root.current;
    if (enhanced.current && element) {
      const range = element.offsetHeight - innerHeight;
      const start = element.getBoundingClientRect().top + scrollY;
      scrollTo({
        top: start + ((index + 0.15) / options.length) * range,
        behavior: "instant",
      });
    }
  }

  return (
    <div className="example-story" ref={root}>
      <div className="example-pin">
        <div className="example-layout">
          <div className="example-copy">
            <div className="example-copy-change" key={item.id}>
              <h2 id="examples-title">
                {item.title[0]}
                <br />
                {item.title[1]}
              </h2>
              <p>{item.description}</p>
            </div>
            <p className="example-scroll-hint">
              <span className="example-scroll-detail" aria-hidden="true">
                ↓
              </span>
              <span className="example-scroll-detail">{item.detail}</span>
              <span className="example-static-detail">
                Choose an example, then interact with it or open the full page.
              </span>
            </p>
            <p className="example-privacy-note">
              Public or password-protected. Your choice.
            </p>
            <a className="example-skip" href="#install">
              Skip to installation ↗
            </a>
          </div>
          <div className="example-frame">
            <div className="document-demo" data-ui>
              <div className="document-top">
                <div
                  className="document-tabs"
                  role="tablist"
                  aria-label="Example documents"
                >
                  {options.map((option, index) => (
                    <button
                      type="button"
                      key={option.id}
                      id={`example-tab-${option.id}`}
                      role="tab"
                      aria-selected={active === index}
                      aria-controls="document-preview-panel"
                      tabIndex={active === index ? 0 : -1}
                      onClick={() => choose(index)}
                      onKeyDown={(event) => {
                        let next = index;
                        if (event.key === "ArrowRight")
                          next = (index + 1) % options.length;
                        else if (event.key === "ArrowLeft")
                          next = (index + options.length - 1) % options.length;
                        else if (event.key === "Home") next = 0;
                        else if (event.key === "End") next = options.length - 1;
                        else return;
                        event.preventDefault();
                        choose(next);
                        document
                          .getElementById(`example-tab-${options[next].id}`)
                          ?.focus({ preventScroll: true });
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <a
                  href={`/examples/${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${item.label} example`}
                >
                  Open <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div
                className="document-stage"
                id="document-preview-panel"
                role="tabpanel"
                aria-labelledby={`example-tab-${item.id}`}
              >
                <div
                  className={`document-live document-sheet sheet-${item.id}`}
                  key={item.id}
                  data-interactive={interactive}
                >
                  <iframe
                    id="document-preview"
                    title={`${item.label} example`}
                    src={`/examples/${item.id}`}
                    loading="lazy"
                    sandbox="allow-scripts"
                    tabIndex={interactive ? 0 : -1}
                    inert={!interactive}
                  />
                </div>
              </div>
              <div className="document-caption">
                <span aria-live="polite">{item.filename}</span>
                <button
                  type="button"
                  className="document-interact"
                  aria-pressed={interactive}
                  aria-controls="document-preview"
                  onClick={() => setInteractive(!interactive)}
                >
                  {interactive
                    ? "Resume page scroll ↓"
                    : "Interact with document ↗"}
                </button>
              </div>
            </div>
            <div className="example-reading-track" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
      <noscript>
        <p className="example-noscript">
          Open the examples:{" "}
          <a href="/examples/idea" target="_blank" rel="noreferrer">
            Idea doc
          </a>
          ,{" "}
          <a href="/examples/technical" target="_blank" rel="noreferrer">
            Tech Design
          </a>
          ,{" "}
          <a href="/examples/presentation" target="_blank" rel="noreferrer">
            Presentation
          </a>
          .
        </p>
      </noscript>
    </div>
  );
}
