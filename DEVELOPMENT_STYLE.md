# Development Style and Architecture of sorgs-v6

## Overview

This project is a self-contained static website built with vanilla HTML and modern ES modules. It intentionally avoids external frameworks, prioritizing a light footprint and direct DOM manipulation. The site is organized around topic categories (history, maths, logic, coding, etc.) and uses a central `main.js` module to provide shared behavior across pages.

## Project philosophy and communication style

- The site is a side project, not an app ecosystem. It is meant to work with old and new browsers, and stability matters more than following every modern library trend.
- The framework exists to keep page files focused on content and function. Framework code is a supporting layer, not the main product.
- Libraries age faster than this project, so the goal is to avoid chasing external dependency updates. Keep the framework working and stable unless a page breaks or a clear bug appears.
- When we work together, the ideal path is to respect your framework choice: fix individual pages first, and only change shared framework code when there is a real bug or missing capability.

## Key architectural patterns

- **Content-first HTML pages**: Individual pages are mostly content, with minimal JavaScript. Shared behavior is provided by `main.js` and `modules/*.js`.
- **Custom module layer**: The project defines several core modules:
  - `layout.js`: HTML structure normalization, dynamic element creation, stylesheet injection, footer helpers, path utilities.
  - `events.js`: Custom event system built on browser events, with `events.get`, `events.create`, `events.capture`, and a `BoundEvent` class.
  - `lang.js`: Multi-language text mapping that reads HTML-like data blocks and applies translations to elements and attributes.
  - `sitemap.js`: Sitemap parsing from `sitemap.xml`, creating `Webpage` entries and dispatching `sitemap_ready`.
  - `toc.js`: Automatic table-of-contents generation and reference list materialization.
  - `typing.js`: Runtime type assertions, XML parsing helpers, and type-check utilities.
- **Event-driven initialization**: `main.js` initializes layout, stylesheets, language support, and sitemap loading, and it reacts to `language_changed` and `sitemap_ready` events.
- **Automated document normalization**: The site enforces a base HTML structure, appends required `meta` and `link` tags, and conditionally loads Prism for syntax highlighting.

## Strengths

- **Clear project intent**: The README documents the site purpose and the architecture expectations well.
- **Minimal external dependency approach**: Great for a static site that should run independently.
- **Good content separation**: Most shared behavior stays in modules; content pages remain readable.
- **Useful page utilities**: Auto TOC, references, sitemap-driven galleries, and language switching are strong features.

## Practical style observations

- The code uses **modern ES modules** and `import.meta.url` for base path calculations.
- There is a custom runtime type-checking style via `typing.assert(...)` rather than TypeScript or JSDoc.
- DOM helper functions use `appendNewElement` and style injection instead of manual DOM creation.
- Language support is implemented by parsing a tree of `LangElement` objects and assigning matching text nodes.
- There is some mixing of `let`, `const`, and `var`, with a preference for `var` in older helper functions.

## Where the project could improve

- **Custom event system complexity**: The custom `BoundEvent` wrapper is elegant, but it also introduces risk and duplication compared to native CustomEvent use.
- **Brittle path derivation**: `layout.script_base_pathname()` depends on string splitting `import.meta.url`; this works but can be brittle if deployment paths change.
- **Potential bugs in language and event code**:
  - `lang.js` has a `lang` attribute check that appears to use incorrect logic when reading `lang` values.
  - `events.js` has a `removeListener` method that references `this.event_target`, which may be a typo and could prevent proper removal.
- **Minimal formal typing/testing**: The runtime assertions are useful, but a more maintainable path would be actual TypeScript or structured tests for core modules.
- **Tight module coupling**: `main.js` currently initializes several concerns in one place; splitting the initialization logic into smaller bootstrapping pieces would make it easier to extend.

## Recommended ideal path

1. Keep the content-first philosophy. Continue letting pages remain mostly HTML.
2. Refine the shared module layer:
   - Keep `layout`, `lang`, `sitemap`, and `toc` as core utilities.
   - Consider making `events` simpler by using native `CustomEvent` or a smaller event dispatcher.
3. Harden the system with small validations and better error signal:
   - Add targeted assertions/tests for `sitemap` parsing, language assignment, and TOC generation.
   - Validate base path resolution in different deployment locations.
4. Improve code hygiene gradually:
   - Use `const`/`let` consistently.
   - Avoid `var` in new code.
   - Write clear module boundaries and minimize global side effects.
5. Document the architecture in the repo so future sessions can continue with a shared mental model.

## What I think failed or can be improved

- The project tries to do many framework-like things with custom code instead of using small existing patterns. That’s not wrong, but it does create maintainability risk.
- Some of the custom plumbing is more complex than necessary, especially around event dispatch and language pairing.
- The codebase is understaffed by documentation at the module level: a future developer will need a clearer mental model of which module owns which behavior.

## How to build on this next session

- Start by fixing the concrete issues in `events.js` and `lang.js`.
- Add a lightweight validation layer or test harness for `sitemap.xml` and page structure.
- Define a small architecture diagram for page initialization and shared module responsibilities.
- Use this note as the starting reference for decisions about module cleanup and the next feature path.

---

Created as a project reference for future development sessions.
