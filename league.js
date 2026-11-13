// League-wide snapshot used by the season simulator and the comparison panels.
// Source: ESPN (standings table and player stats table). Nov 13, 2026.
// Note: ESPN's standings table lags the player table by a game or two for some
// teams. The Knicks record is updated to 6-5 to match their team page.

// abbr, name, conference, W, L, points for / game, points against / game
const TEAMS = [
  ["PHI", "Philadelphia 76ers",     "E",  9,  2, 111.0, 107.9],
  ["LAL", "Los Angeles Lakers",     "W", 10,  2, 122.1, 114.4],
  ["BOS", "Boston Celtics",         "E",  8,  2, 115.0, 104.3],
  ["SAS", "San Antonio Spurs",      "W",  9,  2, 118.7, 107.0],
  ["DET", "Detroit Pistons",        "E",  7,  3, 112.7, 104.6],
  ["OKC", "Oklahoma City Thunder",  "W",  8,  2, 112.2, 104.2],
  ["ATL", "Atlanta Hawks",          "E",  7,  5, 118.3, 116.2],
  ["GSW", "Golden State Warriors",  "W",  8,  3, 120.4, 111.2],
  ["NYK", "New York Knicks",        "E",  6,  5, 110.3, 104.2],
  ["MIN", "Minnesota Timberwolves", "W",  8,  3, 118.1, 107.0],
  ["TOR", "Toronto Raptors",        "E",  5,  5, 116.6, 113.3],
  ["HOU", "Houston Rockets",        "W",  8,  3, 115.5, 106.4],
  ["CLE", "Cleveland Cavaliers",    "E",  5,  6, 116.5, 115.0],
  ["MEM", "Memphis Grizzlies",      "W",  7,  3, 117.9, 110.8],
  ["MIA", "Miami Heat",             "E",  4,  6, 115.8, 121.1],
  ["POR", "Portland Trail Blazers", "W",  6,  3, 119.3, 113.8],
  ["CHA", "Charlotte Hornets",      "E",  4,  7,  98.8, 110.4],
  ["DAL", "Dallas Mavericks",       "W",  7,  4, 114.9, 110.3],
  ["WAS", "Washington Wizards",     "E",  4,  7, 108.1, 113.4],
  ["DEN", "Denver Nuggets",         "W",  5,  4, 113.6, 112.8],
  ["IND", "Indiana Pacers",         "E",  3,  8, 111.4, 115.2],
  ["NOP", "New Orleans Pelicans",   "W",  4,  7, 117.5, 122.4],
  ["ORL", "Orlando Magic",          "E",  2,  7, 107.0, 116.2],
  ["PHX", "Phoenix Suns",           "W",  3,  6, 110.6, 119.0],
  ["BKN", "Brooklyn Nets",          "E",  2,  8, 106.7, 115.7],
  ["LAC", "LA Clippers",            "W",  2,  7, 112.4, 116.4],
  ["SAC", "Sacramento Kings",       "W",  1,  9, 109.1, 122.4],
  ["CHI", "Chicago Bulls",          "E",  1,  8, 112.7, 129.3],
  ["MIL", "Milwaukee Bucks",        "E",  1,  9, 108.4, 121.6],
  ["UTA", "Utah Jazz",              "W",  1,  9, 106.2, 117.9]
].map(r => ({ abbr: r[0], name: r[1], conf: r[2], w: r[3], l: r[4], ppg: r[5], opp: r[6] }));

// The league's top 43 scorers (ESPN player table, sorted by points per game).
// name, team, pos, GP, MIN, PTS, FG%, 3P%, FT%, REB, AST, STL, BLK, TOV
// Caleb Wilson's BLK and TOV were not shown by ESPN and are entered as 0.
const LEAGUE_PLAYERS = [
  ["Luka Doncic",            "LAL", "G", 11, 35.9, 38.6, 48.9, 40.8, 86.6,  7.5, 7.6, 2.0, 0.7, 5.0],
  ["Victor Wembanyama",      "SAS", "F", 12, 30.0, 30.3, 54.3, 32.4, 77.6, 11.7, 2.8, 1.2, 4.4, 2.0],
  ["Shai Gilgeous-Alexander","OKC", "G", 12, 32.8, 29.7, 45.3, 33.8, 87.1,  4.3, 4.5, 0.9, 1.0, 2.2],
  ["Stephen Curry",          "GSW", "G", 10, 26.3, 27.8, 50.0, 45.7, 98.7,  3.7, 3.9, 0.9, 0.1, 1.7],
  ["Giannis Antetokounmpo",  "MIA", "F", 11, 32.6, 27.7, 56.7, 22.2, 61.6, 12.6, 5.2, 0.9, 1.0, 3.4],
  ["Tyrese Maxey",           "PHI", "G", 12, 36.3, 26.7, 49.1, 36.0, 86.6,  3.5, 5.3, 1.3, 0.6, 2.0],
  ["Jayson Tatum",           "BOS", "F", 11, 34.0, 26.3, 41.3, 30.6, 88.8,  6.1, 7.5, 0.6, 0.8, 2.8],
  ["Jamal Murray",           "DEN", "G", 10, 36.4, 26.2, 50.9, 51.3, 84.2,  5.0, 5.9, 0.9, 0.9, 2.3],
  ["Ty Jerome",              "MEM", "G", 10, 30.7, 26.2, 50.0, 36.6, 89.7,  3.5, 4.9, 0.7, 0.2, 2.4],
  ["Darius Acuff Jr.",       "SAC", "G", 11, 37.4, 26.2, 41.8, 33.0, 84.6,  3.8, 7.3, 1.0, 0.1, 3.6],
  ["Jalen Brunson",          "NYK", "G", 11, 33.6, 26.0, 43.0, 36.7, 78.2,  3.1, 5.2, 0.6, 0.4, 1.6],
  ["Cooper Flagg",           "DAL", "F", 10, 34.1, 25.9, 50.0, 29.2, 90.3,  6.9, 6.9, 2.2, 0.8, 3.3],
  ["Anthony Davis",          "WAS", "F", 10, 33.2, 25.2, 51.3, 33.3, 83.6, 10.0, 1.8, 1.3, 1.1, 2.0],
  ["Devin Booker",           "PHX", "G", 10, 33.9, 25.1, 48.3, 35.7, 93.7,  2.7, 4.8, 1.0, 0.3, 2.5],
  ["Austin Reaves",          "LAL", "G", 12, 35.3, 24.7, 51.3, 40.9, 91.5,  3.3, 4.7, 1.2, 0.3, 3.4],
  ["Nikola Jokic",           "DEN", "C", 10, 36.3, 23.5, 50.0, 23.3, 87.2, 10.8, 9.0, 1.8, 1.2, 3.0],
  ["Scottie Barnes",         "TOR", "F",  8, 33.3, 23.5, 47.5, 15.4, 68.0,  7.6, 5.1, 2.3, 0.6, 4.0],
  ["Franz Wagner",           "ORL", "F", 11, 36.8, 23.5, 45.9, 25.0, 82.4,  6.5, 7.9, 1.4, 0.0, 4.4],
  ["Deni Avdija",            "POR", "F", 11, 32.5, 23.0, 47.4, 33.9, 69.4,  6.1, 6.5, 1.2, 0.3, 3.2],
  ["Kyrie Irving",           "DAL", "G",  9, 30.4, 22.9, 48.7, 39.5, 89.7,  3.2, 4.3, 1.2, 0.3, 1.9],
  ["Donovan Mitchell",       "CLE", "G", 12, 33.1, 22.8, 48.5, 37.6, 79.4,  5.0, 5.5, 1.3, 0.5, 3.1],
  ["Pascal Siakam",          "IND", "F", 11, 32.1, 22.7, 51.1, 34.5, 73.4,  6.9, 4.4, 1.0, 0.1, 2.1],
  ["Cade Cunningham",        "DET", "G", 10, 33.2, 22.3, 46.2, 29.2, 80.0,  5.2, 7.6, 1.6, 0.9, 3.5],
  ["Zach LaVine",            "SAC", "G", 11, 32.7, 22.3, 50.3, 38.3, 86.7,  3.3, 2.5, 1.0, 0.4, 3.1],
  ["Paul George",            "BOS", "F", 10, 30.1, 22.0, 48.8, 44.0, 82.1,  5.2, 3.8, 2.1, 0.4, 2.9],
  ["Nickeil Alexander-Walker","ATL","G", 12, 31.1, 21.9, 41.7, 37.3, 86.8,  3.3, 2.6, 1.4, 0.3, 2.0],
  ["Tyler Herro",            "MIL", "G", 11, 31.1, 21.9, 45.9, 38.8, 80.0,  4.4, 4.5, 0.8, 0.2, 2.2],
  ["Zion Williamson",        "NOP", "F", 11, 32.7, 21.7, 62.2, 50.0, 77.9,  5.2, 2.6, 2.0, 0.5, 1.9],
  ["Yaxel Lendeborg",        "GSW", "F", 12, 32.3, 21.7, 51.8, 42.6, 74.3,  7.4, 3.7, 1.1, 0.7, 3.3],
  ["Michael Porter Jr.",     "BKN", "F", 11, 32.6, 21.5, 45.6, 37.5, 74.6,  7.5, 1.3, 1.3, 0.4, 2.1],
  ["Jaylen Brown",           "PHI", "G", 11, 34.9, 21.5, 47.6, 38.2, 70.9,  6.5, 3.8, 1.3, 0.5, 2.3],
  ["Alperen Sengun",         "HOU", "C", 10, 35.0, 21.1, 51.9, 47.6, 72.2,  9.4, 7.9, 1.1, 1.1, 3.0],
  ["Kevin Durant",           "HOU", "F", 12, 34.3, 20.9, 49.4, 34.8, 85.9,  6.1, 3.6, 0.6, 1.3, 3.3],
  ["Karl-Anthony Towns",     "NYK", "C", 11, 31.4, 20.9, 55.0, 39.6, 77.6, 13.5, 3.5, 0.7, 0.5, 3.3],
  ["Brandon Miller",         "CHA", "F", 10, 31.0, 20.6, 35.6, 26.0, 86.8,  5.0, 2.2, 1.1, 0.7, 2.3],
  ["RJ Barrett",             "TOR", "F", 11, 33.2, 20.5, 44.5, 26.8, 62.5,  6.0, 4.0, 0.5, 0.5, 1.7],
  ["Darius Garland",         "LAC", "G", 10, 32.6, 20.4, 46.7, 35.3, 82.6,  1.8, 6.9, 0.6, 0.0, 5.0],
  ["Keyonte George",         "UTA", "G", 11, 32.2, 20.4, 43.2, 29.9, 80.6,  4.5, 6.5, 0.9, 0.2, 3.6],
  ["Damian Lillard",         "POR", "G", 11, 29.1, 19.8, 42.7, 33.3, 86.8,  3.2, 4.2, 0.8, 0.1, 2.1],
  ["Julius Randle",          "BKN", "F", 11, 33.2, 19.7, 44.0, 30.6, 79.5,  6.5, 5.0, 0.7, 0.2, 3.8],
  ["Norman Powell",          "CHI", "G",  8, 28.8, 19.3, 39.8, 30.9, 79.7,  2.5, 1.6, 1.6, 0.0, 1.8],
  ["Jalen Johnson",          "ATL", "F",  9, 33.6, 19.2, 44.9, 20.5, 82.0,  8.6, 7.2, 1.0, 0.6, 3.2],
  ["Caleb Wilson",           "CHI", "F", 10, 30.8, 18.9, 42.0, 32.4, 73.2,  6.2, 1.9, 1.8, 0.0, 0.0]
].map(r => ({
  name: r[0], team: r[1], pos: r[2], gp: r[3], min: r[4], pts: r[5], fgp: r[6], tpp: r[7], ftp: r[8],
  reb: r[9], ast: r[10], stl: r[11], blk: r[12], tov: r[13]
}));
