# Andre Amor Personal Website

This repository contains the source code for Andre Amor's personal website built with [Astro](https://astro.build). The site showcases professional experience, provides an overview of technical skills, and hosts a collection of math notes rendered with KaTeX.

## Project Overview
- **Home/Resume**: `/src/pages/index.astro` contains details about education, work experience, skills, and social links.
- **Math Notes**: Pages under `/src/pages/notes/` are generated from LaTeX sources and rendered with `NoteLayout.astro` for KaTeX support and sidebar navigation.

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

## Math Notes Workflow

1. Run `npm install` once to install dependencies.
2. Place your `.tex` files anywhere inside the `latex/` directory. Folder names map directly to `src/pages/notes/` when compiled.
3. Run `npm run dev` to build the notes and start the dev server. The script `npm run generate-notes` converts all LaTeX files into HTML fragments and creates the necessary `index.astro` files automatically.

Every build mirrors the directory structure of `latex/` under `src/pages/notes/`. New notes appear on the Math Notes home page without manual edits.
