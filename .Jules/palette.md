## Empty States (UX/a11y)
When designing empty states (e.g., no posts, no activity, no data), they should never be plain text. Always provide:
1. A centered ghost icon (SVG) with `aria-hidden="true"` for accessibility.
2. A concise headline or instructional text.
3. An actionable CTA button or link to help the user resolve the empty state.
4. Ensure interactive elements have proper keyboard focus indicators like `focus-visible:outline-2 focus-visible:outline-primary`.
