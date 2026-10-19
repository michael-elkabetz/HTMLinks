"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./landing-journey.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export { SceneTransition } from "./scene-transitions";

const ease = (value: number) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

export function LandingJourney({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = [...element.querySelectorAll<HTMLElement>("[data-scene]")];
    const flights = [
      ...element.querySelectorAll<SVGSVGElement | SVGGElement>(
        "[data-flight], [data-story-delivery]",
      ),
    ].map((group) => {
      const drawRoute = group.hasAttribute("data-flight");
      const svg = drawRoute ? (group as SVGSVGElement) : group.ownerSVGElement!;
      const route = group.querySelector<SVGPathElement>(
        ".flight-route, .story-delivery-route",
      )!;
      const paper = group.querySelector<SVGGElement>(
        ".flight-paper, .story-delivery-paper",
      )!;
      return {
        svg,
        route,
        paper,
        drawRoute,
        length: route.getTotalLength(),
        initialTransform: paper.getAttribute("transform") || "",
      };
    });
    const transitions = [
      ...element.querySelectorAll<HTMLElement>("[data-transition]"),
    ].map((svg) => {
      const paths = [
        ...svg.querySelectorAll<SVGPathElement>("[data-draw]"),
      ].map((path) => ({ path, length: path.getTotalLength() }));
      const packets = [
        ...svg.querySelectorAll<SVGGElement>("[data-network]"),
      ].map((network) => {
        const route = network.querySelector<SVGPathElement>("path")!;
        const dots = [...network.querySelectorAll<SVGCircleElement>("circle")];
        return { route, dots, length: route.getTotalLength() };
      });
      return { svg, paths, packets };
    });
    let frame = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    function paint() {
      frame = 0;
      if (!element) return;
      if (preference.matches) {
        element.removeAttribute("data-motion");
        for (const { route, paper, initialTransform } of flights) {
          route.removeAttribute("style");
          paper.setAttribute("transform", initialTransform);
        }
        for (const { svg, paths, packets } of transitions) {
          svg.removeAttribute("style");
          for (const { path } of paths) path.removeAttribute("style");
          for (const { dots } of packets)
            for (const dot of dots) dot.removeAttribute("style");
        }
        return;
      }
      element.setAttribute("data-motion", "true");
      const height = viewportHeight;
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > height + 200) continue;
        const arrival =
          1 - Math.pow(1 - clamp((height - rect.top) / (height * 0.8)), 3);
        const leaving = clamp(-rect.top / Math.max(rect.height, 1));
        scene.style.setProperty("--arrival-shift", `${(1 - arrival) * 56}px`);
        scene.style.setProperty("--arrival-turn", `${(1 - arrival) * 1.6}deg`);
        scene.style.setProperty(
          "--media-scale",
          `${0.95 + arrival * 0.05 - leaving * 0.025}`,
        );
      }
      for (const { svg, paths, packets } of transitions) {
        const rect = [...svg.querySelectorAll<SVGSVGElement>(".transition-art")]
          .map((art) => art.getBoundingClientRect())
          .find((bounds) => bounds.height > 0);
        if (!rect) continue;
        if (!rect.height || rect.bottom < -100 || rect.top > height + 100)
          continue;
        const progress = clamp(
          ((height - rect.top) / (height + rect.height)) * 1.5 - 0.12,
        );
        svg.style.setProperty(
          "--unfold",
          `${1 - ease((progress - 0.05) / 0.6)}`,
        );
        svg.style.setProperty("--resolve", `${ease((progress - 0.25) / 0.5)}`);
        svg.style.setProperty(
          "--assemble",
          `${1 - ease((progress - 0.25) / 0.6)}`,
        );
        for (const { path, length } of paths) {
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length * (1 - ease(progress / 0.8))}`;
        }
        for (const { route, dots, length } of packets) {
          dots.forEach((dot, index) => {
            const travel = clamp((progress - 0.08 - index * 0.11) / 0.72);
            const point = route.getPointAtLength(length * travel);
            dot.style.transform = `translate(${point.x}px, ${point.y}px)`;
            dot.style.opacity = `${Math.sin(travel * Math.PI)}`;
          });
        }
      }
      for (const { svg, route, paper, length, drawRoute } of flights) {
        const rect = svg.getBoundingClientRect();
        if (!rect.height || rect.bottom < -100 || rect.top > height + 100)
          continue;
        const progress = clamp(
          ((height - rect.top) / (height + rect.height)) * 1.45 - 0.1,
        );
        const delivery = ease((progress - 0.35) / 0.45);
        const at = length * (drawRoute ? progress : delivery);
        const point = route.getPointAtLength(at);
        const behind = route.getPointAtLength(Math.max(0, at - 2));
        const ahead = route.getPointAtLength(Math.min(length, at + 2));
        const angle =
          (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
        const turn = drawRoute
          ? Math.max(-24, Math.min(24, angle - 90))
          : -11 * delivery;
        if (drawRoute) {
          route.style.strokeDasharray = `${length}`;
          route.style.strokeDashoffset = `${length * (1 - progress)}`;
        }
        paper.setAttribute(
          "transform",
          `translate(${point.x} ${point.y}) rotate(${turn})`,
        );
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const resize = () => {
      if (window.innerWidth !== viewportWidth || window.innerWidth > 700) {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
      }
      schedule();
    };
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    preference.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      preference.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <main id="main" className="landing landing-journey" ref={root}>
      {children}
    </main>
  );
}
