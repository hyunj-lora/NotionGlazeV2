# Palette's UX Journal

## Critical UX/a11y Lessons
- **Dark Mode Compatibility for Status Indicators:** Avoid using hardcoded hex colors for badges or status pills (e.g. ActivityList). Always use Tailwind utility classes with the `dark:` variant (like `dark:bg-green-900/30 dark:text-green-300`) to ensure contrast and accessibility in both light and dark modes.
- **Premium Empty States:** Standardize empty states across components so they don't look blank or basic. Include a centered ghost icon, a concise bold headline, descriptive muted text, and a primary call-to-action button with proper focus styles (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`).