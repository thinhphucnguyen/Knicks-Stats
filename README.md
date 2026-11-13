# Knicks Stats

**[Live demo](https://thinhphucnguyen.github.io/Knicks-Stats/)**

![Demo](docs/demo.gif)

An interactive look at the Knicks' 2026-27 season, built with plain HTML, CSS and JS.
No build step and no dependencies.

- **Roster tiles:** click any player (jersey number, name, points per game).
- **Season outlook:** playoff, conference and title odds from a Monte Carlo simulation that runs
  live in your browser (20,000 seasons in about a second). Try the "win/lose at IND" buttons.
- **Leaders and player cards:** animated re-sorting leaderboard, radar profile, shooting gauges.
- **Knicks vs. the league:** how Brunson and Towns rank against the league's top scorers.
- **MVP race:** a transparent model estimate (not betting odds) that moves with the simulation.
- **Standings:** East/West tables with the odds filled in, plus CSV downloads.
- **Points distribution and efficiency scatter.**

## Run it locally

    python3 -m http.server 8000

then open http://localhost:8000 (or just open `index.html`).

## How the odds work

1. Each team's strength is its points margin per game, pulled toward zero because ten games is a small sample.
2. The rest of every team's 82-game schedule is played against random opponents with a small home-court edge.
3. Teams are seeded, the play-in is played, then four best-of-7 rounds.
4. Repeat 20,000 times and count outcomes.

It ignores rosters, injuries and the real remaining schedule, so treat it as a fun estimate.

## Data

`data.js` (Knicks players) and `league.js` (all 30 teams and the league's top 43 scorers) hold a
snapshot from ESPN, Nov 13, 2026. ESPN's standings table lags the player table by a game or two
for some teams. To refresh, edit those files.
