---
title: "LaTeX Integration with Astro & Pandoc"
---

# LaTeX Integration Guide

This guide shows how to integrate LaTeX source files into your Astro site using Pandoc. You’ll convert `.tex` files into HTML fragments styled with KaTeX and embed them in your existing layouts (navbar, breadcrumbs, sidebar, etc.).

## Prerequisites
- **Node.js & npm**
- **Pandoc** installed on your system (https://pandoc.org/)
- An Astro project with `NoteLayout.astro` and `BaseLayout.astro` already set up

## 1. Add a content‑generation script
In your `package.json`, add a `generate-notes` script to run Pandoc. It converts a `.tex` file into an HTML fragment (`content.html`).  A small Lua filter is used to pull the theorem titles out of the LaTeX so that the resulting HTML contains `<p class="theo-title">` elements:

```jsonc
{
  "scripts": {
    "generate-notes": "pandoc latex/MyNote.tex --katex --section-divs --lua-filter=latex/pandoc-filter.lua -o src/pages/notes/my-note/content.html",
    "dev": "npm run generate-notes && astro dev",
    "build": "npm run generate-notes && astro build",
    /* other scripts */
  }
}
```

## 2. Create a wrapper Astro page
After running `generate-notes`, you’ll have `content.html`. Create `index.astro` alongside it:

```astro
---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const title = 'My Note Title';
const sidebarItems = [
  { title: 'Section 1', href: '#section-1' },
  /* more sections */
];
---

<NoteLayout title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
```

This preserves your navbar, breadcrumbs, and sidebar while injecting the Pandoc‑generated HTML.

## 3. Client‑side KaTeX rendering
Pandoc emits raw `<span class="math inline">…</span>` and `<span class="math display">…</span>` nodes. Enable KaTeX in `BaseLayout.astro`:

```astro
---
import 'katex/dist/katex.min.css';
---
<head>
  <!-- other tags -->
  <script defer src="https://cdn.jsdelivr.net/npm/katex@latest/dist/katex.min.js"></script>
  <script is:inline>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.math').forEach(el => {
        katex.render(el.textContent, el, {
          displayMode: el.classList.contains('display'),
          throwOnError: false,
        });
      });
    });
  </script>
</head>
```

## 4. Styling theorem & box environments
Add minimal CSS in your global stylesheet (`src/styles/global.css`) to style `tcolorbox`, `theo`, `theo-title`, `proof`, and display math:

```css
.latex-notes .tcolorbox {
  border: 1px solid #e5e5e5;
  background: #f9f9f9;
  padding: 1rem;
  margin: 1rem 0;
}
.latex-notes .theo {
  background: #f5f5f5;
  border-left: 4px solid #ddd;
  padding: 1rem;
  margin: 1.5rem 0;
}
.latex-notes .theo-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.latex-notes .proof {
  margin: 1rem 0;
  font-style: italic;
}
.latex-notes .math.display {
  display: block;
  text-align: center;
  margin: 1.5rem 0;
}
```

## 5. Generate and serve
Run these commands from your project root:

```bash
npm install        # if not already installed
npm run dev        # regenerates .tex → .html and starts Astro dev server
npm run build      # regenerates and builds for production
```

Now you can maintain your notes in LaTeX, and each build injects properly rendered HTML into your Astro site.
