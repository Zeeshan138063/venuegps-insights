// Shared helpers for the two demo dashboards. All data is generated sample data.
window.V = (() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const money = (n) => '$' + fmt(n);
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
  const day = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Seeded random numbers, so every visitor sees the same sample data.
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const pin = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>';

  function header(view, navItems, activeNav, tag) {
    const nav = navItems.map((n) => `<span class="${n === activeNav ? 'on' : ''}">${n}</span>`).join('');
    return `<header class="hdr"><div class="hdr-in">
      <a class="logo" href="/" aria-label="VenueGPS proposal home">${pin}<span>VenueGPS</span>${tag ? `<span class="tag">${tag}</span>` : ''}</a>
      <nav class="nav" aria-label="Main">${nav}</nav>
      <div class="switch">
        <a href="/demo" class="${view === 'venue' ? 'on' : ''}" ${view === 'venue' ? 'aria-current="page"' : ''}>Venue admin</a>
        <a href="/demo/admin" class="${view === 'admin' ? 'on' : ''}" ${view === 'admin' ? 'aria-current="page"' : ''}>VenueGPS admin</a>
      </div></div></header>`;
  }

  function delta(cur, prev, invert) {
    if (!prev) return { text: 'new', cls: 'up' };
    const d = (cur - prev) / prev * 100;
    const good = invert ? d <= 0 : d >= 0;
    return { text: (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%', cls: good ? 'up' : 'down' };
  }

  function kpiCards(list, compare) {
    return list.map((k) => {
      const d = delta(k.v, k.p, k.invert);
      return `<div class="card kpi"><div class="l">${k.label}</div><div class="v">${k.text ?? fmt(k.v)}</div>
        <div class="s">${compare ? `<span class="delta ${d.cls}">${d.text}</span>` : ''}<span>${k.sub}</span></div></div>`;
    }).join('');
  }

  function seg(key, current, options) {
    return options.map(([val, label]) =>
      `<button data-set="${key}" data-val="${val}" aria-pressed="${String(val) === String(current)}">${label}</button>`).join('');
  }

  function compareToggle(on) {
    return `<button class="toggle" data-toggle="compare" aria-pressed="${on}"><span class="tr"><span class="kn"></span></span>Compare to previous</button>`;
  }

  // Builds the SVG paths for a line chart on a 700 x 220 viewBox.
  function lineChart(series, prevSeries, step) {
    let max = Math.max(...series, ...(prevSeries || [0]));
    max = Math.ceil(max / step) * step || step;
    const W = 700, H = 220, n = series.length;
    const x = (i) => (n === 1 ? 0 : i / (n - 1) * W);
    const y = (v) => H - 6 - v / max * (H - 12);
    const path = (a) => a.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const line = path(series);
    return { max, line, area: `${line} L${W} ${H} L0 ${H} Z`, prev: prevSeries ? path(prevSeries) : '',
      xPct: (i) => (x(i) / W * 100).toFixed(2), yPct: (v) => (y(v) / H * 100).toFixed(2) };
  }

  // One state object per page; any [data-set] / [data-toggle] button updates it and re-renders.
  function mount(state, render) {
    const root = document.getElementById('app');
    const draw = () => { root.innerHTML = render(state); };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-set],[data-toggle]');
      if (!b) return;
      if (b.dataset.toggle) state[b.dataset.toggle] = !state[b.dataset.toggle];
      else { const v = b.dataset.val; state[b.dataset.set] = /^\d+$/.test(v) ? Number(v) : v; }
      const focusKey = b.dataset.set ? `[data-set="${b.dataset.set}"][data-val="${b.dataset.val}"]` : `[data-toggle="${b.dataset.toggle}"]`;
      draw();
      root.querySelector(focusKey)?.focus();
    });
    draw();
  }

  return { esc, fmt, money, sum, day, rng, header, kpiCards, seg, compareToggle, lineChart, mount };
})();
