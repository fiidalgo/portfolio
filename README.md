# Andre Amor Personal Website

This repository contains the source code for Andre Amor's personal website built with [Astro](https://astro.build). The site showcases professional experience, provides an overview of technical skills, and hosts a collection of math notes rendered with KaTeX.

## Project Overview
- **Home/Resume**: `/src/pages/index.astro` contains details about education, work experience, skills, and social links.
- **CS & Math Notes**: Pages under `/src/pages/{cs,math}/` are generated from LaTeX sources and rendered with `NoteLayout.astro` for KaTeX support and sidebar navigation.

## Project Structure

```text
/
├── public/                 Static assets and images
├── src/
│   ├── components/         Reusable UI components
│   ├── layouts/            BaseLayout and NoteLayout templates
│   ├── pages/              Site pages and math notes
│   └── styles/             Global CSS
└── package.json
```

## Commands

Run the following from the project root:

| Command        | Action                                                |
| :------------- | :---------------------------------------------------- |
| `npm install`  | Install dependencies                                  |
| `npm run dev`  | Start the dev server at `localhost:4321`              |
| `npm run build`| Build the production site to `./dist/`                |
| `npm run preview`| Preview the build locally                            |
| `npm run astro ...` | Run additional Astro CLI commands                |

## Notes Workflow

1. Run `npm install` once to install dependencies.
2. Place your `.tex` files anywhere inside the `latex/cs` or `latex/math` directories. Folder names map directly to `src/pages/{cs,math}/` when compiled.
3. Run `npm run generate-notes` to convert all LaTeX files into HTML fragments and create the necessary `index.astro` files automatically.

   **Optional subtopics:**  
   If a topic directory contains subfolders, each subfolder is treated as a subtopic. The generator will scaffold an index page for each subtopic and render a `.subtopic-grid` on the parent topic’s index. If there are no subfolders, it falls back to the original single-note behavior.

   **Breadcrumbs in subtopics:**  
   Subtopic index pages now include breadcrumb navigation (Section &rarr; Topic) for better context. Individual subtopic content pages include Section &rarr; Topic &rarr; Subtopic breadcrumbs.

Every build mirrors the directory structure of `latex/{cs,math}` under `src/pages/{cs,math}/`. New notes appear on their respective home pages without manual edits.
