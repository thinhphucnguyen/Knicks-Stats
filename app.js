// Knicks stats demo. No libraries, just SVG + a bit of DOM.

const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- data ----------
const KEYS = ["name", "pos", "gp", "gs", "min", "pts", "reb", "ast", "stl", "blk", "tov",
              "fgp", "tpp", "ftp", "fgm", "fga", "tpm", "tpa", "ftm", "fta"];
const players = SNAPSHOT.rows.map(r => {
  const p = {};
  KEYS.forEach((k, i) => (p[k] = r[i]));
  p.last = p.name.split(" ").pop();
  p.total = p.pts * p.gp;                                                   // season points
  p.ts = p.fga + p.fta ? (p.pts / (2 * (p.fga + 0.44 * p.fta))) * 100 : 0;  // true shooting %
  p.use = p.fga + 0.44 * p.fta + p.tov;                                     // shot-ending possessions / game
  p.stocks = p.stl + p.blk;
  return p;
});
const teamTotal = players.reduce((s, p) => s + p.total, 0);
const rotation = players.filter(p => p.gp >= 5 && p.min >= 10);
let current = players[0];

const nick = n => (/Trail Blazers$/.test(n) ? "Trail Blazers" : n.split(" ").pop());
const fmtPct = x => (x >= 0.995 ? ">99%" : x > 0 && x < 0.005 ? "<1%" : (x * 100).toFixed(x < 0.1 ? 1 : 0) + "%");

// ---------- header ----------
$("rec").textContent = `${SNAPSHOT.record.w}–${SNAPSHOT.record.l}`;
$("next").textContent = SNAPSHOT.next;
$("asof").textContent = `${SNAPSHOT.source} · as of ${SNAPSHOT.asOf}`;

// ---------- tooltip ----------
const tip = $("tip");
function showTip(e, html) {
  tip.innerHTML = html;
  tip.classList.add("on");
  const w = tip.offsetWidth;
  tip.style.left = Math.min(e.clientX + 14, innerWidth - w - 8) + "px";
  tip.style.top = e.clientY + 16 + "px";
}
const hideTip = () => tip.classList.remove("on");

// ---------- roster tiles (equal boxes) ----------
const tileEls = new Map();
players.forEach(p => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tile";
  b.innerHTML = `<b>${NUMBERS[p.name]}</b><span>${esc(p.last)}</span><i>${p.pts.toFixed(1)} ppg</i>`;
  b.onclick = () => {
    select(p);
    $("card").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  b.onmousemove = e => showTip(e, `<b>${esc(p.name)}</b><br>${p.gp} games · ${p.min.toFixed(1)} min`);
  b.onmouseleave = hideTip;
  $("tiles").appendChild(b);
  tileEls.set(p, b);
});

// ---------- generic bar list ----------
// items: { rank, label, sub, value, text, hot, onclick }
function barList(el, items) {
  const max = Math.max(...items.filter(i => !i.gap).map(i => i.value), 0.0001);
  el.innerHTML = items.map((it, n) => it.gap
    ? `<div class="bgap">${it.gap}</div>`
    : `<div class="brow${it.hot ? " hot" : ""}" data-i="${n}">
         <span class="rk">${it.rank ?? ""}</span>
         <span class="nm">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span>
         <div class="track"><div class="fill" style="width:${Math.max(1, (it.value / max) * 100)}%"></div></div>
         <span class="v">${it.text}</span>
       </div>`).join("");
  el.querySelectorAll(".brow").forEach(r => {
    const it = items[+r.dataset.i];
    if (it.onclick) { r.style.cursor = "pointer"; r.onclick = it.onclick; }
  });
}

// ---------- leaderboard (animated re-sort) ----------
const ROW = 36;
const STATS = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tpm", label: "3PM" },
  { key: "min", label: "MIN" },
  { key: "fgp", label: "FG%", ok: p => p.gp >= 5 && p.fga >= 4, note: "Min. 5 games and 4 FGA per game to qualify" },
  { key: "tpp", label: "3P%", ok: p => p.gp >= 5 && p.tpa >= 2, note: "Min. 5 games and 2 3PA per game to qualify" },
  { key: "ts",  label: "TS%", ok: p => p.gp >= 5 && p.fga >= 4, note: "Min. 5 games and 4 FGA per game to qualify" }
];
let stat = STATS[0];

const board = $("board");
board.style.height = players.length * ROW + "px";
const rows = new Map();

players.forEach(p => {
  const r = document.createElement("div");
  r.className = "row";
  r.innerHTML = `<span class="rk"></span><span class="nm">${esc(p.name)}</span>
                 <div class="track"><div class="fill"></div></div><span class="v"></span>`;
  r.onclick = () => {
    select(p);
    // single-column layout: bring the card into view
    if (innerWidth <= 900) $("card").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  board.appendChild(r);
  rows.set(p, r);
});

STATS.forEach(s => {
  const b = document.createElement("button");
  b.className = "chip";
  b.textContent = s.label;
  b.onclick = () => { stat = s; renderBoard(); };
  s.btn = b;
  $("chips").appendChild(b);
});

function renderBoard() {
  const ok = stat.ok || (() => true);
  const sorted = [...players].sort((a, b) => (ok(b) - ok(a)) || (b[stat.key] - a[stat.key]));
  const max = Math.max(...players.filter(ok).map(p => p[stat.key]));
  sorted.forEach((p, i) => {
    const r = rows.get(p);
    const v = p[stat.key];
    r.style.transform = `translateY(${i * ROW}px)`;
    r.classList.toggle("dim", !ok(p));
    r.querySelector(".rk").textContent = ok(p) ? i + 1 : "";
    r.querySelector(".fill").style.width = Math.min(100, (v / max) * 100) + "%";
    r.querySelector(".v").textContent = v.toFixed(1);
  });
  STATS.forEach(s => s.btn.classList.toggle("on", s === stat));
  $("boardNote").textContent = stat.note || "";
}

// ---------- player card ----------
// radar axes: each is scaled against the best rotation player on the team
const AXES = [
  { l: "PTS",       v: p => p.pts },
  { l: "REB",       v: p => p.reb },
  { l: "AST",       v: p => p.ast },
  { l: "Stl + Blk", v: p => p.stocks },
  { l: "3PM",       v: p => p.tpm },
  { l: "TS%",       v: p => p.ts, lo: 40, hi: 70 }
];
AXES.forEach(a => {
  a.lo = a.lo || 0;
  a.hi = a.hi || Math.max(...rotation.map(a.v));
});
const norm = p => AXES.map(a => Math.max(0.03, Math.min(1, (a.v(p) - a.lo) / (a.hi - a.lo))));

const CX = 150, CY = 140, R = 100;
const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
const pt = (i, f) => [CX + Math.cos(ang(i)) * R * f, CY + Math.sin(ang(i)) * R * f];
const poly = vals => vals.map((f, i) => pt(i, f).join(",")).join(" ");

const radar = $("radar");
[0.25, 0.5, 0.75, 1].forEach(f => svg("polygon", { class: "ring", points: poly(AXES.map(() => f)) }, radar));
AXES.forEach((a, i) => {
  const [x, y] = pt(i, 1);
  svg("line", { class: "axis", x1: CX, y1: CY, x2: x, y2: y }, radar);
  const [tx, ty] = pt(i, 1.17);
  const t = svg("text", { x: tx, y: ty + 4, "text-anchor": Math.abs(tx - CX) < 5 ? "middle" : tx > CX ? "start" : "end" }, radar);
  t.textContent = a.l;
});
const shape = svg("polygon", { class: "shape", points: poly(AXES.map(() => 0.03)) }, radar);
let radarVals = AXES.map(() => 0.03), tweenId = 0;

function tweenRadar(to) {
  const from = radarVals, id = ++tweenId, t0 = performance.now();
  (function step(t) {
    if (id !== tweenId) return;
    const k = Math.min(1, (t - t0) / 550);
    const e = 1 - Math.pow(1 - k, 3);
    radarVals = from.map((a, i) => a + (to[i] - a) * e);
    shape.setAttribute("points", poly(radarVals));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// three half-circle gauges
const gaugeEls = {};
[["fg", "FG%"], ["tp", "3P%"], ["ft", "FT%"]].forEach(([id, label]) => {
  const d = document.createElement("div");
  d.className = "gauge";
  d.innerHTML = `<svg viewBox="0 0 100 62">
      <path class="trk" d="M10 56 A40 40 0 0 1 90 56" pathLength="100"/>
      <path class="arc" d="M10 56 A40 40 0 0 1 90 56" pathLength="100" stroke-dasharray="0 100"/>
      <text class="val" x="50" y="52"></text></svg>
      <div class="cap">${label}<br><b></b></div>`;
  $("gauges").appendChild(d);
  gaugeEls[id] = d;
});
function setGauge(id, pct, made, att) {
  const g = gaugeEls[id];
  g.querySelector(".arc").setAttribute("stroke-dasharray", `${att ? pct : 0} 100`);
  g.querySelector(".val").textContent = att ? Math.round(pct) : "–";
  g.querySelector(".cap b").textContent = `${made.toFixed(1)} / ${att.toFixed(1)}`;
}

function select(p) {
  current = p;
  const posName = { G: "Guard", F: "Forward", C: "Center" }[p.pos];
  const num = NUMBERS[p.name];
  $("jNum").textContent = num;
  $("jNum").style.fontSize = num.length > 1 ? "44px" : "56px";
  $("cName").textContent = p.name;
  $("cSub").textContent = `${posName}  ·  ${p.gp} games  ·  ${p.gs} starts  ·  ${p.min.toFixed(1)} min`;
  $("bPts").textContent = p.pts.toFixed(1);
  $("bReb").textContent = p.reb.toFixed(1);
  $("bAst").textContent = p.ast.toFixed(1);

  tweenRadar(norm(p));
  setGauge("fg", p.fgp, p.fgm, p.fga);
  setGauge("tp", p.tpp, p.tpm, p.tpa);
  setGauge("ft", p.ftp, p.ftm, p.fta);

  // scoring mix, built from makes
  const two = (p.fgm - p.tpm) * 2, three = p.tpm * 3, ft = p.ftm, sum = two + three + ft;
  const pc = v => (sum ? (v / sum) * 100 : 0);
  const [m2, m3, mf] = $("mix").children;
  m2.style.width = pc(two) + "%";
  m3.style.width = pc(three) + "%";
  mf.style.width = pc(ft) + "%";
  $("k2").textContent = sum ? pc(two).toFixed(0) + "%" : "–";
  $("k3").textContent = sum ? pc(three).toFixed(0) + "%" : "–";
  $("kf").textContent = sum ? pc(ft).toFixed(0) + "%" : "–";

  const mini = [["Steals", p.stl], ["Blocks", p.blk], ["Turnovers", p.tov], ["True shooting", p.ts], ["Possessions", p.use], ["Season pts", p.total]];
  $("mini").innerHTML = mini.map(([l, v]) => `<div><b>${l === "Season pts" ? Math.round(v) : v.toFixed(1)}</b><span class="label">${l}</span></div>`).join("");

  // highlight everywhere
  rows.forEach((r, q) => r.classList.toggle("sel", q === p));
  tileEls.forEach((t, q) => t.classList.toggle("sel", q === p));
  dots.forEach((d, q) => d.classList.toggle("sel", q === p));
  labels.forEach((l, q) => (l.style.display = q === p || q.min >= 24 ? "" : "none"));
  renderDist();
}

// ---------- where the points come from ----------
function renderDist() {
  const sorted = [...players].filter(p => p.total > 0).sort((a, b) => b.total - a.total);
  const items = sorted.slice(0, 10).map((p, i) => ({
    rank: i + 1, label: p.name, value: p.total,
    text: `${(p.total / teamTotal * 100).toFixed(0)}%`, hot: p === current,
    onclick: () => select(p)
  }));
  const rest = sorted.slice(10).reduce((s, p) => s + p.total, 0);
  items.push({ label: "Rest of roster", value: rest, text: `${(rest / teamTotal * 100).toFixed(0)}%`, hot: sorted.indexOf(current) >= 10 });
  barList($("distList"), items);
  $("distNote").textContent = `${Math.round(teamTotal).toLocaleString()} pts · ${SNAPSHOT.record.w + SNAPSHOT.record.l} games`;
}

// ---------- scatter: volume vs efficiency ----------
const W = 700, H = 420, M = { l: 52, r: 58, t: 14, b: 46 };
const X0 = 2, X1 = 28, Y0 = 30, Y1 = 70;
const sx = v => M.l + ((v - X0) / (X1 - X0)) * (W - M.l - M.r);
const sy = v => H - M.b - ((v - Y0) / (Y1 - Y0)) * (H - M.t - M.b);
const sc = $("scatter");

for (let y = 30; y <= 70; y += 10) {
  svg("line", { class: "grid-l", x1: M.l, x2: W - M.r, y1: sy(y), y2: sy(y) }, sc);
  svg("text", { class: "tick", x: M.l - 8, y: sy(y) + 4, "text-anchor": "end" }, sc).textContent = y + "%";
}
for (let x = 4; x <= 28; x += 4) {
  svg("text", { class: "tick", x: sx(x), y: H - M.b + 18, "text-anchor": "middle" }, sc).textContent = x;
}
svg("text", { class: "axt", x: (M.l + W - M.r) / 2, y: H - 6, "text-anchor": "middle" }, sc).textContent = "Shot-ending possessions per game →";
svg("text", { class: "axt", transform: `translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`, "text-anchor": "middle" }, sc).textContent = "True shooting % →";

// team line
const teamTS = (SNAPSHOT.teamPts / (2 * (SNAPSHOT.teamFga + 0.44 * SNAPSHOT.teamFta))) * 100;
svg("line", { class: "avg", x1: M.l, x2: W - M.r, y1: sy(teamTS), y2: sy(teamTS) }, sc);
svg("text", { class: "avgt", x: W - M.r, y: sy(teamTS) - 6, "text-anchor": "end" }, sc).textContent = `team ${teamTS.toFixed(1)}%`;

const dots = new Map(), labels = new Map();
[...rotation].sort((a, b) => b.min - a.min).forEach(p => {
  const c = svg("circle", { class: "dot", cx: sx(p.use), cy: sy(p.ts), r: 3 + Math.sqrt(p.min) * 1.5 }, sc);
  c.onmousemove = e => showTip(e, `<b>${esc(p.name)}</b><br>${p.use.toFixed(1)} possessions · ${p.ts.toFixed(1)} TS%<br>${p.pts.toFixed(1)} pts in ${p.min.toFixed(1)} min`);
  c.onmouseleave = hideTip;
  c.onclick = () => select(p);
  dots.set(p, c);
  const l = svg("text", { class: "dlab", x: sx(p.use) + 10 + Math.sqrt(p.min) * 1.5, y: sy(p.ts) + 4 }, sc);
  l.textContent = p.last;
  labels.set(p, l);
});

// ---------- Knicks vs the league ----------
const CMP = [
  { key: "pts", label: "PTS" }, { key: "reb", label: "REB" }, { key: "ast", label: "AST" },
  { key: "stl", label: "STL" }, { key: "blk", label: "BLK" }, { key: "fgp", label: "FG%" }
];
let cmp = CMP[0];
CMP.forEach(c => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = c.label;
  b.onclick = () => { cmp = c; renderCmp(); };
  c.btn = b;
  $("cmpChips").appendChild(b);
});
function renderCmp() {
  const sorted = [...LEAGUE_PLAYERS].sort((a, b) => b[cmp.key] - a[cmp.key]);
  const mk = (p, i) => ({
    rank: i + 1, label: p.name, sub: p.team, value: p[cmp.key], text: p[cmp.key].toFixed(1),
    hot: p.team === "NYK",
    onclick: () => { const k = players.find(x => x.name === p.name); if (k) select(k); }
  });
  const items = sorted.slice(0, 8).map(mk);
  sorted.forEach((p, i) => {
    if (p.team === "NYK" && i >= 8) {
      if (!items.some(x => x.gap)) items.push({ gap: "···" });
      items.push(mk(p, i));
    }
  });
  barList($("cmpList"), items);
  CMP.forEach(c => c.btn.classList.toggle("on", c === cmp));
}

// ---------- season simulation ----------
const TOTAL_SIMS = 20000, CHUNK = 1000;
const SCENARIOS = [
  { id: "now",  label: "Before tonight" },
  { id: "win",  label: "Knicks win at IND" },
  { id: "lose", label: "Knicks lose at IND" }
];
let scenario = "now", runId = 0, latest = null, shownTeams = TEAMS, confView = "E";

SCENARIOS.forEach(s => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = s.label;
  b.onclick = () => { scenario = s.id; startSim(); };
  s.btn = b;
  $("scenario").appendChild(b);
});
$("rerun").onclick = () => startSim();

function startSim() {
  const id = ++runId;
  const ts = TEAMS.map(t => ({ ...t }));
  if (scenario !== "now") {
    const k = ts.find(t => t.abbr === "NYK"), o = ts.find(t => t.abbr === "IND");
    if (scenario === "win") { k.w++; o.l++; } else { k.l++; o.w++; }
  }
  shownTeams = ts;
  SCENARIOS.forEach(s => s.btn.classList.toggle("on", s.id === scenario));
  const sim = Sim.createSim(ts);
  const t0 = performance.now();
  (function step() {
    if (id !== runId) return;
    sim.run(CHUNK);
    const done = sim.count() >= TOTAL_SIMS;
    latest = sim.results();
    renderOutlook(sim.count() / TOTAL_SIMS, done ? (performance.now() - t0) / 1000 : null);
    if (!done) requestAnimationFrame(step);
  })();
}

// outlook: numbers, seed chart, title odds
const seedChart = $("seedChart");
const SC = { w: 520, h: 170, l: 8, r: 8, t: 22, b: 26 };
const seedBars = [], seedLabels = [];
for (let s = 1; s <= 15; s++) {
  const bw = (SC.w - SC.l - SC.r) / 15;
  const x = SC.l + (s - 1) * bw;
  const cls = s <= 6 ? "z1" : s <= 10 ? "z2" : "z3";
  seedBars.push(svg("rect", { class: "sb " + cls, x: x + 3, width: bw - 6, rx: 4, y: SC.h - SC.b, height: 0 }, seedChart));
  seedLabels.push(svg("text", { class: "sl", x: x + bw / 2, y: SC.h - SC.b - 6, "text-anchor": "middle" }, seedChart));
  svg("text", { class: "tick", x: x + bw / 2, y: SC.h - 8, "text-anchor": "middle" }, seedChart).textContent = s;
}

function renderOutlook(progress, seconds) {
  $("simBar").style.width = progress * 100 + "%";
  $("simBar").parentNode.classList.toggle("done", progress >= 1);
  $("simStatus").textContent = progress >= 1
    ? `${TOTAL_SIMS.toLocaleString()} simulated seasons · ${seconds.toFixed(1)} s in your browser`
    : `Simulating… ${Math.round(progress * TOTAL_SIMS).toLocaleString()} of ${TOTAL_SIMS.toLocaleString()} seasons`;

  const i = shownTeams.findIndex(t => t.abbr === "NYK");
  const k = latest[i];
  $("oPlay").textContent = fmtPct(k.playoffs);
  $("oConf").textContent = fmtPct(k.conf);
  $("oTitle").textContent = fmtPct(k.title);

  const max = Math.max(...k.seeds, 0.01);
  k.seeds.forEach((v, n) => {
    const h = (v / max) * (SC.h - SC.b - SC.t);
    seedBars[n].setAttribute("height", h);
    seedBars[n].setAttribute("y", SC.h - SC.b - h);
    seedLabels[n].setAttribute("y", SC.h - SC.b - h - 6);
    seedLabels[n].textContent = v >= 0.03 ? Math.round(v * 100) + "%" : "";
  });
  const avgSeed = k.seeds.reduce((s, v, n) => s + v * (n + 1), 0);
  $("oNote").innerHTML = [
    [`${Math.round(k.wins)}\u2013${82 - Math.round(k.wins)}`, "Projected record"],
    [avgSeed.toFixed(1), "Average seed"],
    [fmtPct(k.top6), "Top-6 seed"],
    [fmtPct(k.playin), "Play-in"]
  ].map(([v, l]) => `<div><b>${v}</b><span class="label">${l}</span></div>`).join("");

  // championship odds
  const ranked = shownTeams.map((t, n) => ({ t, r: latest[n] })).sort((a, b) => b.r.title - a.r.title);
  const items = ranked.slice(0, 8).map((x, n) => ({
    rank: n + 1, label: nick(x.t.name), value: x.r.title, text: fmtPct(x.r.title), hot: x.t.abbr === "NYK"
  }));
  const kn = ranked.findIndex(x => x.t.abbr === "NYK");
  if (kn >= 8) {
    items.push({ gap: "···" });
    items.push({ rank: kn + 1, label: nick(ranked[kn].t.name), value: ranked[kn].r.title, text: fmtPct(ranked[kn].r.title), hot: true });
  }
  barList($("titleList"), items);

  renderStandings();
  renderMvp();
}

// ---------- standings ----------
[["E", "East"], ["W", "West"]].forEach(([id, label]) => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = label;
  b.onclick = () => { confView = id; renderStandings(); };
  b.dataset.id = id;
  $("confChips").appendChild(b);
});

function renderStandings() {
  const list = shownTeams.map((t, n) => ({ t, r: latest ? latest[n] : null }))
    .filter(x => x.t.conf === confView)
    .sort((a, b) => (b.t.w / (b.t.w + b.t.l)) - (a.t.w / (a.t.w + a.t.l)) || (b.t.ppg - b.t.opp) - (a.t.ppg - a.t.opp));
  const lead = list[0].t;
  $("standTbl").tBodies[0].innerHTML = list.map((x, n) => {
    const t = x.t, g = t.w + t.l, margin = t.ppg - t.opp;
    const gb = ((lead.w - t.w) + (t.l - lead.l)) / 2;
    return `<tr class="${t.abbr === "NYK" ? "hot" : ""}${n === 5 || n === 9 ? " cut" : ""}">
      <td class="rk">${n + 1}</td><td class="tm">${esc(t.name)}</td>
      <td>${t.w}&ndash;${t.l}</td><td>${(t.w / g).toFixed(3).replace(/^0/, "")}</td>
      <td>${gb === 0 ? "&ndash;" : gb.toFixed(1)}</td>
      <td>${margin > 0 ? "+" : ""}${margin.toFixed(1)}</td>
      <td>${x.r ? fmtPct(x.r.playoffs) : ""}</td><td>${x.r ? fmtPct(x.r.title) : ""}</td></tr>`;
  }).join("");
  $("confChips").querySelectorAll(".chip").forEach(b => b.classList.toggle("on", b.dataset.id === confView));
}

// ---------- MVP ----------
let mvpRows = [];
function renderMvp() {
  const proj = {}, games = {};
  shownTeams.forEach((t, n) => { proj[t.abbr] = latest[n].wins; games[t.abbr] = t.w + t.l; });
  mvpRows = Sim.mvpOdds(LEAGUE_PLAYERS, proj, games);
  const mk = (x, n) => ({
    rank: n + 1, label: x.p.name, sub: `${x.p.team} · ${x.p.pts.toFixed(1)}/${x.p.reb.toFixed(1)}/${x.p.ast.toFixed(1)}`,
    value: x.prob, text: fmtPct(x.prob), hot: x.p.team === "NYK",
    onclick: () => { const k = players.find(q => q.name === x.p.name); if (k) select(k); }
  });
  const items = mvpRows.slice(0, 6).map(mk);
  mvpRows.forEach((x, n) => {
    if (x.p.team === "NYK" && n >= 6) {
      if (!items.some(q => q.gap)) items.push({ gap: "···" });
      items.push(mk(x, n));
    }
  });
  barList($("mvpList"), items);
}

// ---------- CSV downloads ----------
function download(name, rows) {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("dlStand").onclick = () => {
  const head = ["Team", "Conference", "W", "L", "PPG", "Opp PPG", "Margin", "Strength rating", "Projected wins", "Playoffs %", "Win conference %", "Title %"];
  download("knicks-standings-odds.csv", [head, ...shownTeams.map((t, n) => {
    const r = latest[n];
    return [t.name, t.conf === "E" ? "East" : "West", t.w, t.l, t.ppg, t.opp, (t.ppg - t.opp).toFixed(1),
            r.rating.toFixed(2), r.wins.toFixed(1), (r.playoffs * 100).toFixed(1), (r.conf * 100).toFixed(1), (r.title * 100).toFixed(1)];
  })]);
};
$("dlKnicks").onclick = () => {
  const head = ["Player", "Number", "Pos", "GP", "GS", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "FG%", "3P%", "FT%", "FGM", "FGA", "3PM", "3PA", "FTM", "FTA", "TS%"];
  download("knicks-player-stats.csv", [head, ...players.map(p => [p.name, NUMBERS[p.name], p.pos, p.gp, p.gs, p.min, p.pts, p.reb, p.ast, p.stl, p.blk, p.tov,
    p.fgp, p.tpp, p.ftp, p.fgm, p.fga, p.tpm, p.tpa, p.ftm, p.fta, p.ts.toFixed(1)])]);
};
$("dlLeague").onclick = () => {
  const head = ["Player", "Team", "Pos", "GP", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "FG%", "3P%", "FT%", "MVP model %"];
  const odds = new Map(mvpRows.map(x => [x.p.name, x.prob]));
  download("league-leaders-mvp-model.csv", [head, ...LEAGUE_PLAYERS.map(p => [p.name, p.team, p.pos, p.gp, p.min, p.pts, p.reb, p.ast, p.stl, p.blk, p.tov,
    p.fgp, p.tpp, p.ftp, ((odds.get(p.name) || 0) * 100).toFixed(1)])]);
};

// ---------- info hints ----------
document.querySelectorAll(".info").forEach(el => {
  el.onmousemove = e => showTip(e, esc(el.dataset.tip));
  el.onmouseleave = hideTip;
  el.onclick = e => { showTip(e, esc(el.dataset.tip)); setTimeout(hideTip, 2500); };
});

// ---------- nav highlight ----------
const navLinks = [...document.querySelectorAll(".links a")];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(l => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
["outlook", "players", "league", "standings"].forEach(id => spy.observe($(id)));

// ---------- keyboard ----------
addEventListener("keydown", e => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = players.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1);
  select(players[(i + players.length) % players.length]);
});

// ---------- go ----------
renderBoard();
renderCmp();
select(current);
startSim();
