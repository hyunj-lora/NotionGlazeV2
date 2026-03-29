# Critical UX/a11y Lessons

* **Empty States**: Never use plain text for empty states. Always include a centered ghost icon (SVG) with `aria-hidden="true"`, a concise headline, descriptive text, and an actionable CTA link/button. This is crucial for onboarding user experience.
* **Focus Indicators**: Always ensure interactive elements (like CTA buttons in empty states) have proper keyboard focus indicators using Tailwind's `focus-visible` classes, e.g., `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.
* **Hardcoded Colors**: Avoid using hardcoded hex colors in CSS files and `<style>` blocks. Prefer using CSS variables linked to the theme (e.g., `hsl(var(--primary))`) or Tailwind CSS 4 variables (e.g., `var(--color-green-100)`).
