## Critical UX/a11y Lessons

- **Empty States:** When creating empty states, avoid blank unhelpful text. Instead, provide a visual anchor (ghost icon using SVG with `aria-hidden="true"`), a concise headline, and a clear call-to-action button to guide the user to the next step (e.g., linking to `/dashboard/select-database` when there are no posts synced).
- **Status Indicators:** Avoid using hardcoded hex colors for status indicators (like Published/Draft pills). Instead, use Tailwind CSS color utilities, and ensure accessible contrast in dark mode by utilizing the `dark:` modifier (e.g., `dark:bg-green-900/30 dark:text-green-400 dark:border-green-800`).
