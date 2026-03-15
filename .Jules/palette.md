# Palette's UX Journal

## Critical UX & Accessibility Lessons

1. **Empty States:** When a list or container is empty, avoid a blank space. Include a centered ghost icon (SVG with low opacity and `aria-hidden="true"`), a concise and helpful headline, and a clear call to action to guide the user on what to do next. This maintains a premium feel and prevents confusion.
2. **Status Indicators & Dark Mode:** Hardcoded hex colors for background and text in status indicators (like pills) can break contrast requirements in dark mode. Always use theme variables or Tailwind's `dark:` modifiers (e.g., `dark:bg-green-900/30 dark:text-green-300`) to ensure accessible color contrast across all themes.