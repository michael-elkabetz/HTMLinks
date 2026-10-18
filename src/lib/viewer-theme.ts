import { escapeHtml } from "./security";

export const viewerStyle = `
@font-face{font-family:"Hanken Grotesk";font-style:normal;font-weight:400;font-display:swap;src:url("/fonts/hanken-grotesk-latin-400-normal.woff2") format("woff2")}
@font-face{font-family:"Hanken Grotesk";font-style:normal;font-weight:500;font-display:swap;src:url("/fonts/hanken-grotesk-latin-500-normal.woff2") format("woff2")}
:root{color-scheme:light;--bg:#f8faf9;--ink:#2c414a;--muted:#5a6c73;--accent:#176d83;--line:#dce5e6;--wash:#dfeced}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Hanken Grotesk",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}button,input{font:inherit}button,a,input{-webkit-tap-highlight-color:transparent}
.brand{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:29px;font-weight:500;letter-spacing:-1.1px;white-space:nowrap}.brand svg{width:34px;height:34px;color:var(--accent);flex:none}
.gate-header{height:88px;width:min(1100px,calc(100% - 48px));margin:auto;display:flex;align-items:center;justify-content:space-between}.shared-label{font-size:13px;color:var(--muted)}
.gate{max-width:440px;margin:clamp(36px,9vh,100px) auto 64px;padding:0 24px;text-align:center}.lock-mark{width:64px;height:64px;display:grid;place-items:center;margin:0 auto 28px;border-radius:50%;background:var(--wash);color:var(--accent)}.lock-mark svg{width:26px;height:26px}
.eyebrow{margin:0 0 14px;color:var(--accent);font-size:11px;letter-spacing:.15em;font-weight:500;text-transform:uppercase}h1{font-size:clamp(38px,6vw,48px);font-weight:500;letter-spacing:-.045em;line-height:1.06;margin:0 0 20px;text-wrap:balance}p{font-size:17px;line-height:1.6;color:var(--muted);margin:0 0 26px}.gate form{text-align:left;margin-top:32px}label{display:block;font-size:14px;margin-bottom:9px}input{width:100%;height:54px;padding:0 16px;background:white;color:var(--ink);border:1px solid #bacdd1;border-radius:12px;outline-offset:3px}input::placeholder{color:#74868b}
.button{min-height:50px;padding:13px 22px;border:0;border-radius:999px;background:var(--accent);color:white;display:inline-flex;align-items:center;justify-content:center;gap:24px;font-weight:500;cursor:pointer}.gate form .button{width:100%;margin-top:16px}.button svg{width:18px;height:18px}.button:hover{background:#12596c}.hint{font-size:13px;margin:18px 0 0}.error{font-size:14px;color:#9c3833;margin:0 0 16px;padding:12px;background:#fff0ed;border-radius:10px}
.gate-footer{text-align:center;margin:0 24px 32px;font-size:13px;color:var(--muted)}.gate-footer a{color:var(--accent)}:focus-visible{outline:3px solid #176d83;outline-offset:4px}
.viewer-header{height:76px;display:flex;align-items:center;gap:24px;padding:0 28px;border-bottom:1px solid var(--line);background:var(--bg)}.viewer-header .brand{font-size:24px}.viewer-header .brand svg{width:29px;height:29px}.document-meta{display:flex;min-width:0;align-items:center;gap:12px;flex:1;border-left:1px solid var(--line);padding-left:24px}.document-title{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.revision{font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:3px 8px;white-space:nowrap}.fullscreen{font-size:13px;background:transparent;border:1px solid #bacdd1;color:var(--ink);border-radius:999px;min-height:40px;padding:8px 16px;cursor:pointer;white-space:nowrap}.fullscreen:hover{background:var(--wash)}.document-frame{display:block;border:0;width:100%;height:calc(100dvh - 76px);background:var(--bg)}
@media(max-width:600px){.gate-header{height:80px;width:calc(100% - 36px)}.gate-header .brand{font-size:25px}.gate-header .brand svg{width:30px;height:30px}.shared-label{font-size:12px}.gate{margin-top:48px}.viewer-header{padding:0 16px;gap:12px}.viewer-header .brand span{display:none}.document-meta{padding-left:12px;gap:8px}.fullscreen{font-size:12px;padding:8px 12px}.revision{display:none}}
`;

export function viewerBrand(app: string) {
  return `<a class="brand" href="${escapeHtml(app)}" aria-label="HTMLinks home"><svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M8 8H22V25H36L22 39V56H8Z"/><path d="M42 8H56V56H42V39H28L42 25Z"/></svg><span>HTMLinks</span></a>`;
}

export const lockMark = `<div class="lock-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg></div>`;
export const arrowMark = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
