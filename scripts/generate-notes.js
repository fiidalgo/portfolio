#!/usr/bin/env node

import fs from 'fs/promises';
import { rmSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function humanize(name) {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generate() {
  const root = process.cwd();
  const latexDir = path.join(root, 'latex');
  const pagesDir = path.join(root, 'src', 'pages');

  const sections = await fs.readdir(latexDir, { withFileTypes: true });
  for (const section of sections.filter(d => d.isDirectory())) {
    const sectionName = section.name;
    const sectionLatex = path.join(latexDir, sectionName);
    const sectionPages = path.join(pagesDir, sectionName);

    // Clean existing topic folders, keep only index.astro
    await fs.mkdir(sectionPages, { recursive: true });
    const existing = await fs.readdir(sectionPages);
    for (const name of existing) {
      if (name !== 'index.astro') {
        rmSync(path.join(sectionPages, name), { recursive: true, force: true });
      }
    }

    const topics = await fs.readdir(sectionLatex, { withFileTypes: true });
    const indexItems = [];

    for (const topicDir of topics.filter(d => d.isDirectory())) {
      const topicName = topicDir.name;
      const topicLatex = path.join(sectionLatex, topicName);
      const topicPages = path.join(sectionPages, topicName);
      await fs.mkdir(topicPages, { recursive: true });

      // Process each .tex file in the topic folder
      const files = await fs.readdir(topicLatex);
      for (const file of files.filter(f => f.endsWith('.tex'))) {
        const base = path.parse(file).name;
        const texPath = path.join(topicLatex, file);
        const outputHtml = path.join(topicPages, 'content.html');
        console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
        execSync(
          `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
          { stdio: 'inherit' }
        );

        // Create or overwrite index.astro for this topic
        const title = humanize(base);
        const indexAstro = `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const title = '${title}';
const sidebarItems = [];
---

<NoteLayout title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
        await fs.writeFile(path.join(topicPages, 'index.astro'), indexAstro);
      }
      indexItems.push({ title: humanize(topicName), href: `/${sectionName}/${topicName}` });
    }

    // Generate section index.astro
    const links = indexItems
      .map(item => `      <a href="${item.href}" class="topic-card">
        <h2>${item.title}</h2>
      </a>`)
      .join('\n');
    const sectionIndex = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="${capitalize(sectionName)} Notes">
  <div class="container">
    <h1>${capitalize(sectionName)} Notes</h1>
    <div class="topic-grid">
${links}
    </div>
  </div>
</BaseLayout>
`;
    await fs.writeFile(path.join(sectionPages, 'index.astro'), sectionIndex);
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
