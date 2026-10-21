# Data Sabotage

A multiplayer social deduction game set in a data team, in Indonesian. Somewhere in the office, insiders are corrupting the pipeline. Everyone else has to find them before the data is ruined.

## How it plays

- Players join a room and get a secret role
- **Night**: insiders pick a target, special roles use their skills
- **Day**: everyone discusses in chat or video and builds a theory
- **Vote**: the group votes someone out
- The data team wins by removing every insider. The insiders win by taking over the team.

## Roles

Three teams and 18 roles, each with a skill and a chibi character:

| Team | Roles |
|---|---|
| Insider | Shadow Analyst, Mole Engineer, Rogue Admin |
| Data team | Data Analyst, Data Steward, Data Engineer, Data Architect, Data Scientist, Database Administrator, Data Quality Engineer, Analytics Engineer, Data Annotator, ML Engineer, BI Analyst, Data Product Manager, Head of Data |
| Freelancer | Data Consultant, Data Intern |

The in game pages `/cara-main` (how to play) and `/role-book` explain every role.

## Features

- Room lobby with room list, join requests, and a game master
- Real time game state over Socket.IO
- Video and voice chat between players with PeerJS (WebRTC)
- Storyline narration, countdown timers, and a sound engine
- QA test suite with Selenium

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Socket.IO, PeerJS, tsx. Deployed on Railway.

## Getting started

```bash
npm install
npm run dev:server   # game server (Socket.IO)
npm run dev          # Next.js app on http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Tests:

```bash
npm run test:qa:local
```

## Project structure

```
src/app/          # pages: home, room/[id], cara-main, role-book
src/components/   # game UI, video chat, chibi characters, settings
src/lib/          # game engine, roles, storyline, socket client, audio
server/           # Socket.IO game server
tests/            # QA tests
```
