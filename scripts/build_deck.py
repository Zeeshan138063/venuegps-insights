"""Build deck/index.html from src/slides/*.html.

Usage:  python3 scripts/build_deck.py

Each slide file holds one <section> on a 1920x1080 canvas. This script
replaces the <x-icon> and <x-shape> tags with inline SVG, drops speaker
notes (<aside>), and wraps everything in a small keyboard-driven player.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "deck" / "index.html"

ICONS = {
    "Pin": '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
    "Globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "Warning": '<path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "Users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "Search": '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    "Lightning": '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    "Home": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    "Star": '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    "Lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "Lock": '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "Verified": '<path d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.3z"/><path d="M9 12l2 2 4-4"/>',
    "Trust": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    "Chart": '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16V9"/>',
    "Key": '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>',
    "CheckCircle": '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
}


def icon(m: re.Match) -> str:
    name, style = m.group(1), m.group(2)
    paths = ICONS.get(name)
    if paths is None:
        raise SystemExit(f"Unknown icon: {name}")
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '
            f'style="{style};flex-shrink:0">{paths}</svg>')


def shape(m: re.Match) -> str:
    kind, style = m.group(1), m.group(2)
    if kind != "arrow-right":
        raise SystemExit(f"Unsupported shape: {kind}")
    fill = re.search(r"background:\s*([^;]+)", style).group(1)
    rest = re.sub(r"background:\s*[^;]+;?", "", style)
    return (f'<svg viewBox="0 0 56 32" aria-hidden="true" style="{rest};flex-shrink:0">'
            f'<polygon points="0,10 34,10 34,0 56,16 34,32 34,22 0,22" fill="{fill}"/></svg>')


def slide_html(sid: str) -> str:
    html = (SRC / "slides" / f"{sid}.html").read_text()
    html = re.sub(r"<aside>.*?</aside>", "", html, flags=re.S)
    html = re.sub(r'<x-icon name="(\w+)" style="([^"]*)"></x-icon>', icon, html)
    html = re.sub(r'<x-shape kind="([\w-]+)" style="([^"]*)"></x-shape>', shape, html)
    if "<x-" in html:
        raise SystemExit(f"Unconverted custom tag in {sid}")
    return html.replace("<section ", '<section class="slide" ', 1)


def main() -> None:
    deck = json.loads((SRC / "deck.json").read_text())
    slides = "\n".join(slide_html(s) for s in deck["order"])
    page = TEMPLATE.replace("{{TITLE}}", deck["title"]).replace("{{SLIDES}}", slides)
    OUT.write_text(page)
    print(f"Wrote {OUT.relative_to(ROOT)} with {len(deck['order'])} slides")


TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{{TITLE}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; height: 100%; background: #0F1420; overflow: hidden; font-family: 'Poppins', Arial, sans-serif; }
  #stage { position: absolute; width: 1920px; height: 1080px; transform-origin: 0 0; }
  .slide { position: absolute; inset: 0; width: 1920px; height: 1080px; box-sizing: border-box; overflow: hidden;
           opacity: 0; visibility: hidden; transition: opacity .35s ease, visibility .35s; }
  .slide.on { opacity: 1; visibility: visible; }
  .slide * { box-sizing: border-box; }
  .slide h1, .slide h2, .slide h3, .slide p { margin: 0; }
  .slide p { line-height: 1.4; }
  .slide ul, .slide ol { margin: 0; padding-left: 1.3em; }
  .slide table { border-collapse: collapse; width: 100%; }
  .slide th, .slide td { padding: .35em .6em; border-bottom: 1px solid #D5DAE1; text-align: left; vertical-align: top; line-height: 1.35; }
  .slide th { font-weight: 700; }
  .slide div:not([style*="display"]) { display: flex; flex-direction: column; }
  .slide a { color: inherit; }
  #bar { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; gap: 6px; align-items: center;
         background: rgba(15,20,32,.82); color: #fff; padding: 6px; border-radius: 999px; font-size: 14px;
         transition: opacity .3s; z-index: 10; }
  #bar.hide { opacity: 0; pointer-events: none; }
  #bar button, #bar a { all: unset; cursor: pointer; padding: 8px 14px; border-radius: 999px; font-weight: 600; }
  #bar button:hover, #bar a:hover { background: rgba(255,255,255,.14); }
  #bar button:focus-visible, #bar a:focus-visible { outline: 2px solid #8FCDEF; }
  #count { padding: 0 8px; min-width: 64px; text-align: center; font-variant-numeric: tabular-nums; }
  @page { size: 1920px 1080px; margin: 0; }
  @media print {
    html, body { overflow: visible; height: auto; background: #fff; }
    #stage { position: static; transform: none !important; width: 1920px; height: auto; }
    .slide { position: relative; opacity: 1; visibility: visible; transition: none; break-after: page; }
    #bar { display: none; }
  }
</style>
</head>
<body>
<div id="stage">
{{SLIDES}}
</div>
<nav id="bar" aria-label="Slide controls">
  <a href="/" title="Back to the overview">Home</a>
  <button id="prev" aria-label="Previous slide">&larr;</button>
  <span id="count" aria-live="polite">1 / 1</span>
  <button id="next" aria-label="Next slide">&rarr;</button>
  <button id="full" title="Full screen (F)">Full screen</button>
  <a href="/deck/VenueGPS-Insights.pdf" download>PDF</a>
</nav>
<script>
(() => {
  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const count = document.getElementById('count');
  const bar = document.getElementById('bar');
  let i = Math.min(Math.max(parseInt(location.hash.slice(1), 10) - 1 || 0, 0), slides.length - 1);

  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
  }
  function show(n) {
    i = Math.min(Math.max(n, 0), slides.length - 1);
    slides.forEach((el, k) => el.classList.toggle('on', k === i));
    count.textContent = `${i + 1} / ${slides.length}`;
    history.replaceState(null, '', `#${i + 1}`);
  }
  let idle;
  function wake() { bar.classList.remove('hide'); clearTimeout(idle); idle = setTimeout(() => bar.classList.add('hide'), 2500); }

  document.getElementById('prev').onclick = () => show(i - 1);
  document.getElementById('next').onclick = () => show(i + 1);
  document.getElementById('full').onclick = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); show(i + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); show(i - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'f' || e.key === 'F') document.getElementById('full').click();
  });
  let x0 = null;
  addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  addEventListener('mousemove', wake);
  addEventListener('resize', fit);
  fit(); show(i); wake();
})();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
