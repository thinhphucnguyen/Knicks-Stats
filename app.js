// Knicks stats demo. No libraries, just SVG + a bit of DOM.

const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
};

// ---------- data ----------
const KEYS = ["name", "pos", "gp", "gs", "min", "pts", "reb", "ast", "stl", "blk", "tov",
              "fgp", "tpp", "ftp", "fgm", "fga", "tpm", "tpa", "ftm", "fta"];
const players = SNAPSHOT.rows.map(r => {
  const p = {};
  KEYS.forEach((k, i) => (p[k] = r[i]));
  p.last = p.name.split(" ").pop();
  p.total = p.pts * p.gp;                                   // season points
  p.ts = p.fga + p.fta ? (p.pts / (2 * (p.fga + 0.44 * p.fta))) * 100 : 0;  // true shooting %
  p.use = p.fga + 0.44 * p.fta + p.tov;                     // shot-ending possessions / game
  p.stocks = p.stl + p.blk;
  return p;
});
const teamTotal = players.reduce((s, p) => s + p.total, 0);
const rotation = players.filter(p => p.gp >= 5 && p.min >= 10);
let current = players[0];

// ---------- header ----------
$("rec").textContent = `${SNAPSHOT.record.w}–${SNAPSHOT.record.l}`;
$("next").textContent = SNAPSHOT.next;
$("teamTotal").textContent = Math.round(teamTotal).toLocaleString();
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

// ---------- points strip ----------
const strip = $("strip");
const byTotal = [...players].filter(p => p.total > 0).sort((a, b) => b.total - a.total);
byTotal.forEach(p => {
  const s = document.createElement("div");
  s.className = "seg";
  s.style.flexGrow = p.total;
  s.style.flexBasis = "0";
  if (p.total / teamTotal > 0.05) s.innerHTML = `<span>${p.last}</span>`;
  s.onmousemove = e => showTip(e, `<b>${p.name}</b><br>${Math.round(p.total)} pts (${(p.total / teamTotal * 100).toFixed(0)}% of team)`);
  s.onmouseleave = hideTip;
  s.onclick = () => select(p);
  s.dataset.id = p.name;
  strip.appendChild(s);
});

// ---------- leaderboard (animated re-sort) ----------
const ROW = 34;
const STATS = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tpm", label: "3PM" },
  { key: "min", label: "MIN" },
  { key: "fgp", label: "FG%", pct: true, ok: p => p.gp >= 5 && p.fga >= 4,  note: "Min. 5 games and 4 FGA per game to qualify" },
  { key: "tpp", label: "3P%", pct: true, ok: p => p.gp >= 5 && p.tpa >= 2,  note: "Min. 5 games and 2 3PA per game to qualify" },
  { key: "ts",  label: "TS%", pct: true, ok: p => p.gp >= 5 && p.fga >= 4,  note: "Min. 5 games and 4 FGA per game to qualify" }
];
let stat = STATS[0];

const board = $("board");
board.style.height = players.length * ROW + "px";
const rows = new Map();

players.forEach(p => {
  const r = document.createElement("div");
  r.className = "row";
  r.innerHTML = `<span class="rk"></span><span class="nm">${p.name}</span>
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
  $("boardNote").textContent = stat.note || "Per-game averages, sorted high to low";
}

// ---------- player card ----------
// radar axes: each is scaled against the best rotation player on the team
const AXES = [
  { l: "PTS",     v: p => p.pts },
  { l: "REB",     v: p => p.reb },
  { l: "AST",     v: p => p.ast },
  { l: "STL+BLK", v: p => p.stocks },
  { l: "3PM",     v: p => p.tpm },
  { l: "TS%",     v: p => p.ts, lo: 40, hi: 70 }
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
  $("cPos").textContent = { G: "Guard", F: "Forward", C: "Center" }[p.pos];
  $("cName").textContent = p.name;
  $("cSub").textContent = `${p.gp} games  ·  ${p.gs} starts  ·  ${p.min.toFixed(1)} min`;
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

  const mini = [["stl", p.stl], ["blk", p.blk], ["tov", p.tov], ["ts%", p.ts], ["poss", p.use], ["season pts", p.total]];
  $("mini").innerHTML = mini.map(([l, v]) => `<div><b class="cond">${l === "season pts" ? Math.round(v) : v.toFixed(1)}</b><span class="label">${l}</span></div>`).join("");

  // highlight everywhere
  rows.forEach((r, q) => r.classList.toggle("sel", q === p));
  strip.querySelectorAll(".seg").forEach(s => s.classList.toggle("sel", s.dataset.id === p.name));
  dots.forEach((d, q) => d.classList.toggle("sel", q === p));
  labels.forEach((l, q) => (l.style.display = q === p || q.min >= 24 ? "" : "none"));
}

// ---------- scatter: volume vs efficiency ----------
const W = 760, H = 340, M = { l: 54, r: 24, t: 14, b: 46 };
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
  c.onmousemove = e => showTip(e, `<b>${p.name}</b><br>${p.use.toFixed(1)} possessions · ${p.ts.toFixed(1)} TS%<br>${p.pts.toFixed(1)} pts in ${p.min.toFixed(1)} min`);
  c.onmouseleave = hideTip;
  c.onclick = () => select(p);
  dots.set(p, c);
  const l = svg("text", { class: "dlab", x: sx(p.use) + 10 + Math.sqrt(p.min) * 1.5, y: sy(p.ts) + 4 }, sc);
  l.textContent = p.last;
  labels.set(p, l);
});

// ---------- keyboard ----------
addEventListener("keydown", e => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = players.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1);
  select(players[(i + players.length) % players.length]);
});

// ---------- go ----------
renderBoard();
select(current);
