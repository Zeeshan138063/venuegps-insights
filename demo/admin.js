// VenueGPS team dashboard demo. All numbers are generated sample data.
(() => {
  const { fmt, money, sum, day, rng, header, kpiCards, seg, compareToggle, lineChart, mount } = V;

  const N = 180;
  const rand = rng(4242);
  const today = new Date(2026, 9, 24);
  const days = [];
  for (let i = 0; i < N; i++) {
    const date = new Date(today); date.setDate(today.getDate() - (N - 1 - i));
    const dowF = [0.95, 0.78, 0.8, 0.86, 1.02, 1.3, 1.34][date.getDay()];
    const dau = Math.round((9000 + i * 26) * dowF * (0.92 + rand() * 0.16));
    days.push({ date, dau, signups: Math.round(dau * (0.04 + rand() * 0.012)), venues: 1100 + i * 1.05, paid: 268 + i * 0.25,
      boostRev: 520 + i * 3.1 + rand() * 180, pushRev: 140 + i * 0.9 + rand() * 60 });
  }

  const card = (title, question, body) =>
    `<section class="card"><h2 class="h2">${title}</h2><p class="q">${question}</p>${body}</section>`;
  const badge = (text, cls) => `<span class="badge ${cls}">${text}</span>`;

  function render(s) {
    const r = s.range;
    const cur = days.slice(N - r), prev = days.slice(N - 2 * r, N - r);
    const last = cur[cur.length - 1], lastP = prev[prev.length - 1];
    const months = r / 30, sc = r / 30;

    const k = { 7: 2.4, 30: 4.6, 90: 7.2 }[r];
    const avg = (a) => sum(a, 'dau') / a.length;
    const mrr = (d) => d.paid * 142 + 2940 * 4.99 + 6100 * 0.99;
    const kpis = kpiCards([
      { label: 'Active users', v: avg(cur) * k, p: avg(prev) * k, sub: 'unique, in the period' },
      { label: 'New sign-ups', v: sum(cur, 'signups'), p: sum(prev, 'signups'), sub: 'finished onboarding' },
      { label: 'Live venues', v: last.venues, p: lastP.venues, sub: 'claimed or listed' },
      { label: 'Paying venues', v: last.paid, p: lastP.paid, sub: 'on a business plan' },
      { label: 'MRR', v: mrr(last), p: mrr(lastP), text: money(mrr(last)), sub: 'subscriptions only' },
      { label: 'Venue churn', v: 3.1, p: 3.6, text: '3.1%', sub: 'monthly, business plans', invert: true },
    ], s.compare);

    // Growth chart
    const series = cur.map((d) => d[s.metric]), prevSeries = prev.map((d) => d[s.metric]);
    const ch = lineChart(series, s.compare ? prevSeries : null, s.metric === 'dau' ? 2000 : 100);
    const growth = `<div class="row-head"><div><h2 class="h2">Growth</h2><p class="q" style="margin-bottom:0">Is the app growing?</p></div>
      <div class="chips" role="group" aria-label="Metric">${seg('metric', s.metric, [['dau', 'Daily active users'], ['signups', 'Sign-ups']])}</div></div>
      <div class="chart"><div class="yaxis" style="min-width:48px"><span>${fmt(ch.max)}</span><span>${fmt(ch.max / 2)}</span><span>0</span></div>
      <div class="plot"><svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="${s.metric === 'dau' ? 'Daily active users' : 'Daily sign-ups'} over the last ${r} days">
        <path d="M0 110 H700" stroke="#EEF1F5" fill="none"/><path d="${ch.area}" fill="#6B3FC9" fill-opacity=".10"/>
        ${s.compare ? `<path d="${ch.prev}" fill="none" stroke="#8C95A3" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>` : ''}
        <path d="${ch.line}" fill="none" stroke="#6B3FC9" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div></div>
      <div class="xaxis" style="margin-left:56px"><span>${day(cur[0].date)}</span><span>${day(cur[Math.floor(cur.length / 2)].date)}</span><span>${day(last.date)}</span></div>
      <div class="legend"><span><span style="width:14px;height:3px;background:#6B3FC9"></span>This period</span>${s.compare ? '<span><span style="width:14px;border-top:2px dashed #8C95A3"></span>Previous period</span>' : ''}</div>`;

    // Revenue mix
    const rev = [['Business plans', last.paid * 142 * months, '#6B3FC9', '$95 to $239 a month'], ['Boosts', sum(cur, 'boostRev'), '#1A9BDB', 'pay per campaign'],
      ['Push triggers', sum(cur, 'pushRev'), '#8FCDEF', 'paid extra triggers'], ['Premium', 2940 * 4.99 * months, '#4A2A9E', '$4.99 a month'], ['Standard', 6100 * 0.99 * months, '#B9A6E8', '$0.99 a month']];
    const total = rev.reduce((a, x) => a + x[1], 0);
    const revenue = `<div style="display:flex;height:26px;border-radius:8px;overflow:hidden;margin-bottom:18px">${rev.map(([l, v, c]) => `<div title="${l}" style="width:${(v / total * 100).toFixed(2)}%;background:${c}"></div>`).join('')}</div>
      <div class="stack">${rev.map(([l, v, c, n]) => `<div class="r r-rev"><span class="sw" style="width:12px;height:12px;border-radius:3px;background:${c}"></span>
        <span><strong>${l}</strong> <span style="color:var(--muted)">${n}</span></span><span style="font-weight:700">${money(v)}</span><span style="text-align:right;color:var(--muted)">${(v / total * 100).toFixed(0)}%</span></div>`).join('')}</div>
      <div class="tip" style="background:#F6F3FD"><strong>Total:</strong> ${money(total)}. Venue SaaS metrics (MRR, churn, ARPU) live here, not on venue dashboards.</div>`;

    // Onboarding funnel
    const steps = ['Welcome', 'Verify', 'Create password', 'Tell us about yourself', 'Personalize profile', 'Location', 'Milestones', 'Interests', 'Profile ready'];
    const curves = { mobile: [1, 0.74, 0.71, 0.66, 0.6, 0.55, 0.42, 0.4, 0.38], desktop: [1, 0.82, 0.79, 0.74, 0.69, 0.66, 0.56, 0.54, 0.52] };
    const curve = curves[s.platform];
    const finished = sum(cur, 'signups') * (s.platform === 'mobile' ? 0.78 : 0.22);
    const starts = finished / curve[8];
    const worst = [];
    const onb = steps.map((st, i) => {
      const drop = i ? 1 - curve[i] / curve[i - 1] : 0;
      if (drop > 0.1) worst.push(`${st} (${(drop * 100).toFixed(0)}% leave)`);
      return `<div class="r r-onb"><span style="color:var(--muted);font-size:12px">${i + 1}</span><span style="font-weight:600">${st}</span>
        <div class="track" style="height:18px;border-radius:4px"><div class="fill" style="border-radius:4px;width:${(curve[i] * 100).toFixed(1)}%;background:${drop > 0.1 ? '#E2711D' : '#1A9BDB'}"></div></div>
        <span style="text-align:right"><strong>${fmt(starts * curve[i])}</strong> <span style="font-size:11px;font-weight:700;color:${drop > 0.1 ? '#A8410F' : 'var(--muted)'}">${i ? '-' + (drop * 100).toFixed(0) + '%' : ''}</span></span></div>`;
    }).join('');
    const onboarding = `<div class="row-head"><div><h2 class="h2">Onboarding funnel</h2><p class="q" style="margin-bottom:0">Which of the 9 new screens loses people?</p></div>
      <div class="chips" role="group" aria-label="Platform">${seg('platform', s.platform, [['mobile', 'Mobile'], ['desktop', 'Desktop']])}</div></div>
      <div class="stack" style="gap:7px;margin-top:16px">${onb}</div>
      <div class="tip" style="background:#FDF1E8"><strong>Biggest drops:</strong> ${worst.join(', ') || 'none over 10%'}. Orange bars lose more than 10% of users.</div>`;

    // Business funnel
    const claims = Math.round(13.7 * r);
    const bf = [['Claim submitted', 1], ['Claim approved', 0.77], ['First event posted', 0.59], ['First boost or trigger', 0.24]];
    const biz = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">${bf.map(([l, f], i) => `<div style="border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;min-height:30px">${l}</div><div style="font-size:26px;font-weight:800">${fmt(claims * f)}</div>
        <div style="height:70px;display:flex;align-items:flex-end;background:#F4F6F9;border-radius:6px"><div style="width:100%;height:${(f * 100).toFixed(0)}%;background:${i === 3 ? '#6B3FC9' : '#1A9BDB'};border-radius:6px"></div></div>
        <div style="font-size:12px;color:var(--muted)">${i === 0 ? 'in the period' : (f / bf[i - 1][1] * 100).toFixed(0) + '% of previous step'}</div></div>`).join('')}</div>
      <div style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
        <div style="background:#EAF6FD;border-radius:10px;padding:12px"><div style="font-size:11px;font-weight:700;color:#0E5A88;text-transform:uppercase">Median claim to approval</div><div style="font-size:20px;font-weight:800">1.8 days</div></div>
        <div style="background:#EAF6FD;border-radius:10px;padding:12px"><div style="font-size:11px;font-weight:700;color:#0E5A88;text-transform:uppercase">Venues opening Insights</div><div style="font-size:20px;font-weight:800">64% <span style="font-size:12px;font-weight:600;color:var(--muted)">monthly</span></div></div></div>`;

    // Content supply
    const cityRows = [['Miami', 412, 388, 121], ['Orlando', 236, 214, 58], ['Tampa', 158, 176, 39], ['Atlanta', 119, 151, 31], ['New York', 74, 132, 19], ['Austin', 31, 64, 8]];
    const supply = `<div class="scroll"><table style="min-width:440px"><thead><tr><th>City</th><th class="num">Live events</th><th class="num">Active venues</th><th class="num">Paying</th><th class="num">Status</th></tr></thead><tbody>
      ${cityRows.map(([n, e, v, p]) => { const thin = e / v < 0.8;
        return `<tr><td style="font-weight:600">${n}</td><td class="num">${fmt(e * (0.6 + 0.4 * sc))}</td><td class="num">${fmt(v)}</td><td class="num">${fmt(p)}</td><td class="num">${badge(thin ? 'Thin' : 'Healthy', thin ? 'down' : 'up')}</td></tr>`; }).join('')}</tbody></table></div>`;

    // Placements
    const pl = [['explore', 2.9e6, 3.1], ['search', 1.4e6, 6.8], ['map', 2.2e6, 2.4], ['home_banner', 1.1e6, 1.9], ['boost_slot', 0.8e6, 4.6], ['event_detail', 0.6e6, 9.2], ['push', 0.35e6, 12.4]];
    const placements = `<div class="stack">${pl.map(([n, imp, ctr]) => `<div class="r r-place"><code style="font-size:12px;background:#F4F6F9;padding:3px 6px;border-radius:4px">${n}</code>
        <div class="track" style="height:14px"><div class="fill" style="width:${(imp / 2.9e6 * 100).toFixed(1)}%;background:#1A9BDB"></div></div>
        <span class="impr" style="text-align:right;color:var(--muted)">${fmt(imp * sc)}</span><span style="text-align:right;font-weight:800;color:#4A2A9E">${ctr.toFixed(1)}%</span></div>`).join('')}</div>
      <p class="note">The bar shows impressions, and the purple number is the click-through rate.</p>`;

    // Cohorts
    const cw = [['Sep 14', [100, 46, 38, 33, 30, 28]], ['Sep 21', [100, 48, 39, 34, 31, null]], ['Sep 28', [100, 51, 41, 36, null, null]], ['Oct 5', [100, 49, 40, null, null, null]], ['Oct 12', [100, 53, null, null, null, null]], ['Oct 19', [100, null, null, null, null, null]]];
    const cohorts = `<div class="scroll"><div style="min-width:420px;display:flex;flex-direction:column;gap:4px">
      <div class="grid6"><span class="ghead" style="text-align:left">Sign-up week</span>${[0, 1, 2, 3, 4, 5].map((w) => `<span class="ghead">Wk ${w}</span>`).join('')}</div>
      ${cw.map(([w, vals]) => `<div class="grid6"><span style="font-size:12px;font-weight:600">${w}</span>${vals.map((v) => v === null ? '<span class="cell" style="background:#F4F6F9"></span>'
        : `<span class="cell" style="background:rgba(107,63,201,${(0.1 + v / 100 * 0.9).toFixed(2)});color:${v > 45 ? '#fff' : 'var(--ink)'}">${v}%</span>`).join('')}</div>`).join('')}</div></div>`;

    // Acquisition
    const su = sum(cur, 'signups');
    const src = [['Organic search', 31, 34], ['Instagram', 24, 27], ['TikTok', 19, 18], ['Referral', 11, 41], ['Paid social', 9, 15], ['Direct', 6, 38]];
    const acquisition = `<div class="stack">${src.map(([n, sh, ret]) => `<div class="r r-src"><span style="font-weight:600">${n}</span>
        <div class="track" style="height:14px"><div class="fill" style="width:${(sh / 31 * 100).toFixed(1)}%;background:#6B3FC9"></div></div>
        <span style="text-align:right">${fmt(su * sh / 100)}</span><span style="text-align:right;font-weight:700;color:${ret >= 30 ? '#13703F' : ret < 20 ? '#A8410F' : 'var(--ink)'}">${ret}%</span></div>`).join('')}</div>
      <p class="note">The right-hand column is the share still active after 4 weeks.</p>`;

    // Churn risk
    const rk = [['Bayside Taco Co.', '#Restaurant', 'Miami', 'Business Starter', 41, -38, '34 days ago', 'Call: set up a door offer', 'High'],
      ['The Velvet Room', '#Lounge', 'Atlanta', 'Business Pro', 66, -29, 'Never', 'Book an Insights walkthrough', 'High'],
      ['Nova Club', '#Nightclub', 'New York', 'Business Pro', 88, -22, '19 days ago', 'Suggest a weekend boost', 'High'],
      ['Coral Cafe', '#Cafe', 'Tampa', 'Business Starter', 57, -12, '9 days ago', 'Send tips on posting events', 'Medium'],
      ['Harbor Beer Hall', '#Bar', 'Miami', 'Business Plus', 132, -9, '3 days ago', 'Offer one free push trigger', 'Medium'],
      ['Lumen Lounge', '#Lounge', 'Orlando', 'Business Plus', 104, 4, '12 days ago', 'Check in at renewal', 'Low']];
    const riskCls = { High: 'down', Medium: 'warn', Low: 'up' };
    const risk = `<div class="scroll"><table style="min-width:760px"><thead><tr><th>Venue</th><th>Plan</th><th class="num">Actions, 30 days</th><th class="num">vs previous 30</th><th>Last opened Insights</th><th>Suggested step</th><th class="num">Risk</th></tr></thead><tbody>
      ${rk.map(([n, t, c, p, a, chg, o, nx, rs]) => `<tr><td><div style="font-weight:700;text-transform:uppercase;font-size:12px">${n}</div><div style="font-size:12px;color:var(--blue-dark);font-weight:600">${t} <span style="color:var(--muted);font-weight:400">· ${c}</span></div></td>
        <td>${p}</td><td class="num" style="font-weight:600">${a}</td><td class="num" style="font-weight:700;color:${chg < 0 ? '#A8410F' : '#13703F'}">${chg > 0 ? '▲ ' : '▼ '}${Math.abs(chg)}%</td>
        <td>${o}</td><td style="color:var(--muted)">${nx}</td><td class="num">${badge(rs, riskCls[rs])}</td></tr>`).join('')}</tbody></table></div>`;

    return `${header('admin', ['Overview', 'Venues', 'Users', 'Campaigns', 'Revenue'], 'Overview', 'TEAM')}
    <main>
      <section class="card hero"><div><div class="eyebrow">Internal · all users, all venues</div><h1>Team dashboard</h1>
          <div class="tags"><span class="ht">#Growth</span><span class="ht">#Revenue</span><span class="ht">#VenueHealth</span><span class="mt">GA4 + Firebase, BigQuery export and billing data</span></div></div>
        <div class="controls"><div class="seg" role="group" aria-label="Date range">${seg('range', r, [[7, '7 days'], [30, '30 days'], [90, '90 days']])}</div>
          ${compareToggle(s.compare)}<span class="sample">Sample data</span></div></section>
      <section class="kpis" aria-label="Headline numbers">${kpis}</section>
      <div class="grid2">
        <section class="card">${growth}</section>
        ${card('Revenue mix', 'Where the money comes from, for the selected period.', revenue)}
        <section class="card">${onboarding}</section>
        ${card('Business funnel', 'Where does venue onboarding stall?', biz)}
        ${card('Content supply by city', 'Which cities are thin and need sales effort?', supply)}
        ${card('Explore and ad placements', 'Which slots should be priced higher?', placements)}
        ${card('Retention cohorts', 'Do users come back after their first weekend? Share of each sign-up week still active.', cohorts)}
        ${card('Acquisition', 'Which channels bring users who stay?', acquisition)}
      </div>
      <section class="card"><div class="row-head"><div><h2 class="h2">Venue health: churn risk</h2><p class="q">Paying venues getting little value. This is the success team's call list for the week.</p></div>
        ${badge(rk.filter((x) => x[8] === 'High').length + ' venues at high risk', 'down')}</div>${risk}</section>
      <footer class="foot"><span>Built from the GA4 BigQuery export, backend events and billing. Visible to the VenueGPS team only.</span><span>Sample data · refreshes daily in the real product</span></footer>
    </main>`;
  }

  mount({ range: 30, compare: true, metric: 'dau', platform: 'mobile' }, render);
})();
