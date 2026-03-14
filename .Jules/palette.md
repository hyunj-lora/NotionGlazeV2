# Palette's Critical UX/a11y Lessons

* **Studio Builder Accessibility:** When using custom drag-and-drop React components in the builder, it is critical to explicitly provide ARIA roles, ARIA labels, `tabIndex={0}`, and `onKeyDown` handlers for keyboard functionality. Specifically, components like `SortableBlock` require:
  * `role="button"` and `tabIndex={0}` on the main container.
  * A clear `aria-label` describing the block type (e.g., `Select paragraph block`).
  * `onKeyDown` handlers targeting `Enter` and Space keys.
  * Similar focusability (`tabIndex={0}`, `role="button"`) and explicit labelling (`aria-label="Drag Handle"`) for the drag handles.
* **Empty State Icons:** Decorative SVG icons in empty states (such as those in the Inspector or Canvas) must always include the `aria-hidden="true"` attribute so screen readers correctly ignore them.
* **Focus Indication:** Interactive elements in Astro and React components must use explicit Tailwind focus indicators like `focus-visible:outline-2 focus-visible:outline-primary` to ensure keyboard accessibility isn't compromised.
