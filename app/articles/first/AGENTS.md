# Page UI & Interaction Rules: Article Page

This document defines the development rules, styles, and layout structure for the article page (app/articles/first/page.tsx).

## Page Structure

The article page is designed to show blog posts in a clear content box. It keeps the retro black dotted background consistent with the main page.

## Styling Rules

1. Content Box:
   - All text and sections must be wrapped inside a container with class name "content-box".
   - "content-box" uses a thick magenta outset border (5px outset #ff00ff) and navy blue background (#000080) for retro look.
   - Text color must remain white (#ffffff).

2. Link Style:
   - Hover state for links must show red (#ff0000) and change cursor to crosshair.
   - Standard underlines for links must be preserved.

3. Back Link:
   - A link pointing back to the homepage ("/") must always be placed at the bottom of the content-box formatted as: `[ 返回主页 ]`.
