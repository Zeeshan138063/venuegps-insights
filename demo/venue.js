// Venue Insights demo for a sample venue. All numbers are generated sample data.
(() => {
  const { fmt, sum, day, rng, header, kpiCards, seg, compareToggle, lineChart, mount, esc } = V;

  // ---- Sample data: 180 days, so any range can be compared with the period before it.
  const N = 180;
  const rand = rng(20261024);
  const today = new Date(2026, 9, 24);
  const EVENTS = { 175: 'DJ Kairo Live', 168: 'Neon Nights: 80s Party', 161: 'Latin Fridays', 154: 'Sunset Jazz Sessions', 147: 'Wine and Vinyl', 140: 'Brunch Beats', 126: 'Taco Tuesday Takeover', 112: 'Full Moon Rooftop Party', 98: 'Salsa Under the Stars', 70: 'Summer Closing Party', 45: 'Reggaeton Night', 20: 'Rooftop Cinema' };
  const PUSHES = { 176: 'DJ Kairo live tonight', 167: 'Neon Nights: last tickets', 160: 'Happy hour 5 to 7 pm', 150: 'Jazz night this Sunday', 133: 'New brunch menu', 111: 'Full Moon party tickets', 96: 'Salsa night is back', 69: 'Summer closing party' };
  const days = [];
  for (let i = 0; i < N; i++) {
    const date = new Date(today); date.setDate(today.getDate() - (N - 1 - i));
    const dowF = [0.85, 0.6, 0.65, 0.78, 1.0, 1.35, 1.45][date.getDay()];
    const ev = EVENTS[i] || null;
    const boosted = (i >= 150 && i <= 163) || i >= 166 || (i >= 60 && i <= 73);
    const base = (150 + i * 0.9) * dowF * (0.85 + rand() * 0.3);
    const organicViews = Math.round(base * (ev ? 1.9 : 1) * (PUSHES[i] ? 1.25 : 1));
    const boostViews = boosted ? Math.round(base * 0.55) : 0;
    const views = organicViews + boostViews;
    const rate = 0.12 + rand() * 0.04;
    const orgActions = Math.round(organicViews * rate);
    const boostActions = Math.round(boostViews * rate * 0.8);
    const actions = orgActions + boostActions;
    days.push({
      date, ev, push: PUSHES[i] || null, views, actions, orgActions, boostActions,
      reach: Math.round(views * 2.4), boostImpr: Math.round(boostViews * 4.6),
      saves: Math.round(views * 0.17), follows: Math.round(views * 0.011 + rand() * 2),
      tickets: Math.round(actions * 0.31), directions: Math.round(actions * 0.46),
      likely: Math.round(actions * 0.31), confirmed: Math.round(actions * 0.085),
      spend: boosted ? 18 : 0, openRate: 0.11 + rand() * 0.1,
    });
  }
  let totalFollowers = 4200 + sum(days, 'follows');

  const card = (title, question, body, extra = '') =>
    `<section class="card"${extra}><h2 class="h2">${title}</h2><p class="q">${question}</p>${body}</section>`;

  function render(s) {
    const r = s.range;
    const cur = days.slice(N - r), prev = days.slice(N - 2 * r, N - r);
    const S = (k) => sum(cur, k), P = (k) => sum(prev, k);
    const reach = S('reach') * 0.58, reachP = P('reach') * 0.58;
    const visits = S('likely') + S('confirmed'), visitsP = P('likely') + P('confirmed');

    // Headline cards
    const kpis = kpiCards([
      { label: 'People reached', v: reach, p: reachP, sub: 'unique people who saw you' },
      { label: 'Profile and event views', v: S('views'), p: P('views'), sub: 'venue and event page opens' },
      { label: 'Actions taken', v: S('actions'), p: P('actions'), sub: 'directions, tickets, calls, website' },
      { label: 'Visits from VenueGPS', v: visits, p: visitsP, sub: `${fmt(S('likely'))} likely · ${fmt(S('confirmed'))} confirmed` },
      { label: 'Followers', v: totalFollowers, p: totalFollowers - S('follows'), sub: `+${fmt(S('follows'))} net new` },
    ], s.compare);

    // 1. Funnel
    const steps = [['Reached', reach], ['Viewed', S('views')], ['Saved or followed', S('saves') + S('follows')], ['Took action', S('actions')], ['Visited', visits]];
    const colors = ['#8FCDEF', '#4BB4E6', '#1A9BDB', '#6B3FC9', '#4A2A9E'];
    const funnel = steps.map(([label, v], i) => `<div class="r r-funnel">
      <div style="font-weight:600">${label}</div>
      <div class="track" style="height:28px;border-radius:6px"><div class="fill" style="border-radius:6px;width:${Math.max(6, Math.sqrt(v / steps[0][1]) * 100).toFixed(1)}%;background:${colors[i]}"></div></div>
      <div style="text-align:right"><div style="font-size:14px;font-weight:700">${fmt(v)}</div><div style="font-size:11px;color:var(--muted)">${i === 0 ? 'start' : (v / steps[i - 1][1] * 100).toFixed(1) + '% of above'}</div></div>
    </div>`).join('');

    // 2. Activity over time
    const series = cur.map((d) => d[s.metric]), prevSeries = prev.map((d) => d[s.metric]);
    const ch = lineChart(series, s.compare ? prevSeries : null, s.metric === 'views' ? 100 : 20);
    const marks = cur.map((d, i) => d.ev ? `<span class="dot" title="${esc(d.ev)} · ${day(d.date)}" style="left:${ch.xPct(i)}%;top:${ch.yPct(series[i])}%"></span>` : '').join('')
      + cur.map((d, i) => d.push ? `<span class="tick" title="Push: ${esc(d.push)}" style="left:${ch.xPct(i)}%"></span>` : '').join('');
    const activity = `<div class="row-head"><div><h2 class="h2">2 · Activity over time</h2><p class="q" style="margin-bottom:0">Is it working more this month?</p></div>
      <div class="chips" role="group" aria-label="Metric">${seg('metric', s.metric, [['views', 'Views'], ['actions', 'Actions']])}</div></div>
      <div class="chart"><div class="yaxis"><span>${fmt(ch.max)}</span><span>${fmt(ch.max / 2)}</span><span>0</span></div>
      <div class="plot"><svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Daily ${s.metric} over the last ${r} days">
        <path d="M0 110 H700" stroke="#EEF1F5" fill="none"/><path d="${ch.area}" fill="#1A9BDB" fill-opacity=".12"/>
        ${s.compare ? `<path d="${ch.prev}" fill="none" stroke="#8C95A3" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>` : ''}
        <path d="${ch.line}" fill="none" stroke="#1A9BDB" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>${marks}</div></div>
      <div class="xaxis"><span>${day(cur[0].date)}</span><span>${day(cur[Math.floor(cur.length / 2)].date)}</span><span>${day(cur[cur.length - 1].date)}</span></div>
      <div class="legend"><span><span style="width:14px;height:3px;background:#1A9BDB"></span>This period</span>
        ${s.compare ? '<span><span style="width:14px;border-top:2px dashed #8C95A3"></span>Previous period</span>' : ''}
        <span><span class="sw" style="border-radius:999px;background:#6B3FC9"></span>Event night</span>
        <span><span style="width:2px;height:12px;background:#E2711D"></span>Push sent</span></div>`;

    // 3. Events table
    const evs = cur.filter((d) => d.ev).map((d) => {
      const views = Math.round(d.views * 0.62), saves = Math.round(d.saves * 1.4), tickets = d.tickets + d.directions;
      return { name: d.ev, date: day(d.date).toUpperCase(), views, saves, tickets, rate: tickets / views };
    }).sort((a, b) => b[s.sort] - a[s.sort]);
    const maxV = Math.max(1, ...evs.map((e) => e.views));
    const cols = [['views', 'Views'], ['saves', 'Saves'], ['tickets', 'Tickets + directions'], ['rate', 'View to action']];
    const table = `<div class="scroll"><table style="min-width:520px"><thead><tr><th>Event</th>${cols.map(([k, l]) =>
      `<th class="num" style="padding:4px 2px"><button class="sortbtn" data-set="sort" data-val="${k}" aria-pressed="${k === s.sort}">${l}${k === s.sort ? ' ▼' : ''}</button></th>`).join('')}</tr></thead><tbody>
      ${evs.map((e) => `<tr><td><div style="display:flex;align-items:center;gap:8px"><span class="datetag">${e.date}</span><span style="font-weight:600">${esc(e.name)}</span></div>
        <div class="track" style="margin-top:6px;height:5px;border-radius:3px"><div class="fill" style="border-radius:3px;background:#1A9BDB;width:${(e.views / maxV * 100).toFixed(1)}%"></div></div></td>
        <td class="num" style="font-weight:600">${fmt(e.views)}</td><td class="num">${fmt(e.saves)}</td><td class="num">${fmt(e.tickets)}</td>
        <td class="num" style="font-weight:700;color:#4A2A9E">${(e.rate * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table></div>`;

    // 4. Boosted vs organic
    const size = r === 7 ? 1 : 7, buckets = [];
    for (let end = cur.length; end > 0; end -= size) buckets.unshift(cur.slice(Math.max(0, end - size), end));
    const bmax = Math.max(1, ...buckets.map((b) => sum(b, 'actions')));
    const spend = S('spend'), bImpr = S('boostImpr'), bAct = S('boostActions');
    const stats = [['Boost spend', '$' + fmt(spend)], ['CPM', bImpr ? '$' + (spend / bImpr * 1000).toFixed(2) : 'n/a'],
      ['Cost per action', bAct ? '$' + (spend / bAct).toFixed(2) : 'n/a'], ['Share of actions', (bAct / S('actions') * 100).toFixed(1) + '%']];
    const boost = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:16px">
      ${stats.map(([l, v]) => `<div style="background:#F6F3FD;border-radius:10px;padding:10px 12px"><div style="font-size:11px;font-weight:600;color:#4A2A9E;text-transform:uppercase;letter-spacing:.04em">${l}</div><div style="font-size:20px;font-weight:800">${v}</div></div>`).join('')}</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:170px;border-bottom:1px solid var(--line)">
      ${buckets.map((b) => { const o = sum(b, 'orgActions'), bo = sum(b, 'boostActions');
        return `<div title="${day(b[0].date)}: ${o} organic, ${bo} from boosts" style="flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:2px">
          <div style="height:${(bo / bmax * 100).toFixed(1)}%;background:#6B3FC9;border-radius:4px 4px 0 0"></div><div style="height:${(o / bmax * 100).toFixed(1)}%;background:#8FCDEF"></div></div>`; }).join('')}</div>
      <div style="display:flex;gap:6px;margin-top:6px">${buckets.map((b) => `<div style="flex:1;min-width:0;text-align:center;font-size:10px;color:var(--muted);overflow:hidden;white-space:nowrap">${day(b[0].date)}</div>`).join('')}</div>
      <div class="legend"><span><span class="sw" style="background:#6B3FC9"></span>From boosts</span><span><span class="sw" style="background:#8FCDEF"></span>Organic</span></div>`;

    // 5. Push results
    const pushes = cur.filter((d) => d.push).reverse();
    const push = pushes.length ? `<div class="stack" style="gap:14px">${pushes.map((d) => {
      const sent = Math.round(totalFollowers * 0.82), opened = Math.round(sent * 0.94 * d.openRate), rate = d.openRate * 94;
      return `<div><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;font-size:13px"><span style="font-weight:600">${esc(d.push)}</span>
        <span style="color:var(--muted)">${day(d.date)} · ${fmt(sent)} sent · ${fmt(opened)} opened · <strong style="color:var(--ink)">${fmt(opened * 0.37)} actions</strong></span></div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px"><div class="track" style="flex:1;height:10px"><div class="fill" style="width:${Math.min(100, rate / 25 * 100).toFixed(1)}%;background:#6B3FC9"></div></div>
        <span style="font-size:12px;font-weight:700;min-width:70px;text-align:right">${rate.toFixed(1)}% open</span></div></div>`; }).join('')}</div>`
      : '<p style="font-size:13px;color:var(--muted)">No pushes were sent in this period.</p>';

    // 6. Audience origin
    const cities = [['Miami', 0.58, '#1A9BDB'], ['Orlando', 0.08, '#6B3FC9'], ['New York', 0.07, '#6B3FC9'], ['Tampa', 0.05, '#6B3FC9'], ['Atlanta', 0.04, '#6B3FC9'], ['Toronto', 0.03, '#6B3FC9'], ['Other cities', 0.15, '#8C95A3']];
    const audience = `<div style="display:flex;height:34px;border-radius:8px;overflow:hidden;margin-bottom:8px;color:#fff;font-size:13px;font-weight:700">
      <div style="width:58%;background:#1A9BDB;display:flex;align-items:center;padding-left:12px;white-space:nowrap">Locals 58%</div>
      <div style="width:42%;background:#6B3FC9;display:flex;align-items:center;padding-left:12px;white-space:nowrap">Out of town 42%</div></div>
      <p style="margin:0 0 14px;font-size:12px;color:var(--muted)">Locals live in the Miami metro area. Out-of-town viewers are mostly weekend travelers.</p>
      <div class="stack" style="gap:8px">${cities.map(([n, sh, c]) => { const v = reach * sh;
        return `<div class="r r-city"><span style="font-weight:600">${n}</span><div class="track" style="height:12px"><div class="fill" style="width:${(sh / 0.58 * 100).toFixed(1)}%;background:${c}"></div></div><span style="text-align:right;color:var(--muted)">${v < 10 ? 'fewer than 10' : fmt(v)}</span></div>`; }).join('')}</div>`;

    // 7. Heatmap
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], dayF = [0.6, 0.65, 0.78, 1.0, 1.35, 1.45, 0.85];
    const slotF = [0.2, 0.35, 0.3, 0.45, 0.8, 1.0, 0.9, 0.55], slots = ['10a', '12p', '2p', '4p', '6p', '8p', '10p', '12a'];
    const scale = S('views') / 1450 / 8;
    const heat = `<div class="scroll"><div style="min-width:420px;display:flex;flex-direction:column;gap:4px">
      <div class="grid8"><span></span>${slots.map((x) => `<span class="ghead">${x}</span>`).join('')}</div>
      ${dayNames.map((dn, di) => `<div class="grid8"><span style="font-size:12px;font-weight:600">${dn}</span>${slotF.map((sf, si) => { const v = dayF[di] * sf / 1.45;
        return `<span class="cell" title="${dn} ${slots[si]}: about ${fmt(v * scale * 100)} views" style="background:rgba(26,155,219,${(0.07 + 0.93 * v).toFixed(2)})"></span>`; }).join('')}</div>`).join('')}
      </div></div><div class="tip" style="background:#EAF6FD"><strong>Peak:</strong> Saturday 8 to 10 pm. <strong>Best time to push:</strong> Thursday and Friday around 6 pm, two hours before the evening peak.</div>`;

    // 8. Benchmark
    const bench = `<div class="stack" style="gap:14px">${[['Views', 142], ['Actions', 128], ['Follower growth', 111], ['View-to-action rate', 92], ['Push open rate', 118]].map(([l, v]) =>
      `<div class="r r-bench"><span style="font-weight:600">${l}</span><div style="position:relative;height:16px;background:var(--track);border-radius:4px">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(v, 200) / 2}%;background:${v >= 100 ? '#1A9BDB' : '#E2711D'};border-radius:4px"></div>
        <div style="position:absolute;left:50%;top:-4px;bottom:-4px;width:2px;background:var(--ink)"></div></div>
        <span style="font-weight:800;text-align:right">${v}</span></div>`).join('')}</div>
      <p class="note">The black line marks the city median. Compared against 38 rooftop bars and lounges in Miami. Blue is above the median, orange below.</p>`;

    // Proof of visits
    const proof = [['Intent', 'Planned to come', S('tickets') + S('directions'), 'Tapped Get Directions, a ticket link or Call in VenueGPS.', '#8FCDEF'],
      ['Estimated', 'Likely visited', S('likely'), 'Viewed or saved you, then was at your venue within 7 days. Opted-in location only.', '#1A9BDB'],
      ['Verified', 'Confirmed visit', S('confirmed'), 'Redeemed your VenueGPS door offer, QR check-in or a ticket scanned at the door.', '#6B3FC9']]
      .map(([lv, lb, v, how, c]) => `<div style="border:1px solid var(--line);border-top:5px solid ${c};border-radius:12px;padding:16px">
        <div class="l" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">${lv}</div>
        <div style="font-size:18px;font-weight:700;margin-top:2px">${lb}</div><div style="font-size:30px;font-weight:800;margin:6px 0">${fmt(v)}</div>
        <div style="font-size:12px;color:var(--muted)">${how}</div></div>`).join('');

    return `${header('venue', ['Home', 'Map view', 'My venue', 'Campaigns', 'Insights'], 'Insights')}
    <main>
      <section class="card hero"><div class="ribbon">BOOST ACTIVE</div>
        <div style="display:flex;align-items:center;gap:16px;min-width:0">
          <div style="width:64px;height:64px;border-radius:12px;background:#6B3FC9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0">SR</div>
          <div style="min-width:0"><div class="eyebrow">Venue Insights</div><h1>Skyline Rooftop Bar</h1>
            <div class="tags"><span class="ht">#Bar</span><span class="ht">#Rooftop</span><span class="ht">#Nightlife</span><span class="mt">Brickell, Miami · Business Pro plan</span></div></div></div>
        <div class="controls with-ribbon"><div class="seg" role="group" aria-label="Date range">${seg('range', r, [[7, '7 days'], [30, '30 days'], [90, '90 days']])}</div>
          ${compareToggle(s.compare)}<span class="sample">Sample data</span></div>
      </section>
      <section class="kpis" aria-label="Headline numbers">${kpis}</section>
      <div class="grid2">
        ${card('1 · VenueGPS impact funnel', 'How many people did VenueGPS bring you?', `<div class="stack">${funnel}</div><p class="note">Bars use a square-root scale so the later steps stay readable. The percentage is the conversion from the step above.</p>`)}
        <section class="card">${activity}</section>
        ${card('3 · Event performance', 'Which events pulled the crowd? Select a column to sort.', table)}
        ${card('4 · Boosted vs organic', `Was the boost money worth it? Actions per ${size === 1 ? 'day' : 'week'}.`, boost)}
        ${card('5 · Push notification results', 'Did your push bring people? Actions are counted within 24 hours of opening.', push)}
        ${card('6 · Where your audience comes from', "Locals or tourists? Viewers' home city, from onboarding.", audience)}
        ${card('7 · When people look at you', 'When should you post or push? Views by day and local time.', heat)}
        ${card('8 · You vs similar venues', 'Am I doing well? 100 is the median rooftop bar in Miami.', bench)}
      </div>
      ${card('People who came because of VenueGPS', 'Three levels of proof, labelled and never added together.', `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">${proof}</div>`)}
      <footer class="foot"><span>Venues see counts, never people. Any group under 10 users shows as "fewer than 10". Location is shown at city level only.</span><span>Sample data · refreshes daily in the real product</span></footer>
    </main>`;
  }

  mount({ range: 30, compare: true, metric: 'views', sort: 'views' }, render);
})();
