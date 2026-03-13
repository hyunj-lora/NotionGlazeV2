# Palette's Journal - NotionGlaze UX/a11y Lessons

## Critical UX/a11y Lessons

* **Studio Builder Canvas Accessibility**: In the Studio Builder, the Canvas blocks require explicit keyboard accessibility features (like `role="button"`, `tabIndex={0}`, `onKeyDown` for selection with Enter/Space, and visible focus indicators like `focus-visible:outline-2 focus-visible:outline-primary`) because standard HTML elements lack this natively. Additionally, interactive drag handles (like those from `dnd-kit`) must have explicitly provided ARIA labels (e.g. `aria-label="Drag Handle"`) and be able to receive focus.
