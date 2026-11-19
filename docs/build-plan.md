# Build plan — Fallacy Hunter (web + Jev)

Adapted from the Notion Odyssey "Build Fallacy Hunter". Phases, patterns, checkpoints and Definition of Done are unchanged. Only the stack changes: **React + Vite client, NestJS server, Jev via `@typesafe-ai/sdk` on the server.** This file is the source of truth; the Notion page still says Pygame.

Workflow per milestone: see `docs/ai-dev-practices.md` §3 (spec → proof first → build in sidekick mode → gate → review/reflect).

## The game

Race the clock labeling short arguments by their fallacy before the Judge (Jev) rules (**Beat the Judge**), then draw a fallacy card and write an argument that commits it convincingly enough to get past the Judge (**Forge**).

**Learning objective:** Build with Jev (questions that survive a literal reading, thresholds calibrated on your own labeled data), and learn the patterns that keep a real-time game responsive around a slow, async judge.

**Patterns:** Game Loop, Event Queue, State, Type Object, Command.

**Vertical slice:** one timed Beat the Judge round of eight arguments, one Forge card, then a combined score screen.

## Architecture decisions

| Decision                                         | Web adaptation                                                                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jev called directly from the game                | **Jev is called only from Nest** (`/api/judge/...`). The key stays server-side, so the plan's "would need a proxy" problem is solved by default. One `JudgeService` owns the provider.                    |
| Jev on a worker thread, answers via queue        | No threads. The **browser `fetch` is already async**, so the hazard becomes _promise callbacks mutating state_. Verdicts are pushed as tagged events onto a client queue that the loop drains each frame. |
| Game Loop                                        | A `requestAnimationFrame` loop using `performance.now()` deltas, in a plain-TS module outside React. React (or a canvas) renders from a Zustand store.                                                    |
| Hand-written, hand-labeled deck                  | Unchanged: data files, your labels are the answer key.                                                                                                                                                    |
| Scoring is a pure function; thresholds in config | Unchanged: `scoring.ts` pure function plus a thresholds config file.                                                                                                                                      |
| Beat the Judge rule                              | Unchanged: points for agreeing with a confident Judge, a bonus for being right (per your key) when Jev is wrong or unsure, and a failed call means "Judge absent" with no penalty.                        |
| Fallacy definitions go into Jev's state as prose | Unchanged. The fallacy data is owned server-side (it feeds Jev's criteria) and served to the client for cards. Decide the exact shape in the M4.2 spec.                                                   |

## Phase 1 — One Argument, One Verdict · _Game Loop_

**Goal:** One argument and a countdown. Label it with a number key, and the Judge's verdict appears next to yours.

### M1.1 — Rectangles and a real clock

One argument wrapped in a box, a countdown bar, and keys 1–9 mapped to eight fallacies plus "no fallacy." The answer is checked against a hard-coded key. The countdown runs on elapsed time.

- **Wall:** A timer that ticks a fixed amount per frame runs at the display's refresh rate (60/120/144 Hz), so the round's length depends on the machine.
- **Concept:** Decoupling game time from frame rate.
- **Checkpoint:** Break it on purpose. Tick a fixed amount per rAF frame, predict the round length at 60 Hz and when throttled (DevTools CPU throttling or capping the loop to 30 fps), then run both.
- **Assets:** placeholders.

### M1.2 — The Judge speaks (and the round stalls)

First Jev request, in a Nest `JudgeService` behind `POST /api/judge/label`. The state holds the argument plus every fallacy definition in prose, and one **Choice** question offers the eight fallacies plus an explicit "none." Show the winner, the full probability spread, and the confidence. Naively, `await` the verdict _inside the round flow_: input and countdown wait until it returns.

- **Wall:** The round stalls for the length of every call. The browser doesn't freeze the way Pygame would, but the _game_ does. Log the longest stall.
- **Concept:** The shape of a Jev request (state, instructions, criteria), and why "none" must be an option.
- **Checkpoint:** Explain cold the difference between the winner's probability and the confidence number. Write an argument where they diverge sharply and confirm it.

## Phase 2 — The Judge Deliberates in the Background · _Event Queue_

**Goal:** The loop never waits on Jev. Verdicts arrive as events that the loop drains once per frame.

### M2.1 — The naive callback (wrong on purpose)

Fire the request without awaiting it, and let `.then` write the verdict straight into the store. Add a skip key.

- **Wall:** Skip while a call is in flight and the old argument's verdict lands on the new one. It works most of the time.
- **Concept:** Async callbacks mutating shared state. The rule: only the loop's update step touches game state.
- **Checkpoint:** Write down the exact key sequence and timing that shows the wrong verdict _before_ running, then reproduce it. (Tip: add an artificial server delay.)

### M2.2 — Verdicts as events

The request's resolution posts a `JudgeAnswered` or `JudgeFailed` event, tagged with its request id, onto a queue. Update drains the queue and drops events for arguments already passed. A timeout (`AbortController`) counts as a failure.

- **Concept:** Event Queue (send time vs handle time), contrasted with Observer.
- **Checkpoint:** Use a bad API key mid-round. Predict what the player sees and what happens to the score, then confirm "Judge absent," no penalty, no crash.

### M2.3 — Judge the next one early

While the player reads argument N, request N+1. The queue holds several verdicts keyed by argument.

- **Concept:** Hiding latency with prefetching.
- **Checkpoint:** In three sentences, why not send all eight arguments in one request with eight questions? Use what TypeSafe says about irrelevant state and accuracy, and what one failed call would cost.

## Phase 3 — A Full Round · _State_

**Goal:** An eight-argument round with a title screen, reveals, and a round score.

### M3.1 — The flag swamp

Grow Phase 2 into a full round using booleans (`awaitingInput`, `judgePending`, `revealing`, `roundOver`) and a hard-coded list, until the first impossible-transition bug shows up.

- **Checkpoint:** Before refactoring, list every flag combination your code can reach and mark the meaningless ones. Count them.
- **Assets:** SPR-01, UI-01, UI-02, FNT-01, FNT-02, BG-01, SFX-01–07.

### M3.2 — States as objects

Title, Reading, Reveal and Round Results become state objects with `enter/exit/input/update/draw` and explicit transitions. Decide per state whether a verdict event is applied, held, or ignored.

- **Checkpoint:** Draw the state diagram from memory in Mermaid, marking which states accept verdict events, then compare it with the code.

### M3.3 — Scoring the Judge

`score(label, key, judgeAnswer, thresholds) → points` is a pure function, and the "confident" cutoff is in config.

- **Checkpoint:** Defend using confidence rather than the winner's probability. Write one argument where they'd give different scores, and make it a test.

## Phase 4 — Forge · _Type Object_

**Goal:** Draw a card, type an argument, and the Judge rules. Fallacies are defined once, as data.

### M4.1 — Forge the naive way

Text entry and a Forge screen. One request carries three questions: a **Noul** (does it commit the drawn fallacy, with both sides described), a **Choice** (which fallacy it most commits, including "none"), and a **Score** for subtlety over five concrete levels. Copy the fallacy details wherever they're needed.

- **Checkpoint:** Predict how many places you'll edit to add tu quoque, then add it and count.
- **Assets:** SPR-02, SPR-03, UI-03, UI-04, SFX-08, SFX-09.

### M4.2 — Fallacies as data

One fallacies data file (id, display name, icon index, definition prose, points) and a separate deck file of ~40 labeled arguments. Both modes and scoring read the loaded types.

- **Checkpoint:** Add appeal to nature, with three deck arguments, without touching code. If any code changed, the Type Object didn't land.

### M4.3 — Close the cheats

Add a Noul that catches arguments that name or describe a fallacy instead of committing one, and tighten the criteria until literal readings don't let cheats through.

- **Checkpoint:** Write five cheating entries and predict which get through. Fix every one that does in the criteria, not in code. Keep the five as a regression fixture.
- **Assets:** SFX-10.

## Phase 5 — Replay the Judge · _Command_

**Goal:** Sessions are logged as commands plus the Jev answers they produced, and they can be re-scored under new thresholds with no new calls. The full sixty-second game plays end to end.

### M5.1 — Actions as commands

Label, skip and submit-forge become command objects that the current state executes. Each command and its Jev answer is appended to a session log (JSONL written by the server is the likely choice; decide in the spec).

- **Checkpoint:** Explain cold what in the log lets replay skip Jev, and what breaks if only winning labels were logged.

### M5.2 — Calibrate against your key

A replay tool (a server-side script) reports Jev's agreement with your key per fallacy, every confident-and-wrong case, and a threshold sweep.

- **Checkpoint:** Predict the two most-confused fallacies and the cutoff where confident-and-wrong disappears, then run it.

### M5.3 — The sixty-second game

Title, a Beat the Judge round, one Forge card, and a combined score with the Judge's reaction. Tune from replay data.

- **Checkpoint:** Play three games, then watch someone play one without explaining anything and note every hesitation.
- **Assets:** MUS-01, SPR-04, SFX-11.

## Done when

- The full game plays title → round → Forge → combined score, and it's fun for sixty seconds.
- The loop never waits on Jev, and a dead network gives "Judge absent," never a crash or a penalty.
- Adding a fallacy is a data-only change.
- Replay reproduces scores without calling Jev, and there is a measured agreement rate against your key.
- Every M4.3 cheat is caught (regression fixture passes).

## Not in the slice

Duel mode · LLM-written explanations · generated arguments · pulling real posts (that's Sauros) · leaderboards/accounts · public deployment · the Star-Cross dinner scene.

## Progress

| Milestone | Spec                 | Status |
| --------- | -------------------- | ------ |
| M1.1      | `specs/` (Spec Kit)  | spec   |
