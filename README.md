# Andre Amor Personal Website

This repository contains the source code for Andre Amor's personal website built with [Astro](https://astro.build). The site showcases professional experience, provides an overview of technical skills, and hosts a collection of math notes rendered with KaTeX.

## Project Overview
- **Home/Resume**: `/src/pages/index.astro` contains details about education, work experience, skills, and social links.
- **Math Notes**: Markdown files under `/src/pages/notes/` use `NoteLayout.astro` to automatically render math using KaTeX and provide sidebar navigation.

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
2. Start the dev server with `npm run dev`.
3. Create Markdown files under `src/pages/notes/` with frontmatter similar to:

   ```markdown
   ---
   title: "My Topic"
   layout: ../../layouts/NoteLayout.astro
   sidebarItems:
     - { title: "Section 1", href: "#sec1" }
   ---
   ```

Each Markdown heading receives an id derived from its text. Use that id in your `sidebarItems` to create navigation links. Write LaTeX expressions inside `$...$` or `$$...$$` and they will be rendered automatically when the site is built or served.

