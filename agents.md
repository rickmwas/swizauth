# TSAUTH AI Instruction Manual (`agents.md`)

This manual dictates the execution rules, document reading order, and tool usage for any AI coding assistant interacting with this workspace.

---

## 1. Reading Context Files
Before executing any file updates, writing new code, or running build tasks, you must read the following 9 context files in the precise order specified below to ensure alignment with TSAUTH rules.

### Enforced Reading Order
1. **[project-overview.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/project-overview.md):** Understand the goals, user types, and MVP bounds of TSAUTH.
2. **[architecture.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/architecture.md):** Map out services (Go, NestJS, Next.js), ports, database schemas, and multi-tenant structures.
3. **[code-standards.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/code-standards.md):** Learn TS requirements, Go conventions, standard error shapes, and logging structures.
4. **[library-docs.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/library-docs.md):** Understand database query models, cache prefixes, and packages structure.
5. **[ui-tokens.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/ui-tokens.md):** Enforce visual constants, fonts, spacing, HSL values, and Tailwind parameters.
6. **[ui-rules.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/ui-rules.md):** Ensure form disabling on load, pagination, action confirmation dialogues, and interactive state rules.
7. **[ui-registry.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/ui-registry.md):** Inspect previously created UI components to reuse instead of recreating.
8. **[progress-tracker.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/progress-tracker.md):** Check what has been built and what feature is current.
9. **[build-plan.md](file:///c:/Users/rickm/OneDrive/Desktop/TSAUTH/context/build-plan.md):** Review the sequence of tasks for the active phase.

---

## 2. Using Installed Core Agent Skills
You must utilize the 5 core agent skills installed under `.agents/skills/` during specific phases of development:

- **`architect`** (under `.agents/skills/architect`): Invoke this skill **before** starting any new feature or phase. Use it to detail database changes, API routes, or code files needed, and align with the developer.
- **`remember`** (under `.agents/skills/remember`): Use this skill at the end of a session to compress current achievements and state, or at the start of a session to restore memory.
- **`review`** (under `.agents/skills/review`): Run this skill **after** completing a code change or implementing a feature. It evaluates:
  - Plan alignment.
  - System architecture rules (e.g. multi-tenant `organization_id` inclusion).
  - TypeScript/Go typing standards.
- **`recover`** (under `.agents/skills/recover`): Trigger this skill if compilation, linting, or database connections fail. Use it to diagnose and resolve errors systematically.
- **`imprint`** (under `.agents/skills/imprint`): Invoke this skill after developing or tweaking visual components to capture new patterns in `context/ui-registry.md`.

---

## 3. Git Branching & Merging Policy
- **Development Branch (`dev`):** All active development, feature implementations, and testing must take place on the `dev` branch.
- **Main Branch (`main`):** Changes must be merged into the `main` branch only after a feature is fully tested, verified stable, and ready for production shipping.

