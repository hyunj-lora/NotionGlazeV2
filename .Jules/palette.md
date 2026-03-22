# Palette's Critical UX/a11y Lessons

* **ActivityList Empty State:** Empty states should never be blank text. They must include a centered ghost icon (SVG) with `aria-hidden="true"`, a concise headline, and a clear call to action to guide the user.
* **Status Pill Contrast:** Status indicators must use Tailwind CSS theme classes rather than hardcoded hex colors, and they must include explicit `dark:` variants (e.g., `dark:bg-green-900/30 dark:text-green-400 dark:border-green-800`) to ensure accessible text contrast in dark mode.
