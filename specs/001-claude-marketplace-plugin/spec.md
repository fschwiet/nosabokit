# Feature Specification: Claude Marketplace Plugin

**Feature Branch**: `001-claude-marketplace-plugin`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "This repository will provide a claude plugin in a claude marketplace. The README.md will document how to install the marketplace and plugin from a github url. The initial plugin functionality is described by the files in reference-documents/"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install Plugin from GitHub URL (Priority: P1)

A developer wants to improve Claude Code's behavior on Windows by installing this plugin from the marketplace. They follow the README to add the marketplace and plugin using its GitHub URL, and from that point forward Claude Code automatically enforces the two pre-tool hooks whenever it runs commands.

**Why this priority**: This is the end-to-end install flow. Without it, no user can benefit from the plugin. Everything else depends on a working install.

**Independent Test**: Can be fully tested by following the README instructions and confirming the plugin is active by observing that blocked commands are rejected in a Claude Code session.

**Acceptance Scenarios**:

1. **Given** a fresh Claude Code installation, **When** a user adds the marketplace using the GitHub URL documented in the README, **Then** the marketplace is available as a plugin source in Claude Code.
2. **Given** the marketplace is configured, **When** a user installs this plugin from it, **Then** Claude Code activates the plugin's pre-tool hooks for all subsequent command executions.
3. **Given** the README instructions, **When** a user follows them step-by-step, **Then** they can complete the install in a single session without needing external support.

---

### User Story 2 - Block Backslash Paths in Commands (Priority: P2)

A developer on Windows runs Claude Code and asks it to execute a shell command containing a Windows-style backslash path (e.g., `C:\Users\name\src`). The plugin intercepts the command before it runs and blocks it, explaining that backslash paths are mangled by Git Bash and asking Claude to use forward slashes instead.

**Why this priority**: This protects against a class of silent failures where `\g`, `\s`, etc. become escape sequences, causing incorrect behavior that is hard to debug.

**Independent Test**: Can be tested independently by triggering a command with a Windows backslash path and confirming the block message is returned before the command executes.

**Acceptance Scenarios**:

1. **Given** the plugin is active, **When** Claude Code is about to run a command containing a pattern like `C:\Users\name`, **Then** the command is blocked and a message explains to use forward slashes (e.g., `C:/Users/name`).
2. **Given** a command with a heredoc (`<<`), **When** the command also contains backslashes, **Then** the command is NOT blocked (heredocs are exempt).
3. **Given** a command that uses forward slashes only, **When** the plugin checks it, **Then** the command passes through without interference.

---

### User Story 3 - Block Redundant cd Prefix (Priority: P3)

A developer on Windows has Claude Code issue a command like `cd C:/code/myproject && npm test` where `C:/code/myproject` is already the current working directory. The plugin detects this as a redundant `cd` and blocks it, telling Claude to just run `npm test` directly.

**Why this priority**: Redundant `cd` prefixes trigger unnecessary permission prompts and add noise. Blocking them keeps the session clean and reduces friction.

**Independent Test**: Can be tested independently by triggering a command that `cd`s into the current working directory before running a second command, and confirming the block message is returned.

**Acceptance Scenarios**:

1. **Given** the plugin is active and the current working directory is `/code/myproject`, **When** Claude Code is about to run `cd /code/myproject && git status`, **Then** the command is blocked and the message instructs Claude to run `git status` directly.
2. **Given** a command that `cd`s to a *different* directory before running another command, **When** the plugin checks it, **Then** the command passes through without interference.
3. **Given** a simple command with no `cd` prefix, **When** the plugin checks it, **Then** the command passes through without interference.

---

### Edge Cases

- What happens when a command contains both a backslash path and a redundant `cd`? Both hooks run; the first match blocks the command.
- How does the system handle commands with quoted paths that include backslashes? The backslash path check applies regardless of quoting (except heredocs).
- What happens if the plugin is installed but no pre-tool hooks fire? The plugin is considered broken; the README should document how to verify the plugin is active.
- What happens when the GitHub repository is unavailable during installation? The install fails gracefully with an error message from the Claude marketplace tooling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be publishable as a plugin to a Claude Code marketplace via a GitHub URL.
- **FR-002**: The README MUST document the steps to add the marketplace from a GitHub URL.
- **FR-003**: The README MUST document the steps to install this plugin from the marketplace.
- **FR-004**: Upon installation, the plugin MUST register a pre-tool hook that blocks shell commands containing Windows-style backslash paths (matching the pattern `[A-Za-z]:\[A-Za-z]`).
- **FR-005**: The backslash-path hook MUST skip heredoc commands (those containing `<<`) without blocking them.
- **FR-006**: The backslash-path hook MUST return a message explaining that backslash paths are mangled by Git Bash and directing the caller to use forward slashes.
- **FR-007**: Upon installation, the plugin MUST register a pre-tool hook that blocks shell commands of the form `cd <target> && <rest>` when `<target>` is equal to the current working directory.
- **FR-008**: The redundant-cd hook MUST return a message identifying the redundant `cd` and providing the remaining command (`<rest>`) for the caller to run directly.
- **FR-009**: Both hooks MUST operate as pre-tool hooks — they intercept commands before execution, not after.
- **FR-010**: Hooks MUST NOT interfere with commands that do not match their respective patterns.

### Key Entities

- **Plugin**: The installable unit distributed via the marketplace; contains hook definitions and metadata.
- **Marketplace**: The Claude Code plugin registry, sourced from a GitHub URL, from which plugins are discovered and installed.
- **Pre-tool Hook**: A named check that runs before a shell command executes; can block the command and return a reason.
- **Command**: The shell string that Claude Code is about to execute; the input evaluated by each hook.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with no prior knowledge of this plugin can install it end-to-end by following the README in under 5 minutes.
- **SC-002**: 100% of commands containing Windows-style backslash paths (outside heredocs) are blocked before execution when the plugin is active.
- **SC-003**: 100% of commands matching the `cd <cwd> && <rest>` pattern are blocked before execution when the plugin is active.
- **SC-004**: 0% of non-matching commands are incorrectly blocked by either hook.
- **SC-005**: Each blocked command surfaces a clear, actionable message that tells the caller exactly what to change.

## Assumptions

- The Claude Code marketplace supports distributing plugins from public GitHub repository URLs.
- Plugin hooks are expressed in the language supported by the Claude Code marketplace runtime.
- The plugin targets Claude Code running on Windows; the backslash-path check is Windows-specific but harmless on other platforms.
- Users have Git and a working Claude Code installation before following the README.
- The `checkRedundantCd` hook receives both the command string and the current working directory as inputs.
- Mobile support and GUI configuration are out of scope for v1.
