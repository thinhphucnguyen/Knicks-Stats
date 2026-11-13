// Monte Carlo season simulator + a simple MVP model.
// Plain JS, no dependencies. Runs in the browser and under Node for testing.
//
// How it works
//  1. Each team gets a strength rating: its points-per-game margin, shrunk toward
//     zero because ten games is a small sample (see ratingOf).
//  2. The rest of every team's 82-game schedule is played against random opponents.
//     Win chance for each game comes from the rating gap plus home court.
//  3. Teams are seeded, the play-in is played, then four best-of-7 rounds.
//  4. Repeat thousands of times and count how often things happen.

(function (root) {
  var HOME_EDGE = 2.5;   // points of home-court advantage
  var SLOPE = 0.145;     // rating points -> win chance (logistic); ~3.6% per point near 50%
  var TALENT_SD = 4.5;   // spread of true team strength, in points per game
  var GAME_SD = 12;      // noise in a single game's margin

  // Shrink a team's per-game margin toward 0 based on how many games it has played.
  function ratingOf(t) {
    var g = t.w + t.l;
    var net = t.ppg - t.opp;
    var k = (GAME_SD * GAME_SD) / (TALENT_SD * TALENT_SD);   // about 7 games of "prior"
    return net * (g / (g + k));
  }

  function createSim(teams) {
    var n = teams.length;
    var r = teams.map(ratingOf);
    var w0 = teams.map(function (t) { return t.w; });
    var east = [], west = [];
    teams.forEach(function (t, i) { (t.conf === "E" ? east : west).push(i); });

    // one "stub" per game a team still has to play; pairing stubs makes the schedule
    var base = [];
    teams.forEach(function (t, i) {
      for (var k = 0; k < Math.max(0, 82 - t.w - t.l); k++) base.push(i);
    });
    if (base.length % 2) base.pop();
    var stubs = new Int16Array(base.length);

    // A team's rating is uncertain after only ~10 games. Each simulated season draws
    // its "true" strength from that uncertainty, which keeps the odds from being overconfident.
    var spread = teams.map(function (t) {
      return 1 / Math.sqrt(1 / (TALENT_SD * TALENT_SD) + (t.w + t.l) / (GAME_SD * GAME_SD));
    });
    var rr = new Float64Array(n);
    var P = new Float64Array(n * n);   // P[h*n+a] = chance the home team h beats a
    function gauss() {
      return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
    }
    function drawStrengths() {
      var i, j;
      for (i = 0; i < n; i++) rr[i] = r[i] + spread[i] * gauss();
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) P[i * n + j] = 1 / (1 + Math.exp(-((rr[i] - rr[j]) + HOME_EDGE) * SLOPE));
      }
    }

    var acc = {
      n: 0,
      playoffs: new Float64Array(n), top6: new Float64Array(n), playin: new Float64Array(n),
      conf: new Float64Array(n), title: new Float64Array(n), wins: new Float64Array(n),
      seed: new Float64Array(n * 16)          // regular-season rank inside the conference
    };

    function game(h, a) { return Math.random() < P[h * n + a]; }   // true = home team wins

    // best-of-7, 2-2-1-1-1; a has home court. Returns true if a wins.
    var HC = [1, 1, 0, 0, 1, 0, 1];
    function series(a, b) {
      var wa = 0, wb = 0;
      for (var k = 0; k < 7 && wa < 4 && wb < 4; k++) {
        var aWins = HC[k] ? game(a, b) : !game(b, a);
        if (aWins) wa++; else wb++;
      }
      return wa === 4;
    }

    // plays one conference's play-in and playoffs. order = team ids, seed 1 first.
    function conference(order) {
      var i;
      for (i = 0; i < 6; i++) { acc.top6[order[i]]++; acc.playoffs[order[i]]++; }
      for (i = 6; i < 10; i++) acc.playin[order[i]]++;

      var s7 = order[6], s8 = order[7], s9 = order[8], s10 = order[9];
      var seven, loser78;
      if (game(s7, s8)) { seven = s7; loser78 = s8; } else { seven = s8; loser78 = s7; }
      var w910 = game(s9, s10) ? s9 : s10;
      var eight = game(loser78, w910) ? loser78 : w910;
      acc.playoffs[seven]++; acc.playoffs[eight]++;

      // field: seed number -> team id
      var f = [0, order[0], order[1], order[2], order[3], order[4], order[5], seven, eight];
      function play(sa, ta, sb, tb) {   // returns {s, t} of the winner; lower seed number hosts
        if (sa > sb) { var x = sa; sa = sb; sb = x; x = ta; ta = tb; tb = x; }
        return series(ta, tb) ? { s: sa, t: ta } : { s: sb, t: tb };
      }
      var q1 = play(1, f[1], 8, f[8]), q2 = play(4, f[4], 5, f[5]);
      var q3 = play(3, f[3], 6, f[6]), q4 = play(2, f[2], 7, f[7]);
      var s1 = play(q1.s, q1.t, q2.s, q2.t), s2 = play(q3.s, q3.t, q4.s, q4.t);
      var champ = play(s1.s, s1.t, s2.s, s2.t);
      acc.conf[champ.t]++;
      return champ.t;
    }

    var key = new Float64Array(n);
    function byWins(ids, w) {
      for (var i = 0; i < ids.length; i++) key[ids[i]] = w[ids[i]] + Math.random() * 0.4;  // coin-flip tiebreak
      return ids.slice().sort(function (a, b) { return key[b] - key[a]; });
    }

    var w = new Int16Array(n);
    function once() {
      drawStrengths();
      w.set(w0);
      var m = base.length, i, j, t;
      for (i = 0; i < m; i++) stubs[i] = base[i];
      for (i = m - 1; i > 0; i--) {                      // shuffle
        j = (Math.random() * (i + 1)) | 0; t = stubs[i]; stubs[i] = stubs[j]; stubs[j] = t;
      }
      for (i = 0; i + 1 < m; i += 2) {
        var h = stubs[i], a = stubs[i + 1];
        if (h === a) continue;
        if (game(h, a)) w[h]++; else w[a]++;
      }
      for (i = 0; i < n; i++) acc.wins[i] += w[i];

      var e = byWins(east, w), x = byWins(west, w);
      for (i = 0; i < e.length; i++) acc.seed[e[i] * 16 + i + 1]++;
      for (i = 0; i < x.length; i++) acc.seed[x[i] * 16 + i + 1]++;

      var ce = conference(e), cw = conference(x);
      var homeTeam = (w[ce] + Math.random() * 0.4 >= w[cw] + Math.random() * 0.4) ? ce : cw;  // best record hosts
      var other = homeTeam === ce ? cw : ce;
      acc.title[series(homeTeam, other) ? homeTeam : other]++;
      acc.n++;
    }

    return {
      run: function (count) { for (var k = 0; k < count; k++) once(); },
      count: function () { return acc.n; },
      results: function () {
        var N = Math.max(1, acc.n);
        return teams.map(function (t, i) {
          var seeds = [];
          for (var s = 1; s <= 15; s++) seeds.push(acc.seed[i * 16 + s] / N);
          return {
            abbr: t.abbr, rating: r[i], seeds: seeds,
            playoffs: acc.playoffs[i] / N, top6: acc.top6[i] / N, playin: acc.playin[i] / N,
            conf: acc.conf[i] / N, title: acc.title[i] / N, wins: acc.wins[i] / N
          };
        });
      }
    };
  }

  // ---- MVP model ----
  // A transparent score, not a betting line:
  //   production = PTS + 1.2 REB + 1.6 AST + 2 STL + 2 BLK - 1.6 TOV
  //   score      = z(production) + 0.9 * (projected team wins - 41) / 8 + log(availability)
  // Chances are a softmax of the score, so they always add up to 100%.
  function mvpOdds(players, projWins, games) {
    var rows = players.map(function (p) {
      var prod = p.pts + 1.2 * p.reb + 1.6 * p.ast + 2 * p.stl + 2 * p.blk - 1.6 * p.tov;
      return { p: p, prod: prod };
    });
    var mean = rows.reduce(function (s, x) { return s + x.prod; }, 0) / rows.length;
    var sd = Math.sqrt(rows.reduce(function (s, x) { return s + Math.pow(x.prod - mean, 2); }, 0) / rows.length);
    rows.forEach(function (x) {
      var team = projWins[x.p.team] == null ? 41 : projWins[x.p.team];
      var avail = Math.min(1, x.p.gp / Math.max(1, games[x.p.team] || x.p.gp));
      x.score = (x.prod - mean) / sd + 0.9 * (team - 41) / 8 + Math.log(Math.max(0.2, avail));
    });
    var SHARP = 1.1;
    var top = Math.max.apply(null, rows.map(function (x) { return x.score; }));
    var sum = 0;
    rows.forEach(function (x) { x.e = Math.exp((x.score - top) * SHARP); sum += x.e; });
    rows.forEach(function (x) { x.prob = x.e / sum; });
    return rows.sort(function (a, b) { return b.prob - a.prob; });
  }

  var api = { createSim: createSim, mvpOdds: mvpOdds, ratingOf: ratingOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof window !== "undefined" ? window : this);
