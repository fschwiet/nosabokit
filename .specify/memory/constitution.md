<!--
  SYNC IMPACT REPORT
  Version change: N/A → 1.0.0

  Modified principles: None (initial constitution — all sections new)
  Added sections:
    - Core Principles (I–V)
    - Technology Stack
    - Development Workflow
    - Governance
  Removed sections: None

  Templates reviewed:
  - .specify/templates/plan-template.md ✅ reviewed — no changes required;
    Constitution Check section is dynamically resolved at plan time
  - .specify/templates/spec-template.md ✅ reviewed — no changes required
  - .specify/templates/tasks-template.md ✅ updated — removed "tests are optional"
    language that conflicts with Principle I (mandatory automated tests)

  Follow-up TODOs: None
-->

# Nosabokit Constitution

## Core Principles

### I. Automated Testing (NON-NEGOTIABLE)

All code MUST have automated tests. No feature, bugfix, or refactor is complete
without corresponding test coverage. Tests MUST be written before implementation
(TDD) and MUST pass before merging. There are no exceptions.

**Rationale**: Untested code is an unverifiable liability. Tests are the primary
mechanism for validating correctness and preventing regressions at scale.

### II. TypeScript-First

TypeScript is the required implementation language for all new code. Plain
JavaScript is not permitted in new source files. Strict mode MUST be enabled
(`"strict": true` in `tsconfig.json`). Type definitions MUST be explicit for
all public interfaces and exported symbols.

**Rationale**: TypeScript's type system catches whole classes of bugs at compile
time and makes codebases easier to navigate, refactor, and onboard into.

### III. Quality Gates (NON-NEGOTIABLE)

All code MUST pass every gate below before merging to any protected branch:

- **Prettier**: Formatting checked via `prettier --check` using project config
- **ESLint**: Linting via `eslint` using project ESLint config
- **TypeScript compiler**: Type correctness via `tsc --noEmit` using project
  `tsconfig.json`

Configuration for each tool MUST be committed to source control. No gate may be
bypassed without an explicit, documented, and approved justification in the PR.

**Rationale**: Automated gates remove subjective formatting debates and catch
errors reviewers might miss. Configs in source control ensure reproducibility.

### IV. YAGNI (You Aren't Gonna Need It)

Code MUST NOT be written for hypothetical future requirements. Every abstraction,
parameter, or configuration option MUST have a current, demonstrated use case.
Premature generalization is a violation of this principle.

**Rationale**: Unused code is a maintenance burden and obscures intent. Building
only what is needed now keeps the codebase lean and changeable.

### V. KISS (Keep It Simple, Stupid)

The simplest solution that satisfies current requirements MUST be chosen.
Complexity MUST be justified by a concrete, present need. Three similar lines
are preferable to a premature abstraction. Design for hypothetical future
requirements is prohibited (see Principle IV).

**Rationale**: Simple code is easier to read, test, debug, and evolve.
Complexity compounds; simplicity pays dividends over time.

## Technology Stack

- **Language**: TypeScript (latest stable)
- **Runtime**: Node.js LTS
- **Formatter**: Prettier
- **Linter**: ESLint
- **Type checker**: TypeScript compiler
- **Test framework**: Vitest

All tool configurations MUST reside in source control at the project root or at
an explicitly documented location within the repository.

## Development Workflow

1. Write failing tests before implementation (Principle I — TDD).
2. Implement the minimum code to make tests pass (Principles IV and V — YAGNI +
   KISS).
3. Run all quality gates locally before opening a PR (Principle III).
4. PRs MUST pass all quality gates in CI before requesting review.
5. Reviewers MUST verify constitution compliance before approving.

## Governance

This constitution supersedes all other documented practices. Conflicts are
resolved in favor of the constitution.

**Amendment procedure**:

1. Propose the change with rationale in a PR targeting this file.
2. Changes require at least one reviewer approval.
3. Increment `CONSTITUTION_VERSION` per semantic versioning:
   - MAJOR: backward-incompatible principle removal or redefinition
   - MINOR: new principle or section added, or materially expanded guidance
   - PATCH: clarifications, wording, or non-semantic refinements
4. Update `LAST_AMENDED_DATE` to the amendment date (ISO 8601: YYYY-MM-DD).

**Compliance**: All PRs and code reviews MUST verify adherence to the Core
Principles. Non-compliance blocks merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-22
