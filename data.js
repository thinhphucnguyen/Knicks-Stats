// Snapshot of the Knicks' 2026-27 season so far.
// Source: ESPN team stats page, record cross-checked against StatMuse.
// All player numbers are per-game averages, except gp / gs.
// To update: replace the rows below and the record/next game, then refresh the page.

const SNAPSHOT = {
  asOf: "Nov 13, 2026",
  source: "ESPN",
  record: { w: 6, l: 5 },
  next: "Fri Nov 13  ·  at Indiana  ·  7:00 PM ET",
  teamPts: 110.3,
  teamFga: 88.7,
  teamFta: 22.7,

  // Optional player photos. Put your own images in an img/ folder named by
  // lowercase last name (img/brunson.jpg) and list the names here: ["brunson", "towns"]
  photos: [],

  // name, pos, gp, gs, min, pts, reb, ast, stl, blk, tov, fgp, tpp, ftp, fgm, fga, tpm, tpa, ftm, fta
  rows: [
    ["Jalen Brunson",       "G", 11, 11, 33.6, 26.0,  3.1, 5.2, 0.6, 0.4, 1.6, 43.0, 36.7,  78.2, 8.9, 20.7, 2.6, 7.2, 5.5, 7.1],
    ["Karl-Anthony Towns",  "C", 11, 11, 31.4, 20.9, 13.5, 3.5, 0.7, 0.5, 3.3, 55.0, 39.6,  77.6, 7.5, 13.5, 1.9, 4.8, 4.1, 5.3],
    ["OG Anunoby",          "F", 11, 11, 32.7, 16.5,  5.4, 2.4, 1.1, 0.5, 2.1, 38.8, 33.3,  89.1, 4.5, 11.7, 2.2, 6.5, 5.2, 5.8],
    ["Landry Shamet",       "G", 11,  3, 25.9,  9.6,  1.6, 2.1, 0.3, 0.2, 1.0, 46.2, 42.1,  71.4, 3.3,  7.1, 2.2, 5.2, 0.9, 1.3],
    ["Josh Hart",           "G",  8,  8, 30.9,  8.3,  6.9, 3.8, 1.9, 0.3, 1.8, 38.5, 31.7,  60.0, 3.1,  8.1, 1.6, 5.1, 0.4, 0.6],
    ["Miles McBride",       "G", 11,  0, 18.9,  7.9,  1.5, 1.2, 0.8, 0.3, 0.4, 44.8, 44.2,  80.0, 2.7,  6.1, 2.1, 4.7, 0.4, 0.5],
    ["Jordan Clarkson",     "G",  9,  0, 10.6,  6.0,  1.8, 0.6, 0.2, 0.2, 0.2, 52.3, 60.0,  66.7, 2.6,  4.9, 0.7, 1.1, 0.2, 0.3],
    ["Mikal Bridges",       "G", 11, 11, 24.4,  5.9,  3.2, 2.1, 0.9, 0.5, 0.8, 32.9, 26.5, 100.0, 2.4,  7.2, 0.8, 3.1, 0.4, 0.4],
    ["Dalton Knecht",       "F",  3,  0,  9.7,  4.3,  2.3, 0.3, 0.0, 0.3, 0.0, 62.5, 50.0,   0.0, 1.7,  2.7, 1.0, 2.0, 0.0, 0.0],
    ["Andre Drummond",      "C", 11,  0, 13.5,  4.3,  8.1, 1.4, 0.3, 0.5, 0.7, 41.7,  0.0,  58.3, 1.8,  4.4, 0.0, 0.1, 0.6, 1.1],
    ["Pacome Dadiet",       "F",  3,  0,  5.3,  4.0,  1.0, 0.0, 0.0, 0.0, 0.0, 55.6, 25.0, 100.0, 1.7,  3.0, 0.3, 1.3, 0.3, 0.3],
    ["Tyler Kolek",         "G",  9,  0, 12.8,  3.4,  1.8, 4.9, 0.6, 0.1, 0.6, 42.9, 31.3, 100.0, 1.3,  3.1, 0.6, 1.8, 0.2, 0.2],
    ["Mohamed Diawara",     "F",  6,  0, 12.0,  2.8,  2.2, 1.7, 0.0, 0.3, 0.5, 31.6, 14.3,  75.0, 1.0,  3.2, 0.3, 2.3, 0.5, 0.7],
    ["Jose Alvarado",       "G",  5,  0, 10.4,  2.0,  1.2, 1.6, 0.6, 0.2, 1.4, 26.7, 25.0,   0.0, 0.8,  3.0, 0.4, 1.6, 0.0, 0.0],
    ["James Wiseman",       "C",  5,  0,  5.2,  1.6,  2.4, 0.0, 0.2, 0.8, 0.6, 40.0,  0.0,   0.0, 0.8,  2.0, 0.0, 0.0, 0.0, 0.0],
    ["Jaden Akins",         "G",  2,  0,  1.0,  0.0,  0.0, 0.0, 0.0, 0.0, 0.0,  0.0,  0.0,   0.0, 0.0,  0.0, 0.0, 0.0, 0.0, 0.0]
  ]
};
