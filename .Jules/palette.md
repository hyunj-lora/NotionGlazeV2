# UX/a11y Lessons Learned
- In NotionGlaze, empty states must include a centered ghost SVG icon, a concise headline, and a clear call-to-action to avoid feeling blank and unhelpful.
- Status indicators and colored elements (like pills) should avoid hardcoded hex colors. Instead, they must use Tailwind's `dark:` modifier to ensure accessible contrast in dark mode (e.g., `bg-green-100 dark:bg-green-900/30`).
- When using arbitrary Tailwind values for box shadows or colors, always use the `theme()` syntax (e.g., `shadow-[0_0_10px_theme(colors.green.500/50%)]`) instead of hardcoded RGBA values to ensure consistency with the design system.
- Interactive elements without text content, such as icon buttons, must explicitly define an `aria-label` for screen readers.
