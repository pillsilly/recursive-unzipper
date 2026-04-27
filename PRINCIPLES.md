Project Principles
==================

1. Tests: write a TODO first
   - Every new behavior or bug fix must start with a test file that contains clear, minimal TODOs describing the expected behavior.
   - Do not implement the behavior until a maintainer or the task instruction explicitly says to implement; the TODOs are the contract.

2. Small, verifiable changes
   - Prefer small PRs that change one concern at a time.
   - Each change should include or update unit tests and run cleanly with the project's test runner.

3. Detection-first when possible
   - For file-type detection prefer deterministic magic-byte checks over relying on file extensions.
   - Be conservative: when detection is ambiguous, treat as unknown and fail loudly rather than silently guessing.

4. Plugins and mapping
   - Plugins may register file-type mappings via `appendExtMapping`; keep mappings explicit.
   - Tests for plugins must include a TODO describing expected plugin contract before implementation.

5. Quality gates
   - New code must pass lint/type checks and unit tests before merge.
   - Add a small smoke test when adding CLI features.

6. Commit and PR etiquette
   - Use Conventional Commits for commits: `feat(...)`, `fix(...)`, `test(...)`, etc.
   - Document design decisions in PR descriptions.

7. Safety and transparency
   - Do not exfiltrate secrets or run network calls in tests.
   - Log errors with actionable messages and preserve original error when returning or rethrowing.

These principles are intended to keep the codebase predictable, testable, and easy to review. Follow them when adding tests and implementations.
Project Principles

1. Tests & Todos
   - Always write a clear, actionable todo for a feature or bug before writing its tests.
   - Tests must be written only after the todo is created and marked in-progress.
   - Do not implement production code until tests are present and failing (red). Only implement when explicitly instructed to proceed.

2. Small, Verifiable Changes
   - Prefer small commits that are easy to review and validate.
   - Each change must include a short description and, when relevant, a unit test or smoke test.

3. Conservative Runtime Changes
   - Avoid adding large dependencies. Prefer using built-in Node APIs when feasible.

4. Automation
   - Run tests and basic linting after making changes. Fix regressions before committing.


