# Palette's Journal

## Critical UX/a11y Lessons

- **Studio Builder Accessibility:** In the Studio Builder, blocks and drag handles (`SortableBlock.tsx`) must be fully keyboard accessible. It's crucial to implement `tabIndex={0}`, `role="button"`, `aria-label` (e.g., "Drag Handle"), and `onKeyDown` handlers. Visual focus indicators should be explicitly styled using Tailwind's `focus-visible` classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary`) to ensure a premium and accessible experience. When adding custom keyboard handlers to draggable elements like those from `dnd-kit`, the default `listeners.onKeyDown(e)` must be called to preserve built-in library behaviors.