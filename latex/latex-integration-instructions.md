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
First, mirror your site taxonomy in the `latex/` directory. For example:

```text
latex/
  math/
    abstract-algebra/
      group-theory/
        subgroups.tex
        normal-subgroups.tex
      ring-theory/
        rings.tex
    real-analysis/
      measure-theory.tex
  cs/
    algorithms/
      algorithms.tex
      dynamic-programming.tex
    data-structures/
      trees.tex
      graphs.tex
```

Next, add a Node script (`scripts/generate-notes.js`) that:

- Recursively scans `latex/`, finds each `.tex` file, and compiles it via Pandoc into `content.html`.
- Generates an `index.astro` for every topic folder, injecting the compiled HTML and wiring up the layout.
- Updates each section’s `index.astro` to display a grid of topic cards on the homepage.

Run it via your npm scripts:

```bash
npm install
npm run generate-notes
```

Below is a minimal example of `scripts/generate-notes.js` (adjust filters, CSS, etc. as needed).  
__Note on subtopics:__ if any topic folder contains one or more subdirectories, the script will detect them as subtopics. It will then generate an index page listing those subtopics (using a `.subtopic-grid`) and a separate note page for each, rather than treating the topic as a single note.

```js
#!/usr/bin/env node

import fs from 'fs/promises';
import { rmSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function humanize(name) {
  return name
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function generate() {
  const root = process.cwd();
  const latexDir = path.join(root, 'latex');
  const pagesDir = path.join(root, 'src', 'pages');

  const sections = await fs.readdir(latexDir, { withFileTypes: true });
  for (const sec of sections.filter(d => d.isDirectory())) {
    const name = sec.name;
    const secLatex = path.join(latexDir, name);
    const secPages = path.join(pagesDir, name);

    await fs.mkdir(secPages, { recursive: true });
    for (const item of await fs.readdir(secPages)) {
      if (item !== 'index.astro') rmSync(path.join(secPages, item), { recursive: true, force: true });
    }

    const topics = await fs.readdir(secLatex, { withFileTypes: true });
    const indexItems = [];
    for (const t of topics.filter(d => d.isDirectory())) {
      const topic = t.name;
      const topicLatex = path.join(secLatex, topic);
      const topicPages = path.join(secPages, topic);
      await fs.mkdir(topicPages, { recursive: true });

      for (const file of await fs.readdir(topicLatex)) {
        if (!file.endsWith('.tex')) continue;
        const tex = path.join(topicLatex, file);
        const out = path.join(topicPages, 'content.html');
        console.log(`Building ${tex}`);
        execSync(
          `pandoc "${tex}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${out}"`,
          { stdio: 'inherit' }
        );
      }
      const title = humanize(topic);
      await fs.writeFile(
        path.join(topicPages, 'index.astro'),
        `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const sectionName = '${name}';
const sectionTitle = '${humanize(name)} Notes';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`
      );
      indexItems.push({ title, href: `/${name}/${topic}` });
    }

    const links = indexItems
      .map(i => `      <a href="${i.href}" class="topic-card">
        <h2>${i.title}</h2>
      </a>`)
      .join('\n');
    await fs.writeFile(
      path.join(secPages, 'index.astro'),
      `---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="${humanize(name)} Notes">
  <div class="container">
    <h1>${humanize(name)} Notes</h1>
    <div class="topic-grid">
${links}
    </div>
  </div>
</BaseLayout>
`
    );
  }
}

generate().catch(e => { console.error(e); process.exit(1); });
```

Update your `package.json` scripts:

```jsonc
{
  "scripts": {
    "generate-notes": "node scripts/generate-notes.js",
    "dev": "npm run generate-notes && astro dev",
    "build": "npm run generate-notes && astro build"
  }
}
```

This workflow will automatically compile and scaffold all your notes while preserving a clean, static routing structure.

## 2. Create a wrapper Astro page
After running `generate-notes`, you’ll have `content.html`. Create `index.astro` alongside it:

```astro
---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const sectionName = 'math'; // or 'cs' for Computer Science Notes
const sectionTitle = 'Math Notes'; // or 'Computer Science Notes' for CS Notes
const title = 'My Note Title';
const sidebarItems = [
  { title: 'Section 1', href: '#section-1' },
  /* more sections */
];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} title={title} sidebarItems={sidebarItems}>
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
