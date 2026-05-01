# bkit Gemini -> Codex Skillset Parity Master Plan

## Mission
- Goal: recreate the installed Gemini `bkit` extension as a Codex-native skillset package that preserves the same practical capabilities for this team.
- Scope baseline: `~/.gemini/extensions/bkit` as installed on 2026-03-13.
- Success target: functional parity for workflows, commands, prompts, docs, and operator experience.

## Reality Check
- Literal byte-for-byte parity is not possible because Gemini extension primitives differ from Codex primitives.
- We will treat "100% 동일 기능" as `user-visible functional parity`:
  - same workflow coverage
  - same skill coverage
  - same agent-role coverage
  - same PDCA lifecycle support
  - same setup/config surface where Codex allows it
  - documented substitutions for Gemini-only hooks/tools

## Source Inventory
- Gemini package summary:
  - 35 skills
  - 21 agents
  - 10-event hook system
  - project levels: Starter, Dynamic, Enterprise
  - PDCA documents: plan, design, analysis, report
- Current install warning:
  - extension installed successfully
  - several Gemini agents fail validation because of invalid Gemini tool names in this local CLI build
- Migration implication:
  - do not copy blindly
  - normalize every tool declaration against Codex capabilities

## Parity Definition
1. Skill parity
   - every bkit skill has either:
     - a Codex skill equivalent, or
     - a documented wrapper/fallback, or
     - a split implementation across multiple Codex skills
2. Agent parity
   - every bkit agent has a Codex prompt spec with role, triggers, inputs, and allowed tools
3. Workflow parity
   - `/pdca plan`, `/pdca design`, `/pdca analyze`, `/pdca iterate`, `/pdca report` equivalent flows exist
4. Context parity
   - Gemini context files are translated into Codex-readable skill instructions or orchestration docs
5. Validation parity
   - representative scenarios confirm same operator outcomes

## Worktree Ownership
- `foundation` -> Codex runtime contract, shared schemas, naming, config, docs skeleton
- `diagnosis` -> PDCA command flow, document generation contract, scoring/check semantics
- `recommendation` -> skill taxonomy mapping and trigger routing
- `course-linking` -> command surface, hook substitution, context injection, external integration wiring
- `history` -> parity matrix, audit logs, completion reports, migration changelog
- `chatbot` -> agent prompt conversion, role prompts, orchestration policies
- `responsive` -> compatibility tests, smoke checks, usage examples, multi-project-level validation

## Deliverables By Worktree

### foundation
- Codex skillset directory layout proposal
- canonical metadata schema for skill and agent definitions
- shared glossary translating Gemini concepts to Codex concepts
- config contract for output style and project level

### diagnosis
- Codex PDCA workflow docs and command wrappers
- templates for:
  - feature plan
  - design doc
  - gap analysis
  - completion report
- parity criteria for `iterate` loop threshold behavior

### recommendation
- full 35-skill mapping matrix:
  - reuse existing local skills where possible
  - identify gaps requiring new Codex skills
  - identify bkit-only patterns to adapt
- trigger dictionary translation for KO/EN and core aliases

### course-linking
- Gemini hook/event mapping to Codex-compatible orchestration points
- command alias strategy for bkit-style entrypoints
- context assembly flow replacing Gemini `GEMINI.md` append behavior

### history
- single source of truth parity checklist
- migration status tracker by skill/agent/workflow
- release readiness report template

### chatbot
- 21-agent conversion matrix:
  - role
  - trigger
  - allowed tools
  - fallback if unsupported
- prompt specs for Codex agent/skill instructions

### responsive
- validation matrix for Starter/Dynamic/Enterprise
- smoke-test scenarios
- operator quickstart and failure-mode guide

## Proposed Merge Order
1. foundation
2. diagnosis
3. recommendation
4. course-linking
5. chatbot
6. history
7. responsive

## Key Risks
- Gemini hook lifecycle has no 1:1 Codex equivalent.
- Some bkit agents reference Gemini-native tools unavailable in Codex.
- Existing local skills may overlap partially, causing naming conflicts.
- "100% 동일" claims will fail unless we define parity at behavior level, not implementation primitive level.

## Guardrails
- Do not overwrite current project skills without explicit compatibility review.
- Prefer reusing existing local skills from `AGENTS.md` inventory before creating duplicates.
- Every gap must be marked as one of:
  - `REUSE`
  - `ADAPT`
  - `NEW`
  - `UNSUPPORTED_WITH_WORKAROUND`

## Exit Criteria
- all 35 skills mapped
- all 21 agents mapped
- PDCA command flow specified end-to-end
- project-level config behavior specified
- validation pack written
- release note includes all intentional deviations from Gemini internals
