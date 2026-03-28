# Palette's Journal

## Critical UX/a11y Lessons

- In custom interactive components and drag handles (like those from `dnd-kit`), explicit ARIA labels, `focus-visible` utility classes, and custom `onKeyDown` logic are necessary.
- Intercept spacebar presses (`e.preventDefault()`) on interactive elements to prevent unwanted page scrolling during keyboard navigation, ensuring a native app-like experience.
- When wrapping `dnd-kit` elements with an `onKeyDown` handler, always forward the event to `dnd-kit`'s built-in `listeners.onKeyDown` so you don't break the drag functionality.