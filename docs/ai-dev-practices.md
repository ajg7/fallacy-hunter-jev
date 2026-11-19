# From vibe coding to spec-driven, evidence-gated development

Research notes (Nov 2026) on how serious teams use AI coding tools, and the workflow this repo uses as a result.

## 1. What the evidence says

**Feeling faster is not the same as being faster.**

- In METR's randomized trial (early-2025 tools), 16 experienced open-source developers took **19% longer** on tasks in their own repos when using AI. They had expected a 24% speedup, and afterwards they _still believed_ they'd been ~20% faster. The lesson isn't "AI is slow." It's that your sense of progress is not a measurement.
- DORA 2024 (~39k respondents): each 25-point rise in AI adoption went with a **7.2% drop in delivery stability** and a 1.5% drop in throughput, while 75% of people reported feeling more productive. Coverage of DORA 2025 reports better throughput but still more instability. AI speeds up the code that gets written, and stability suffers unless something verifies that code.

**How big tech makes it work.**

- **Google** reports that a large share of new code is AI-generated, but all of it still goes through code review. AI is aimed at narrow, checkable jobs. One example is ML-suggested edits that resolve reviewer comments, where a human accepts or rejects each one. Their AutoCommenter's "useful" rate plateaued around 54% until humans rated its outputs and the team removed the noise. Even the AI's own output gets measured and tuned.
- **Meta's TestGen-LLM** is the clearest model of "proof." They call it _Assured LLM-based Software Engineering_: the LLM proposes, and a chain of mechanical filters decides. A candidate test must **build**, then **pass repeatedly** (to catch flakiness), then **raise coverage**. Anything that fails a filter gets thrown out. 73% of the survivors were accepted by engineers. The guarantee comes from the filters, not from trusting the model.
- **Anthropic's Claude Code guidance**: explore, then plan, then code, then commit. The most important lever is giving the agent a way to verify its own work (tests, type checks, screenshots). Context is limited, so short, durable artifacts (CLAUDE.md, specs) beat long chats.
- **Addy Osmani (Google)**: vibe coding is fine for throwaway prototypes. What separates _AI-assisted engineering_ from it is a **stable verification loop**: tests, CI quality gates, and human review of every AI-touched diff. Without that loop, "done" is just an opinion.

**Spec-driven development (SDD)** has been formalized by GitHub Spec Kit (spec → plan → tasks → implement, works across agents) and AWS Kiro (requirements in EARS notation → design → tasks). The common point: the spec is a durable, versioned artifact that both humans and agents work against. It isn't a one-off prompt. It's worth the overhead for anything you'll maintain, and not for a ten-minute script.

## 2. The three modes, side by side

|                        | Vibe coding                 | Spec-driven                        | Evidence-gated ("proof-driven")             |
| ---------------------- | --------------------------- | ---------------------------------- | ------------------------------------------- |
| Source of truth        | the chat                    | a written spec                     | the spec **plus** the checks that encode it |
| "Done" means           | it looks like it works      | it matches the spec                | named commands pass and the output is shown |
| Where AI judgment sits | everywhere                  | inside the plan and implementation | only proposals; filters and humans decide   |
| Failure mode           | confident, wrong, unnoticed | spec drift                         | slower start, much less rework              |

The progression is mostly about **moving judgment out of vibes and into artifacts**: first into a spec, then into executable checks.

## 3. The workflow in this repo

Each milestone in `docs/build-plan.md` goes through five steps:

1. **Spec** with GitHub Spec Kit, written together _before_ any code: `/speckit-specify` (into `specs/NNN-<name>/spec.md`), then `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`, and `/speckit-analyze`. Don't run `/speckit-implement`, because you write the code. The spec states behavior, acceptance criteria in EARS style ("When <trigger>, the <system> shall <response>"), and what's out of scope. The project rules live in `.specify/memory/constitution.md`. The template below is what each spec has to cover.
2. **Proof first.** You write the tests that encode the acceptance criteria and watch them fail, or for the plan's "break it deliberately" checkpoints, write down your prediction first.
3. **Build** in sidekick mode. Claude names files, insertion points, and signatures. You write the code.
4. **Gate**: `npm run check`, `npm run check:server`, and `npm run test:e2e` when UI flow changed. Paste or show the output. Red means not done.
5. **Review and reflect.** Claude reviews the diff against the spec, and you do the plan's checkpoint (explain cold, predict vs actual). Commit with the spec ID in the message.

Rules that fall out of the research:

- **No claim without output.** "It works" from either of us has to come with a command result.
- **The spec is the handoff layer.** If the spec and the code disagree, fix one of them on purpose. Don't let them drift.
- **Measure the AI too.** Jev is an AI judge, so Phase 5's calibration against your hand-labeled key is the same principle Google applied to AutoCommenter: don't trust a model's confidence until it has been measured on your data.
- **Keep the AI's job narrow and checkable.** Ask Claude for a plan, a review, or a failing-test list. Each of these is something you can verify.

### Spec template

```markdown
# M<x.y> — <title>

## Behavior

<two to four sentences, user-visible>

## Acceptance criteria

- AC1: When <trigger>, the <component> shall <response>.
- AC2: ...

## Proof

| AC  | Check (test file / command / checkpoint) |
| --- | ---------------------------------------- |
| AC1 | `src/...test.ts` › "..."                 |

## Out of scope

- ...

## Prediction (before running)

<the plan's checkpoint prediction, written before the code runs>
```

## Sources

- METR RCT coverage: [InfoWorld](https://www.infoworld.com/article/4020931/ai-coding-tools-can-slow-down-seasoned-developers-by-19.html)
- DORA findings summary: [philippdubach.com](https://philippdubach.com/posts/93-of-developers-use-ai-coding-tools.-productivity-hasnt-moved.) (check exact numbers at dora.dev)
- Google: [Resolving code review comments with ML](https://research.google/blog/resolving-code-review-comments-with-ml/), [AI-assisted code reviews at Google (DX)](https://newsletter.getdx.com/p/ai-assisted-code-reviews-at-google)
- Meta: [Automated Unit Test Improvement using LLMs at Meta (arXiv 2402.09171)](https://arxiv.org/abs/2402.09171v1)
- Anthropic: [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Osmani: [Vibe coding is not the same as AI-assisted engineering](https://addyo.substack.com/p/vibe-coding-is-not-the-same-as-ai)
- SDD: [GitHub Spec Kit](https://github.github.com/spec-kit/), [Spec-Driven Development (arXiv 2602.00180)](https://arxiv.org/html/2602.00180)
