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

      // Determine if this topic has subtopics
      const entries = await fs.readdir(topicLatex, { withFileTypes: true });
      const subtopics = entries.filter(e => e.isDirectory());
      if (subtopics.length > 0) {
        // Generate each subtopic page and topic index
        const subIndexItems = [];
        for (const subDir of subtopics) {
          const subName = subDir.name;
          const subLatex = path.join(topicLatex, subName);
          const subPages = path.join(topicPages, subName);
          await fs.mkdir(subPages, { recursive: true });

          const texFiles = await fs.readdir(subLatex);
          for (const file of texFiles.filter(f => f.endsWith('.tex'))) {
            const base = path.parse(file).name;
            const texPath = path.join(subLatex, file);
            const outputHtml = path.join(subPages, 'content.html');
            console.log(`Generating HTML for ${texPath} → ${outputHtml}`);
            execSync(
              `pandoc "${texPath}" -s --katex --section-divs --lua-filter=latex/filter.lua --css=style.css -o "${outputHtml}"`,
              { stdio: 'inherit' }
            );

            // Create index.astro for this subtopic
            const title = humanize(base);
            const rawSectionTitle = sectionName === 'cs'
              ? 'Computer Science Notes'
              : `${capitalize(sectionName)} Notes`;
            const indexAstro = `---
import NoteLayout from '../../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
            await fs.writeFile(path.join(subPages, 'index.astro'), indexAstro);
          }
          subIndexItems.push({ title: humanize(subName), href: `/${sectionName}/${topicName}/${subName}` });
        }

        // Create topic index listing its subtopics
        const topicTitle = humanize(topicName);
        const links = subIndexItems
          .map(item => `      <a href="${item.href}" class="subtopic-card">
        <h2>${item.title}</h2>
      </a>`)
          .join('\n');
const topicIndex = `---
import BaseLayout from '../../../layouts/BaseLayout.astro';
---

<BaseLayout title="${topicTitle}">
  <div class="container">
    <h1>${topicTitle}</h1>
    <div class="subtopic-grid">
${links}
    </div>
  </div>
</BaseLayout>
`;
        await fs.writeFile(path.join(topicPages, 'index.astro'), topicIndex);
      } else {
        // No subtopics: process each .tex file in the topic folder
        const texFiles = entries.filter(e => e.isFile() && e.name.endsWith('.tex')).map(e => e.name);
        for (const file of texFiles) {
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
          const rawSectionTitle = sectionName === 'cs'
            ? 'Computer Science Notes'
            : `${capitalize(sectionName)} Notes`;
          const indexAstro = `---
import NoteLayout from '../../../layouts/NoteLayout.astro';
import content from './content.html?raw';

const sectionName = '${sectionName}';
const sectionTitle = '${rawSectionTitle}';
const title = '${title}';
const sidebarItems = [];
---

<NoteLayout sectionName={sectionName} sectionTitle={sectionTitle} title={title} sidebarItems={sidebarItems}>
  <div class="latex-notes" set:html={content} />
</NoteLayout>
`;
          await fs.writeFile(path.join(topicPages, 'index.astro'), indexAstro);
        }
      }
      indexItems.push({ title: humanize(topicName), href: `/${sectionName}/${topicName}` });
    }

    // Generate section index.astro
    const links = indexItems
      .map(item => `      <a href="${item.href}" class="topic-card">
        <h2>${item.title}</h2>
      </a>`)
      .join('\n');
    const sectionTitle = sectionName === 'cs'
      ? 'Computer Science Notes'
      : `${capitalize(sectionName)} Notes`;
    const sectionIndex = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="${sectionTitle}">
  <div class="container">
    <h1>${sectionTitle}</h1>
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
